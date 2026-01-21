import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const adminPassword = await hash('admin123', 10)
    const clientPassword = await hash('client123', 10)

    const admin = await prisma.user.upsert({
        where: { email: 'admin@pinescript.com' },
        update: {},
        create: {
            email: 'admin@pinescript.com',
            name: 'Admin Developer',
            password: adminPassword,
            role: 'ADMIN',
        },
    })

    const client = await prisma.user.upsert({
        where: { email: 'client@pinescript.com' },
        update: {},
        create: {
            email: 'client@pinescript.com',
            name: 'Test Client',
            password: clientPassword,
            role: 'CLIENT',
        },
    })

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
