const { PrismaClient } = require('@prisma/client');
require('dotenv').config(); // Ensure environment variables are loaded

const prisma = new PrismaClient();

// Optional: Test connection or perform initial setup
async function main() {
  try {
    await prisma.$connect();
    console.log('Prisma Client Connected!');
  } catch (error) {
    console.error('Error connecting Prisma Client:', error.message);
    process.exit(1); // Exit if can't connect
  }
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

module.exports = prisma;