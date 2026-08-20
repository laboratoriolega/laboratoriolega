const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sheets = await prisma.prestaciones.findMany({
    select: { sheet_name: true },
    distinct: ['sheet_name']
  });
  console.log(sheets);
}

main().catch(console.error);
