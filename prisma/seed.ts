// Fills the database with one sample wedding so the invitation page can be
// tried with real data. Safe to run again: it removes its own sample first.
// Run with: npm run seed
import { newGuestToken } from '#/server/auth/token'
import { db } from '#/server/db'

// This script runs outside Next.js, so it loads .env itself.
process.loadEnvFile()

// A fixed id marks everything this script owns, so re-running it never
// touches a real host's events.
const SAMPLE_HOST_ID = '00000000-0000-4000-8000-000000000001'

async function main() {
  const prisma = db()

  await prisma.event.deleteMany({ where: { ownerId: SAMPLE_HOST_ID } })
  await prisma.user.upsert({
    where: { id: SAMPLE_HOST_ID },
    create: {
      id: SAMPLE_HOST_ID,
      email: 'sample-host@example.com',
      name: 'Sample Host',
    },
    update: {},
  })

  const event = await prisma.event.create({
    data: {
      ownerId: SAMPLE_HOST_ID,
      type: 'wedding',
      title: 'Mika & Paolo',
      eventDate: new Date('2027-06-12'),
      replyBy: new Date('2027-03-31'),
      status: 'published',
      themeKey: 'black-and-white',
      details: {
        headline:
          'Together with their families, they invite you to their wedding',
        ceremony: { venue: 'San Agustin Church, Manila', time: '3:00 PM' },
        reception: { venue: 'The Glass Garden, Pasig', time: '6:00 PM' },
      },
    },
  })

  const people = [
    {
      name: 'Ana Reyes',
      role: 'Maid of Honor',
      ask: 'Will you stand beside me as my maid of honor?',
      attire: 'Floor-length gown in champagne',
    },
    {
      name: 'Marco Dela Cruz',
      role: 'Best Man',
      ask: 'Will you stand beside me as my best man?',
      attire: 'Black suit, white shirt',
    },
    {
      name: 'Bea Cruz',
      role: 'Bridesmaid',
      ask: 'Will you be one of my bridesmaids?',
      attire: 'Floor-length gown in sage',
    },
  ]

  console.log('Sample invitations (open while `npm run dev` is running):')
  for (const person of people) {
    const role = await prisma.role.create({
      data: {
        eventId: event.id,
        title: person.role,
        askText: person.ask,
        note: 'It would mean the world to have you with us.',
        attire: person.attire,
      },
    })
    const guest = await prisma.guest.create({
      data: {
        eventId: event.id,
        roleId: role.id,
        name: person.name,
        token: newGuestToken(),
      },
    })
    console.log(`  ${person.name}: http://localhost:3000/i/${guest.token}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db().$disconnect())
