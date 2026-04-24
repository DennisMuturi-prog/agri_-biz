import "dotenv/config"
import { db } from "../database"
import { fieldStage } from "../db/field-stage"

const stages = [
  { name: "Planted" },
  { name: "Growing" },
  { name: "Ready" },
  { name: "Harvested" },
]

async function main() {
  console.log("🌱 Seeding field stages...")

  for (const stage of stages) {
    try {
      await db.insert(fieldStage).values(stage)
      console.log(`  ✅ Inserted "${stage.name}"`)
    } catch (err: any) {
      if (err?.code === "SQLITE_CONSTRAINT") {
        console.log(`  ⏭️  "${stage.name}" already exists, skipping`)
      } else {
        throw err
      }
    }
  }

  // Verify
  const all = await db.select().from(fieldStage)
  console.log(`\n📋 Field stages in database:`)
  all.forEach((s) => console.log(`  - ${s.name} (id: ${s.id})`))

  console.log("\n✨ Done!")
  process.exit(0)
}

main().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
