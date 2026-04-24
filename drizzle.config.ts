import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './db/schema.ts',
  dialect: 'turso',
  // dbCredentials: {
  //   url: process.env.DB_FILE_NAME!,
  // },
  dbCredentials: {
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    },
});
