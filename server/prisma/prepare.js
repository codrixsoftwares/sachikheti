import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || '';
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');

const targetSchema = path.join(__dirname, 'schema.prisma');
const pgSchema = path.join(__dirname, 'schema.postgresql.prisma');
const sqliteSchema = path.join(__dirname, 'schema.sqlite.prisma');

if (isPostgres) {
  console.log('🔄 Detected PostgreSQL connection string. Switching to PostgreSQL Prisma schema...');
  fs.copyFileSync(pgSchema, targetSchema);
  console.log('✅ Updated schema.prisma for PostgreSQL');
} else {
  console.log('📦 Using local SQLite Prisma schema...');
  if (fs.existsSync(sqliteSchema)) {
    fs.copyFileSync(sqliteSchema, targetSchema);
    console.log('✅ Updated schema.prisma for SQLite');
  }
}
