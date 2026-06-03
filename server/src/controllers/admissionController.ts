import { Request, Response } from 'express';
import { Gender, PrismaClient, Role } from '@prisma/client';
import { hasFullAccess } from '../utils/accessControl.js';
import { automationFlowManifest, parentSelfClaimStudent, registerStudentWithAutoAssignment } from '../services/automationService.js';

const prisma = new PrismaClient();

function normalizeGender(value: string): Gender {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'MALE' || normalized === 'M') return Gender.MALE;
  if (normalized === 'FEMALE' || normalized === 'F') return Gender.FEMALE;
  return Gender.OTHER;
}

function splitName(fullName?: string) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Parent',
    lastName: parts.slice(1).join(' ') || 'Guardian'
  };
}

function serializeParentClaim(result: any) {
  return {
    parent: result.parent,
    student: result.student,
    user: result.user ? {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
      phone: result.user.phone
    } : undefined
  };
}

export const admissionController = {
  // Guest can submit an application
  submitApplication: async (req: Request, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        email,
        phone,
        address,
        parentName,
        parentPhone,
        parentEmail,
        desiredClass,
        desiredStream,
        previousSchool,
        previousClass,
        academicYear,
        term,
        documents = [],
      } = req.body;

      // Basic validation
      if (!firstName || !lastName || !dateOfBirth || !gender || !parentName || !parentPhone || !parentEmail) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }

      const application = await prisma.admissionApplication.create({
        data: {
          firstName,
          lastName,
          middleName: middleName || undefined,
          dateOfBirth: new Date(dateOfBirth),
          gender: normalizeGender(gender),
          email,
          phone,
          address: address || undefined,
          parentName: parentName || undefined,
          parentPhone: parentPhone || undefined,
          parentEmail: parentEmail || undefined,
          desiredClass: desiredClass || undefined,
          desiredStream: desiredStream || undefined,
          previousSchool: previousSchool || undefined,
          previousClass: previousClass || undefined,
          academicYear: Number(academicYear || new Date().getFullYear()),
          term: Number(term || 1),
          documents,
        },
      });

      res.status(201).json({ message: 'Application submitted for admin approval', data: application });
    } catch (error: any) {
      console.error('Admission application error:', error);
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'An application with this email already exists' });
      }
      res.status(500).json({ message: 'Unable to submit application' });
    }
  },

  // Get all applications (admin/principal only)
  getApplications: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      if (!hasFullAccess(authUser.role) && authUser.role !== Role.PRINCIPAL && authUser.role !== Role.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const applications = await prisma.admissionApplication.findMany({
        orderBy: { applicationDate: 'desc' },
      });

      res.json({ data: applications });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load applications' });
    }
  },

  // Get application by ID (admin/principal only)
  getApplicationById: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      if (!hasFullAccess(authUser.role) && authUser.role !== Role.PRINCIPAL && authUser.role !== Role.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const application = await prisma.admissionApplication.findUnique({
        where: { id: req.params.id },
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      res.json({ data: application });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load application' });
    }
  },

  // Update application status (admin/principal only)
  updateApplicationStatus: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      if (!hasFullAccess(authUser.role) && authUser.role !== Role.PRINCIPAL && authUser.role !== Role.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { status, notes } = req.body;
      if (!status || !['PENDING', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ENROLLED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const application = await prisma.admissionApplication.findUnique({
        where: { id: req.params.id },
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (status === 'APPROVED') {
        const school = await prisma.school.findFirst();
        if (!school) {
          return res.status(400).json({ message: 'Create a school profile before approving applications' });
        }

        const parentName = splitName(application.parentName || `${application.firstName} guardian`);
        const enrollment = await registerStudentWithAutoAssignment(
          school.id,
          {
            firstName: application.firstName,
            lastName: application.lastName,
            middleName: application.middleName || undefined,
            dateOfBirth: application.dateOfBirth,
            gender: application.gender,
            previousSchool: application.previousSchool || undefined,
            previousClass: application.previousClass || undefined
          },
          {
            ...parentName,
            email: application.parentEmail || application.email,
            phone: application.parentPhone || application.phone,
            relationship: 'Guardian',
            address: application.address || undefined
          }
        );

        const updated = await prisma.admissionApplication.update({
          where: { id: application.id },
          data: {
            status: 'ENROLLED',
            notes: [
              notes,
              `Auto-enrolled as ${enrollment.admissionNumber} in ${enrollment.classAssigned.className}${enrollment.classAssigned.stream}.`,
              `${enrollment.teachers.length} teachers linked and ${enrollment.chatRooms.filter(Boolean).length} chat rooms prepared.`
            ].filter(Boolean).join('\n')
          },
        });

        return res.json({
          message: 'Application approved and student fully enrolled',
          data: updated,
          automation: enrollment
        });
      }

      const updated = await prisma.admissionApplication.update({
        where: { id: req.params.id },
        data: { status: status === 'PENDING_APPROVAL' ? 'PENDING' : status, notes },
      });

      res.json({ message: 'Application status updated', data: updated });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Application not found' });
      }
      res.status(500).json({ message: 'Unable to update application' });
    }
  },

  connectExistingStudent: async (req: Request, res: Response) => {
    try {
      const {
        admissionNumber,
        dateOfBirth,
        parentName,
        parentPhone,
        parentEmail,
        relationship = 'Guardian'
      } = req.body;

      if (!admissionNumber || !dateOfBirth || !parentName || !parentPhone || !parentEmail) {
        return res.status(400).json({ message: 'Admission number, child date of birth, and parent contact details are required' });
      }

      const student = await prisma.student.findUnique({
        where: { admissionNumber },
        select: { id: true, dateOfBirth: true }
      });

      if (!student) {
        return res.status(404).json({ message: 'Student not found. Check the admission number and try again.' });
      }

      const providedDob = new Date(dateOfBirth).toISOString().slice(0, 10);
      const storedDob = student.dateOfBirth.toISOString().slice(0, 10);
      if (providedDob !== storedDob) {
        return res.status(403).json({ message: 'Verification failed. The date of birth does not match school records.' });
      }

      const names = splitName(parentName);
      const result = await parentSelfClaimStudent(
        {
          firstName: names.firstName,
          lastName: names.lastName,
          email: parentEmail,
          phone: parentPhone,
          relationship
        },
        { admissionNumber }
      );

      res.status(201).json({
        message: 'Parent connected to existing student successfully',
        data: serializeParentClaim(result)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Unable to connect parent to student' });
    }
  },

  automationManifest: async (_req: Request, res: Response) => {
    res.json({ data: automationFlowManifest });
  },

  // Get admission form template (public)
  getFormTemplate: async (_req: Request, res: Response) => {
    try {
      // Get the active form template for the school
      const template = await prisma.admissionFormTemplate.findFirst({
        where: { isActive: true },
        include: { school: true },
      });

      if (!template) {
        // Return a default template if none is set
        return res.json({
          data: {
            id: 'default',
            name: 'General Admission Form',
            description: 'Standard admission application form',
            fields: [
              { name: 'firstName', label: 'First Name', type: 'text', required: true },
              { name: 'lastName', label: 'Last Name', type: 'text', required: true },
              { name: 'middleName', label: 'Middle Name', type: 'text' },
              { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
              { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
              { name: 'email', label: 'Email Address', type: 'email', required: true },
              { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
              { name: 'address', label: 'Address', type: 'textarea' },
              { name: 'parentName', label: 'Parent/Guardian Name', type: 'text' },
              { name: 'parentPhone', label: 'Parent Phone Number', type: 'tel' },
              { name: 'parentEmail', label: 'Parent Email', type: 'email' },
              { name: 'desiredClass', label: 'Desired Class', type: 'text', required: true },
              { name: 'desiredStream', label: 'Desired Stream', type: 'text' },
              { name: 'previousSchool', label: 'Previous School', type: 'text' },
              { name: 'previousClass', label: 'Previous Class', type: 'text' },
              { name: 'academicYear', label: 'Academic Year', type: 'number', required: true },
              { name: 'term', label: 'Term', type: 'number', required: true, min: 1, max: 3 },
            ],
            school: {
              name: 'School Name',
              logo: '',
            },
          },
        });
      }

      res.json({ data: template });
    } catch (error) {
      res.status(500).json({ message: 'Unable to load admission form template' });
    }
  },

  // Create or update form template (admin/principal only)
  manageFormTemplate: async (req: Request, res: Response) => {
    try {
      const authUser = (req as any).user as { userId: string; role: string };
      if (!hasFullAccess(authUser.role) && authUser.role !== Role.PRINCIPAL && authUser.role !== Role.ADMIN) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const {
        id,
        name,
        description,
        fields,
        isActive,
        schoolId,
      } = req.body;

      const school = schoolId
        ? await prisma.school.findUnique({ where: { id: schoolId } })
        : await prisma.school.findFirst();

      if (!school) {
        return res.status(400).json({ message: 'Create a school profile before saving admission templates' });
      }

      let template;
      if (id) {
        // Update existing
        template = await prisma.admissionFormTemplate.update({
          where: { id },
          data: {
            name: name || undefined,
            description: description || undefined,
            fields: fields || undefined,
            isActive: isActive ?? undefined,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new
        template = await prisma.admissionFormTemplate.create({
          data: {
            name: name || 'New Admission Form',
            description: description || '',
            fields: fields || [],
            isActive: isActive ?? true,
            createdBy: authUser.userId,
            schoolId: school.id,
          },
        });
      }

      res.json({ message: 'Admission form template saved', data: template });
    } catch (error) {
      res.status(500).json({ message: 'Unable to save admission form template' });
    }
  },
};
