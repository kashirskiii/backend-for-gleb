import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const SALT_ROUNDS = 10;

  const [teacherHash, studentHash] = await Promise.all([
    bcrypt.hash("teacher-password", SALT_ROUNDS),
    bcrypt.hash("student-password", SALT_ROUNDS),
  ]);

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@example.com" },
    update: {},
    create: {
      email: "teacher@example.com",
      name: "Teacher User",
      role: UserRole.teacher,
      passwordHash: teacherHash,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      name: "Student User",
      role: UserRole.student,
      passwordHash: studentHash,
    },
  });

  console.log("Seed complete:");
  console.log(`  teacher → ${teacher.email} (id: ${teacher.id})`);
  console.log(`  student → ${student.email} (id: ${student.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
