import bcrypt from 'bcryptjs';
import { AttendanceStatus, ExamType, Gender, PaymentStatus, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
  { email: 'admin@schoolhub.ac.ke', password: 'admin123', firstName: 'Amina', lastName: 'Admin', role: Role.ADMIN, phone: '+254700000001' },
  { email: 'principal@schoolhub.ac.ke', password: 'principal123', firstName: 'Grace', lastName: 'Principal', role: Role.PRINCIPAL, phone: '+254700000002' },
  { email: 'teacher@schoolhub.ac.ke', password: 'teacher123', firstName: 'Peter', lastName: 'Teacher', role: Role.TEACHER, phone: '+254700000003' },
  { email: 'parent@schoolhub.ac.ke', password: 'parent123', firstName: 'Mary', lastName: 'Parent', role: Role.PARENT, phone: '+254700000004' },
  { email: 'bursar@schoolhub.ac.ke', password: 'bursar123', firstName: 'Faith', lastName: 'Bursar', role: Role.BURSAR, phone: '+254700000005' },
  { email: 'store@schoolhub.ac.ke', password: 'store123', firstName: 'John', lastName: 'Store', role: Role.STORE_KEEPER, phone: '+254700000006' },
];

async function upsertUser(input: (typeof users)[number]) {
  const password = await bcrypt.hash(input.password, 12);
  return prisma.user.upsert({
    where: { email: input.email },
    update: { password, firstName: input.firstName, lastName: input.lastName, role: input.role, phone: input.phone, isActive: true, isVerified: true },
    create: { email: input.email, password, firstName: input.firstName, lastName: input.lastName, role: input.role, phone: input.phone, isActive: true, isVerified: true },
  });
}

