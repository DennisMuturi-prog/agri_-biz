/**
 * Field status computation utility.
 *
 * Each field gets a computed status based on its stage, notes, and age.
 *
 *  Status        │ Criteria
 * ───────────────┼──────────────────────────────────────────────────────
 *  Completed     │ currentStageId === 4  ("Harvested")
 *  At Risk       │ (a) Growing / Ready with zero notes, OR
 *                │ (b) Growing / Ready with last note older than 14 days, OR
 *                │ (c) Planted (stage 1) for more than 60 days
 *  Active        │ Everything else
 */

/** The stage IDs we expect in the `field_stage` table. */
export const STAGE_IDS = {
  PLANTED: 1,
  GROWING: 2,
  READY: 3,
  HARVESTED: 4,
} as const

export type FieldStatus = "Active" | "At Risk" | "Completed"

/**
 * Input needed from the database to compute a field's status.
 */
export type FieldStatusInput = {
  currentStageId: number
  /** The planting date — accepts a `Date` or epoch-ms `number` (SQLite). */
  plantingDate: Date | number
  /** Total notes recorded for this field (used for a quick zero-check). */
  notesCount?: number
  /** Timestamp of the most recent note (if any) — accepts `Date`, epoch-ms `number`, or `null`. */
  lastNoteCreatedAt?: Date | number | null
}

/**
 * Determine the computed status for a field.
 *
 * Call this server-side when fetching rows so that status is baked into
 * the data passed to client components.
 *
 * @example
 * ```ts
 * const status = computeFieldStatus({
 *   currentStageId: field.currentStageId,
 *   plantingDate: field.plantingDate,
 *   notesCount: field.notesCount,
 *   lastNoteCreatedAt: field.lastNoteCreatedAt,
 * })
 * ```
 */
export function computeFieldStatus(input: FieldStatusInput): FieldStatus {
  const { currentStageId, plantingDate, notesCount, lastNoteCreatedAt } = input

  // Coerce raw numbers (epoch ms from SQLite) into Date objects
  const planted = toDate(plantingDate)
  const lastNote = lastNoteCreatedAt != null ? toDate(lastNoteCreatedAt) : null

  // ── Completed ──────────────────────────────────────────────────────────
  if (currentStageId === STAGE_IDS.HARVESTED) {
    return "Completed"
  }

  const now = new Date()
  const daysSincePlanted = diffDays(now, planted)
  const notesExist = (notesCount ?? 0) > 0

  // ── At Risk ────────────────────────────────────────────────────────────

  // (a) Still in Planted stage after 60 days → stagnation
  if (currentStageId === STAGE_IDS.PLANTED && daysSincePlanted > 60) {
    return "At Risk"
  }

  // (b) Growing or Ready with zero notes → no field activity recorded
  if (
    (currentStageId === STAGE_IDS.GROWING ||
      currentStageId === STAGE_IDS.READY) &&
    !notesExist
  ) {
    return "At Risk"
  }

  // (c) Growing or Ready with last note older than 14 days → stale
  if (
    (currentStageId === STAGE_IDS.GROWING ||
      currentStageId === STAGE_IDS.READY) &&
    lastNote != null
  ) {
    const daysSinceLastNote = diffDays(now, lastNote)
    if (daysSinceLastNote > 14) {
      return "At Risk"
    }
  }

  // ── Active (default) ───────────────────────────────────────────────────
  return "Active"
}

/** Coerce a `Date` or `number` (epoch ms) into a `Date`. */
function toDate(v: Date | number): Date {
  return typeof v === "number" ? new Date(v) : v
}

/** Number of full days between two dates (positive when `a` is after `b`). */
function diffDays(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((a.getTime() - b.getTime()) / msPerDay)
}
