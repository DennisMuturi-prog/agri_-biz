import { sqliteTable,integer,text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { field } from "./field";

export const fieldStage = sqliteTable('field_stage', {
  // to make integer primary key auto increment
  id:integer({ mode: 'number' }).primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
})
export const fieldStageRelations = relations(fieldStage, ({ many }) => ({
  fields: many(field),
}));