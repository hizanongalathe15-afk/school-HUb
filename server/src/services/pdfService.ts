import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const pdfService = {
  async generateReceipt(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { student: true, fee: true }
    });

    if (!payment) return null;

    return {
      receiptNumber: payment.receiptNumber,
      date: payment.paymentDate,
      student: `${payment.student.firstName} ${payment.student.lastName}`,
      amount: payment.amount,
      method: payment.method,
      payments: [payment]
    };
  },

  async generateReportCard(studentId: string, term?: number, year?: number) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { 
        class: true,
        results: { include: { subject: true } }
      }
    });

    if (!student) return null;

    const results = student.results.filter((r: any) =>
      (!term || r.term === term) && (!year || r.year === year)
    );

    return {
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      class: student.class?.name,
      term,
      year,
      results
    };
  },

  async generateKCSEAnalysis(schoolId: string, year: number) {
    const analysis = await prisma.kCSEAnalysis.findFirst({
      where: { schoolId, year }
    });
    return analysis;
  }
};