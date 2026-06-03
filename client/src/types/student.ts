export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  name?: string; // Computed property for UI compatibility (firstName + lastName)
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  class: string;
  classId?: string;
  className?: string;
  stream?: string;
  streamId?: string;
  isActive?: boolean;
  admissionDate?: string;
  boardingStatus?: 'BOARDING' | 'DAY';
  parentId: string;
  photo?: string;
  address?: string;
  phone?: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string[] | string;
  medicalNotes?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  guardianName?: string;
  guardianPhone?: string;
  feeDiscount?: number;
  scholarship?: boolean;
  bursary?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  occupation?: string;
  address?: string;
  students: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  classes: string[];
  photo?: string;
  qualification?: string;
  experience?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department?: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}
