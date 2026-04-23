import { fieldStage } from "./field-stage"
import {user} from "./auth-schema"
import { integer, sqliteTable,text } from "drizzle-orm/sqlite-core";
import { relations ,sql} from "drizzle-orm";
import { note } from "./note";

export const field = sqliteTable("field", {
  // to make integer primary key auto increment
  id: integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  cropType: text("crop_type").notNull(),
  plantingDate: integer("planting_date", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  currentStageId: integer("current_stage")
    .notNull()
    .references(() => fieldStage.id, { onDelete: "cascade" }),
  fieldAgentId: text("field_agent_id")
    .references(() => user.id, { onDelete: "cascade" })
})

export const fieldRelations = relations(field, ({ one, many }) => ({
  notes:many(note),
  fieldStage: one(fieldStage, {
    fields: [field.currentStageId],
    references: [fieldStage.id],
  }),
  fieldAgent: one(user, {
    fields: [field.fieldAgentId],
    references: [user.id],
  }),
}));