async function main() {
  const school = await prisma.school.upsert({
    where: { id: 'demo-school' },
    update: {
      name: 'Greenfield High School',
      motto: 'Knowledge, Character, Service',
      phone: '+254 700 111 222',
      email: 'info@greenfield.ac.ke',
      address: 'Nairobi, Kenya',
      logo: '/assets/logo/favicon_io/android-chrome-512x512.png',
      coverImage: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
    },
    create: {
      id: 'demo-school',
      name: 'Greenfield High School',
      motto: 'Knowledge, Character, Service',
      mission: 'To form disciplined learners ready for academic excellence and service.',
      vision: 'A digitally connected school where every learner is known and supported.',
      founded: 1998,
      founder: 'Board of Trustees',
      phone: '+254 700 111 222',
      email: 'info@greenfield.ac.ke',
      website: 'https://greenfield.ac.ke',
      address: 'Nairobi, Kenya',
      region: 'Nairobi County',
      county: 'Nairobi',
      subCounty: 'Westlands',
      ward: 'Parklands',
      logo: '/assets/logo/favicon_io/android-chrome-512x512.png',
      coverImage: '/assets/default-images/ivan-aleksic-PDRFeeDniCk-unsplash.jpg',
      primaryColor: '#2563eb',
      secondaryColor: '#0f766e',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'content' },
    update: {
      value: {
        school: {
          name: school.name,
          motto: school.motto,
          mission: school.mission,
          vision: school.vision,
          founded: school.founded,
          founder: school.founder,
          phone: school.phone,
          email: school.email,
          website: school.website,
          address: school.address,
          region: school.region,
          logo: school.logo,
          coverImage: school.coverImage,
          primaryColor: school.primaryColor,
          secondaryColor: school.secondaryColor,
          tagline: 'Knowledge, Character, Service',
          summary: 'Greenfield High School is a connected learning community in Nairobi focused on academic strength, character formation, and close parent-school communication.',
        },
        navigation: [
          { label: 'Home', href: '/' },
          {
            label: 'About Us',
            href: '/about',
            children: [
              { label: 'About the School', href: '/about-school' },
              { label: 'Board of Management', href: '/board-of-management' },
              { label: 'PTA Members', href: '/pta-members' },
              { label: 'Senior Management', href: '/senior-management' },
              { label: 'Teaching Staff', href: '/teaching-staff' },
            ],
          },
          {
            label: 'Departments',
            href: '/academics',
            children: [
              { label: 'Languages Department', href: '/departments/languages' },
              { label: 'Sciences Department', href: '/departments/sciences' },
              { label: 'Technical & Creative Arts Department', href: '/departments/technical-creative-arts' },
              { label: 'Guidance & Counselling Department', href: '/departments/guidance-counselling' },
              { label: 'Humanities Department', href: '/departments/humanities' },
              { label: 'Boarding Department', href: '/departments/boarding' },
              { label: 'Mathematics Department', href: '/departments/mathematics' },
              { label: 'Co-Curricular Department', href: '/departments/co-curricular' },
            ],
          },
          {
            label: 'Students',
            href: '/life',
            children: [
              { label: 'Form 1', href: '/students/form-1' },
              { label: 'Form 2', href: '/students/form-2' },
              { label: 'Form 3', href: '/students/form-3' },
              { label: 'Form 4', href: '/students/form-4' },
            ],
          },
          {
            label: 'Media',
            href: '/gallery',
            children: [
              { label: 'Gallery', href: '/gallery' },
              { label: 'Downloads', href: '/downloads' },
              { label: 'Events', href: '/events' },
            ],
          },
          { label: 'Contacts', href: '/contact' },
        ],
        heroSlides: [
          {
            id: 'greenfield-main',
            image: school.coverImage,
            title: 'Greenfield High School',
            subtitle: 'Knowledge, Character, Service',
            ctaText: 'Apply Now',
            ctaLink: '/admissions',
          },
        ],
        sections: {
          about: { eyebrow: 'About Greenfield', heading: 'A connected school for focused learning.', description: school.mission },
          values: { eyebrow: 'Our Values', heading: 'Excellence, integrity, service.', description: 'Learners are supported by real-time academic, attendance, finance, and communication systems.' },
          programs: { eyebrow: 'Academics', heading: 'Strong secondary pathways.', description: 'Core sciences, humanities, languages, technology, clubs, and KCSE preparation are tracked through the portal.' },
          life: { eyebrow: 'Student Life', heading: 'Balanced growth inside and outside class.', description: 'Clubs, games, library, meals, transport, and discipline records are connected to the same student profile.' },
          admissions: { eyebrow: 'Admissions', heading: 'Applications for 2026 are open.', description: 'Submit the form online and follow the admission status from review to enrollment.' },
        },
        admissions: {
          heading: 'Admissions Open',
          text: 'Apply for Form 1, continuing student transfer, or consultation with the admissions office.',
          primaryAction: 'Start Application',
          secondaryAction: 'Book a Visit',
        },
        footer: {
          summary: 'Greenfield High School keeps learners, families, and staff connected through one modern school platform.',
          columns: [
            {
              heading: 'School',
              links: [
                { label: 'About Us', href: '/about-school' },
                { label: 'Download', href: '/downloads' },
                { label: 'Senior Management', href: '/senior-management' },
                { label: 'Teaching Staff', href: '/teaching-staff' },
                { label: 'PTA Members', href: '/pta-members' }
              ]
            },
            {
              heading: 'Materials and Assignments',
              links: [
                { label: 'Form 1', href: '/students/form-1' },
                { label: 'Form 2', href: '/students/form-2' },
                { label: 'Form 3', href: '/students/form-3' },
                { label: 'Form 4', href: '/students/form-4' }
              ]
            },
            {
              heading: 'Departments',
              links: [
                { label: 'Co-Curricular Department', href: '/departments/co-curricular' },
                { label: 'Guidance & Counselling Department', href: '/departments/guidance-counselling' },
                { label: 'Humanities Department', href: '/departments/humanities' },
                { label: 'Languages Department', href: '/departments/languages' },
                { label: 'Mathematics Department', href: '/departments/mathematics' },
                { label: 'Sciences Department', href: '/departments/sciences' },
                { label: 'Technical & Creative Arts Department', href: '/departments/technical-creative-arts' },
                { label: 'Boarding Department', href: '/departments/boarding' }
              ]
            }
          ],
          socials: [
            { label: 'Instagram', href: 'https://instagram.com' },
            { label: 'TikTok', href: 'https://www.tiktok.com' },
            { label: 'X', href: 'https://x.com' }
          ],
          bottomText: 'Greenfield High School. All rights reserved.'
        },
      },
      group: 'landing',
      updatedBy: 'seed',
    },
    create: {
      key: 'content',
      group: 'landing',
      updatedBy: 'seed',
      value: {
        school: {
          name: school.name,
          motto: school.motto,
          mission: school.mission,
          vision: school.vision,
          founded: school.founded,
          founder: school.founder,
          phone: school.phone,
          email: school.email,
          website: school.website,
          address: school.address,
          region: school.region,
          logo: school.logo,
          coverImage: school.coverImage,
          primaryColor: school.primaryColor,
          secondaryColor: school.secondaryColor,
          tagline: 'Knowledge, Character, Service',
          summary: 'Greenfield High School is a connected learning community in Nairobi focused on academic strength, character formation, and close parent-school communication.',
        },
        navigation: [
          { label: 'Home', href: '/' },
          {
            label: 'About Us',
            href: '/about',
            children: [
              { label: 'About the School', href: '/about-school' },
              { label: 'Board of Management', href: '/board-of-management' },
              { label: 'PTA Members', href: '/pta-members' },
              { label: 'Senior Management', href: '/senior-management' },
              { label: 'Teaching Staff', href: '/teaching-staff' },
            ],
          },
          {
            label: 'Departments',
            href: '/academics',
            children: [
              { label: 'Languages Department', href: '/departments/languages' },
              { label: 'Sciences Department', href: '/departments/sciences' },
              { label: 'Technical & Creative Arts Department', href: '/departments/technical-creative-arts' },
              { label: 'Guidance & Counselling Department', href: '/departments/guidance-counselling' },
              { label: 'Humanities Department', href: '/departments/humanities' },
              { label: 'Boarding Department', href: '/departments/boarding' },
              { label: 'Mathematics Department', href: '/departments/mathematics' },
              { label: 'Co-Curricular Department', href: '/departments/co-curricular' },
            ],
          },
          {
            label: 'Students',
            href: '/life',
            children: [
              { label: 'Form 1', href: '/students/form-1' },
              { label: 'Form 2', href: '/students/form-2' },
              { label: 'Form 3', href: '/students/form-3' },
              { label: 'Form 4', href: '/students/form-4' },
            ],
          },
          {
            label: 'Media',
            href: '/gallery',
            children: [
              { label: 'Gallery', href: '/gallery' },
              { label: 'Downloads', href: '/downloads' },
              { label: 'Events', href: '/events' },
            ],
          },
          { label: 'Contacts', href: '/contact' },
        ],
        heroSlides: [
          {
            id: 'greenfield-main',
            image: school.coverImage,
            title: 'Greenfield High School',
            subtitle: 'Knowledge, Character, Service',
            ctaText: 'Apply Now',
            ctaLink: '/admissions',
          },
        ],
        sections: {
          about: { eyebrow: 'About Greenfield', heading: 'A connected school for focused learning.', description: school.mission },
          values: { eyebrow: 'Our Values', heading: 'Excellence, integrity, service.', description: 'Learners are supported by real-time academic, attendance, finance, and communication systems.' },
          programs: { eyebrow: 'Academics', heading: 'Strong secondary pathways.', description: 'Core sciences, humanities, languages, technology, clubs, and KCSE preparation are tracked through the portal.' },
          life: { eyebrow: 'Student Life', heading: 'Balanced growth inside and outside class.', description: 'Clubs, games, library, meals, transport, and discipline records are connected to the same student profile.' },
          admissions: { eyebrow: 'Admissions', heading: 'Applications for 2026 are open.', description: 'Submit the form online and follow the admission status from review to enrollment.' },
        },
        admissions: {
          heading: 'Admissions Open',
          text: 'Apply for Form 1, continuing student transfer, or consultation with the admissions office.',
          primaryAction: 'Start Application',
          secondaryAction: 'Book a Visit',
        },
        footer: {
          summary: 'Greenfield High School keeps learners, families, and staff connected through one modern school platform.',
          columns: [
            {
              heading: 'School',
              links: [
                { label: 'About Us', href: '/about-school' },
                { label: 'Download', href: '/downloads' },
                { label: 'Senior Management', href: '/senior-management' },
                { label: 'Teaching Staff', href: '/teaching-staff' },
                { label: 'PTA Members', href: '/pta-members' }
              ]
            },
            {
              heading: 'Materials and Assignments',
              links: [
                { label: 'Form 1', href: '/students/form-1' },
                { label: 'Form 2', href: '/students/form-2' },
                { label: 'Form 3', href: '/students/form-3' },
                { label: 'Form 4', href: '/students/form-4' }
              ]
            },
            {
              heading: 'Departments',
              links: [
                { label: 'Co-Curricular Department', href: '/departments/co-curricular' },
                { label: 'Guidance & Counselling Department', href: '/departments/guidance-counselling' },
                { label: 'Humanities Department', href: '/departments/humanities' },
                { label: 'Languages Department', href: '/departments/languages' },
                { label: 'Mathematics Department', href: '/departments/mathematics' },
                { label: 'Sciences Department', href: '/departments/sciences' },
                { label: 'Technical & Creative Arts Department', href: '/departments/technical-creative-arts' },
                { label: 'Boarding Department', href: '/departments/boarding' }
              ]
            }
          ],
          socials: [
            { label: 'Instagram', href: 'https://instagram.com' },
            { label: 'TikTok', href: 'https://www.tiktok.com' },
            { label: 'X', href: 'https://x.com' }
          ],
          bottomText: 'Greenfield High School. All rights reserved.'
        },
      },
    },
  });

  const createdUsers = new Map<Role, Awaited<ReturnType<typeof upsertUser>>>();
  for (const user of users) {
    createdUsers.set(user.role, await upsertUser(user));
  }

  const parentUser = createdUsers.get(Role.PARENT)!;
  const teacherUser = createdUsers.get(Role.TEACHER)!;
  const bursarUser = createdUsers.get(Role.BURSAR)!;
  const storeUser = createdUsers.get(Role.STORE_KEEPER)!;

  const teacher = await prisma.teacher.upsert({
    where: { email: teacherUser.email },
    update: {
      firstName: teacherUser.firstName,
      lastName: teacherUser.lastName,
      phone: teacherUser.phone || '+254700000003',
      subject: 'Mathematics',
      dateHired: new Date('2018-01-08'),
    },
    create: {
      firstName: teacherUser.firstName,
      lastName: teacherUser.lastName,
      email: teacherUser.email,
      phone: teacherUser.phone || '+254700000003',
      subject: 'Mathematics',
      qualification: 'B.Ed Mathematics',
      experience: 8,
      dateHired: new Date('2018-01-08'),
      userId: teacherUser.id,
    },
  });

  const form3A = await prisma.class.upsert({
    where: { id: 'demo-class-form-3-a' },
    update: { name: 'Form 3', stream: 'A', classTeacherId: teacher.id },
    create: { id: 'demo-class-form-3-a', schoolId: school.id, name: 'Form 3', stream: 'A', capacity: 45, classTeacherId: teacher.id },
  });

  const form1B = await prisma.class.upsert({
    where: { id: 'demo-class-form-1-b' },
    update: { name: 'Form 1', stream: 'B' },
    create: { id: 'demo-class-form-1-b', schoolId: school.id, name: 'Form 1', stream: 'B', capacity: 50 },
  });

  const mathematics = await prisma.subject.upsert({
    where: { id: 'demo-subject-mathematics' },
    update: { name: 'Mathematics', code: 'MAT', category: 'Sciences' },
    create: { id: 'demo-subject-mathematics', schoolId: school.id, name: 'Mathematics', code: 'MAT', category: 'Sciences', isCore: true },
  });

  await prisma.teacherSubject.upsert({
    where: { id: 'demo-teacher-mathematics' },
    update: { teacherId: teacher.id, subjectId: mathematics.id },
    create: { id: 'demo-teacher-mathematics', teacherId: teacher.id, subjectId: mathematics.id },
  });

  const parent = await prisma.parent.upsert({
    where: { email: parentUser.email },
    update: { firstName: parentUser.firstName, lastName: parentUser.lastName, phone: parentUser.phone || '+254700000004', relationship: 'Mother' },
    create: {
      firstName: parentUser.firstName,
      lastName: parentUser.lastName,
      email: parentUser.email,
      phone: parentUser.phone || '+254700000004',
      relationship: 'Mother',
      userId: parentUser.id,
    },
  });

  for (const staffUser of [
    { user: bursarUser, staffRole: 'Bursar', department: 'Finance' },
    { user: storeUser, staffRole: 'Store Keeper', department: 'Stores' },
  ]) {
    await prisma.staff.upsert({
      where: { email: staffUser.user.email },
      update: {
        firstName: staffUser.user.firstName,
        lastName: staffUser.user.lastName,
        phone: staffUser.user.phone || '+254700000000',
        staffRole: staffUser.staffRole,
        department: staffUser.department,
        dateHired: new Date('2020-01-06'),
      },
      create: {
        firstName: staffUser.user.firstName,
        lastName: staffUser.user.lastName,
        email: staffUser.user.email,
        phone: staffUser.user.phone || '+254700000000',
        staffRole: staffUser.staffRole,
        department: staffUser.department,
        dateHired: new Date('2020-01-06'),
        userId: staffUser.user.id,
      },
    });
  }

  const students = [
    { id: 'demo-student-1', admissionNumber: 'GHS-2024-001', firstName: 'Amina', lastName: 'Otieno', gender: Gender.FEMALE, classId: form3A.id, stream: 'A', score: 78 },
    { id: 'demo-student-2', admissionNumber: 'GHS-2025-014', firstName: 'Brian', lastName: 'Otieno', gender: Gender.MALE, classId: form1B.id, stream: 'B', score: 71 },
    { id: 'demo-student-3', admissionNumber: 'GHS-2023-077', firstName: 'Kevin', lastName: 'Mwangi', gender: Gender.MALE, classId: form3A.id, stream: 'A', score: 84 },
  ];

  for (const student of students) {
    await prisma.student.upsert({
      where: { admissionNumber: student.admissionNumber },
      update: { firstName: student.firstName, lastName: student.lastName, classId: student.classId, stream: student.stream, parentId: parent.id },
      create: {
        id: student.id,
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        classId: student.classId,
        stream: student.stream,
        dateOfBirth: new Date('2010-01-15'),
        parentId: parent.id,
        address: 'Nairobi, Kenya',
        allergies: [],
      },
    });

    await prisma.fee.upsert({
      where: { id: `demo-fee-${student.id}` },
      update: { amount: 50000, status: PaymentStatus.PENDING, term: 2 },
      create: { id: `demo-fee-${student.id}`, studentId: student.id, amount: 50000, type: 'TUITION', term: 2, year: 2026, status: PaymentStatus.PENDING, dueDate: new Date('2026-06-14') },
    });

    await prisma.fee.upsert({
      where: { id: `demo-payment-${student.id}` },
      update: { amount: 35000, status: PaymentStatus.COMPLETED, term: 2 },
      create: {
        id: `demo-payment-${student.id}`,
        studentId: student.id,
        amount: 35000,
        type: 'MPESA_PAYMENT',
        term: 2,
        year: 2026,
        status: PaymentStatus.COMPLETED,
        dueDate: new Date('2026-06-14'),
        paidDate: new Date('2026-05-10'),
        reference: `MPESA-${student.id}`,
      },
    });

    await prisma.attendance.upsert({
      where: { id: `demo-attendance-${student.id}` },
      update: { status: AttendanceStatus.PRESENT },
      create: { id: `demo-attendance-${student.id}`, studentId: student.id, classId: student.classId, status: AttendanceStatus.PRESENT, date: new Date('2026-05-20') },
    });

    await prisma.result.upsert({
      where: { id: `demo-result-${student.id}` },
      update: { score: student.score, grade: student.score >= 80 ? 'A' : student.score >= 75 ? 'A-' : 'B+' },
      create: {
        id: `demo-result-${student.id}`,
        studentId: student.id,
        subjectId: mathematics.id,
        examType: ExamType.CAT1,
        score: student.score,
        grade: student.score >= 80 ? 'A' : student.score >= 75 ? 'A-' : 'B+',
        teacherId: teacher.id,
        term: 2,
        year: 2026,
        remarks: 'Strong progress',
      },
    });
  }

  await prisma.inventoryItem.upsert({
    where: { id: 'demo-stock-1' },
    update: { quantity: 120 },
    create: { id: 'demo-stock-1', name: 'Exercise Books', category: 'Stationery', quantity: 120, unit: 'pieces', minThreshold: 80, price: 45, supplier: 'Nairobi Stationers', location: 'Main store' },
  });

  console.log('Seed complete. Demo accounts: admin/admin123, principal/principal123, teacher/teacher123, parent/parent123, bursar/bursar123, store/store123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
