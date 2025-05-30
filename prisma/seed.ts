import bcrypt from 'bcrypt'
import postgres from 'postgres'
import { invoices, customers as mockCustomers, revenue, users } from '../app/lib/placeholder-data'

// Conexión directa a Neon (o la que tengas en .env)
const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' })

type SqlClient = typeof sql

async function seedUsers(tx: SqlClient) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
  await tx`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `
  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10)
    await tx`
      INSERT INTO users (id, name, email, password)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${hash})
      ON CONFLICT (id) DO NOTHING;
    `
  }
}

async function seedCustomers(tx: SqlClient) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
  await tx`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `
  for (const c of mockCustomers) {
    await tx`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${c.id}, ${c.name}, ${c.email}, ${c.image_url})
      ON CONFLICT (id) DO NOTHING;
    `
  }
}

async function seedInvoices(tx: SqlClient) {
  await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`
  await tx`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `
  for (const inv of invoices) {
    await tx`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${inv.customer_id}, ${inv.amount}, ${inv.status}, ${inv.date})
      ON CONFLICT (id) DO NOTHING;
    `
  }
}

async function seedRevenue(tx: SqlClient) {
  await tx`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `
  for (const r of revenue) {
    await tx`
      INSERT INTO revenue (month, revenue)
      VALUES (${r.month}, ${r.revenue})
      ON CONFLICT (month) DO NOTHING;
    `
  }
}

async function main() {
  console.log('🌱 Seeding database...')
  await sql.begin(async (tx) => {
    await seedUsers(tx)
    await seedCustomers(tx)
    await seedInvoices(tx)
    await seedRevenue(tx)
  })
  console.log('✅ Database seeded successfully')
  await sql.end()
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
