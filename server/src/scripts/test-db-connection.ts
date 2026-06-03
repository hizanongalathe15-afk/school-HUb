import { connectDatabase, disconnectDatabase } from '../config/database.js';

async function main() {
  const prisma = await connectDatabase();
  const [users, students, school] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.school.findFirst()
  ]);

  console.log(JSON.stringify({
    status: 'ok',
    database: 'connected',
    users,
    students,
    school: school?.name || null
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => disconnectDatabase());
