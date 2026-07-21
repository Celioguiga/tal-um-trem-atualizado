import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "celinhoguiga@gmail.com";
  const senha = process.env.ADMIN_PASSWORD ?? "waldorf123";
  const nome = process.env.ADMIN_NOME ?? "Guiga";

  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: { nome, email, senhaHash },
  });

  console.log(`Usuário administrador pronto: ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Senha inicial: ${senha} (defina ADMIN_PASSWORD no .env para trocar)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
