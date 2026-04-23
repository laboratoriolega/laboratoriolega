process.env.TZ = 'America/Argentina/Buenos_Aires';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
