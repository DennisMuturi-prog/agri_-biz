import "dotenv/config"
import { db } from "../database"
import { user } from "../db/auth-schema"
import { eq, ne } from "drizzle-orm"

const email = process.argv[2]

async function main() {
  if (!email) {
    console.error("❌ Usage: npx tsx scripts/set-admin.ts <user-email>")
    process.exit(1)
  }

  // 1. Promote the specified user to admin
  const [admin] = await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.email, email))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })

  if (!admin) {
    console.error(`❌ No user found with email "${email}"`)
    process.exit(1)
  }
  console.log(`✅ Promoted "${admin.name}" (${admin.email}) to admin`)

  // 2. Set all other users to field_agent
  await db
    .update(user)
    .set({ role: "field_agent" })
    .where(ne(user.email, email))

  console.log(`✅ Updated remaining users to field_agent`)

  // 3. Verify
  const allUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .orderBy(user.role)

  console.log("\n📋 All users:")
  allUsers.forEach((u) =>
    console.log(`  - ${u.name} (${u.email}) → ${u.role ?? "null"}`)
  )

  process.exit(0)
}

main().catch((err) => {
  console.error("❌ Failed:", err)
  process.exit(1)
})
