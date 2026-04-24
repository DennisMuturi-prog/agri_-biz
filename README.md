# AgriBiz — Agricultural Field Management

A field management application for agricultural operations. Built with **Next.js 16**, **better-auth**, **Drizzle ORM** (SQLite / Turso), **shadcn/ui**, and **pnpm**.

## Setup Instructions

### Prerequisites

- **Node.js** 20+
- **pnpm** (`npm install -g pnpm`)
- A **Turso** database (or local SQLite file)

### 1. Clone & Install

```bash
git clone <repo-url> agri_biz
cd agri_biz
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
TURSO_CONNECTION_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token
```

If you prefer a local SQLite file instead of Turso, uncomment the file-based connection in `database.ts` and set:

```env
DB_FILE_NAME=file:./local.db
```

### 3. Run Database Migrations

```bash
pnpm run db:push
```

This applies the Drizzle schema (`db/schema.ts`) to your database.

### 4. Start the Development Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### 5. First User

The **first user** to sign up is automatically assigned the **admin** role. All subsequent users start as **unassigned** — an admin must promote them to **field agent** via the Team page (`/dashboard/team`).

---

## Architecture & Design Decisions

### Tech Stack

| Layer        | Choice                   | Rationale                                                                 |
|--------------|--------------------------|---------------------------------------------------------------------------|
| Framework    | Next.js 16 (App Router)  | Server components by default, RSC streaming, simplified data fetching     |
| Auth         | better-auth              | Lightweight, built-in admin plugin, session-based auth with React client  |
| Database     | Turso (SQLite edge)      | Serverless, low-latency, familiar SQLite syntax via libSQL                |
| ORM          | Drizzle ORM              | Type-safe, lightweight, excellent SQLite support, no magic DSL            |
| UI           | shadcn/ui                | Unstyled, composable primitives on Radix + Tailwind v4                    |
| Forms        | TanStack Form            | Type-safe, performant, framework-agnostic form state management           |
| Validation   | Zod                      | Schema validation shared between client and server actions                |

### Project Structure

```
agri_biz/
├── app/
│   ├── dashboard/          # All dashboard routes (protected)
│   │   ├── page.tsx        # Overview — role-aware dashboard
│   │   ├── fields/         # Field agent's field list
│   │   ├── fields-admin/   # Admin's field list
│   │   ├── create_field/   # Admin-only field creation
│   │   └── team/           # Admin-only team management
│   ├── login/              # Login page
│   └── signup/             # Sign-up page
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── field-table.tsx     # Field agent table with stage/notes actions
│   ├── field-table-admin.tsx  # Admin table with agent reassignment
│   ├── create_field_form.tsx  # Field creation form
│   └── app-sidebar.tsx     # Role-aware sidebar navigation
├── db/
│   ├── schema.ts           # Barrel export for all table schemas
│   ├── field.ts            # Field table + relations
│   ├── field-stage.ts      # Field_stage lookup table (1–4)
│   ├── note.ts             # Note table (observations per field)
│   └── auth-schema.ts      # better-auth user/session tables
├── lib/
│   ├── auth.ts             # better-auth server config
│   ├── auth-client.ts      # better-auth React client
│   ├── field-status.ts     # Status computation utility
│   └── actions/
│       └── field.ts        # Server actions (create, update stage, assign agent, notes)
└── database.ts             # Drizzle client initialization
```

### Roles

| Role          | Capabilities                                                              |
|---------------|---------------------------------------------------------------------------|
| **admin**     | Full access: create fields, assign/reassign agents, promote users, view all fields & notes, dashboard insights |
| **field_agent** | View & update their assigned fields, add/view notes, advance stages sequentially |
| **unassigned** | Can log in but see nothing useful until an admin promotes them            |

### Stage Progression

Fields progress through four stages in strict sequential order:

1. **Planted** (ID 1)
2. **Growing** (ID 2)
3. **Ready** (ID 3)
4. **Harvested** (ID 4)

- Agents can only advance a field to the **next** stage — no skipping or going backwards.
- Server-side validation enforces `newStageId === currentStageId + 1`.
- The UI only shows the next available stage in the dropdown.
- Once a field reaches "Harvested," the edit button is disabled.

### Redirect Logic

- Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard`.
- Unauthenticated users visiting any `/dashboard/*` route are redirected to `/login`.
- An admin visiting `/dashboard/fields` is redirected to `/dashboard/fields-admin`.
- A field agent visiting `/dashboard/fields-admin` sees a message with a link to their fields page.

---

## Field Status Determination

Each field has a **computed status** shown in the "Field status" column. Status is determined purely from data — there is no manual status field.

### Logic

```typescript
export type FieldStatus = "Active" | "At Risk" | "Completed";
```

| Status      | Criteria                                                                 |
|-------------|--------------------------------------------------------------------------|
| **Completed** | `currentStageId === 4` (the field has reached "Harvested")             |
| **At Risk**   | Any of the following: <br>• Still in **Planted** stage after **60+ days** (stagnation)<br>• In **Growing** or **Ready** stage with **zero notes** (no field activity recorded)<br>• In **Growing** or **Ready** stage where the **last note is older than 14 days** (stale activity) |
| **Active**    | Everything else — the field is progressing as expected                   |

### Implementation

Status is computed **server-side** in the page component by a pure utility function (`lib/field-status.ts`). For each field, the query fetches:

- `currentStageId` and `plantingDate` (from the `field` table)
- `notesCount` and `lastNoteCreatedAt` (from an aggregated subquery on the `note` table)

The status is attached to each row before passing data to the client component, which renders it as a colored `<Badge>`:

- **Completed** → `default` (brand color)
- **At Risk** → `destructive` (red)
- **Active** → `outline` (subtle)

---

## Assumptions

1. **Stage IDs are fixed**: The `field_stage` table contains exactly four rows with IDs 1–4 (Planted, Growing, Ready, Harvested). The status logic and stage progression enforcement hardcode these IDs.
2. **No editing or deleting notes**: Notes (observations) are append-only. Agents cannot edit or delete notes once created.
3. **Email verification is optional**: The sign-up flow redirects to a `/verify` page, but the app does not enforce email verification before allowing access.
4. **First user is admin**: This is enforced by a `databaseHooks.user.create.before` hook in `lib/auth.ts`. If the user table is ever emptied and re-populated, the next sign-up will again become admin.
5. **Turso / SQLite**: The database is SQLite-compatible. Queries use SQLite-specific functions (e.g., `cast(unixepoch('subsecond') * 1000 as integer)` for timestamps).
6. **Single-tenant**: The app assumes one organization. There is no multi-tenant isolation.
7. **Session-only auth**: All auth uses HTTP-only session cookies. There is no API token or JWT flow for external access.