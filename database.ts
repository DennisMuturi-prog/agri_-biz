import "dotenv/config"
import { drizzle } from "drizzle-orm/libsql"
import { config } from "dotenv"

import * as schema from "db/schema"
config({ path: ".env" })

// export const db = drizzle(process.env.DB_FILE_NAME!, {
//   schema,
// });
export const db = drizzle({
  connection: {
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  schema,
})
