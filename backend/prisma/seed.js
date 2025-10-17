const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'superadmin@medzillo.com';
    const name = 'Super Admin';
    const password = 'password';

    console.log(`Checking for existing super admin: ${email}`);

    const existingSuperAdmin = await prisma.superAdmin.findUnique({
        where: { email },
    });

    if (existingSuperAdmin) {
        console.log('Super admin already exists. Seeding not required.');
        return;
    }

    console.log('Super admin not found, creating new one...');
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.superAdmin.create({
        data: {
            name,
            email,
            password: hashedPassword,
        },
    });

    console.log('Default super admin created successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });