import { sqliteTable,integer,text } from "drizzle-orm/sqlite-core";
import { field } from "./field";
import { relations ,sql} from "drizzle-orm";

export const note = sqliteTable('note', {
  // to make integer primary key auto increment
  id:integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  observation: text('observation').notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  fieldId:integer("field_id")
    .notNull()
    .references(() => field.id, { onDelete: "cascade" }),
})

export const noteRelations = relations(note, ({ one }) => ({
  field: one(field, {
    fields: [note.fieldId],
    references: [field.id],
  }),
}));