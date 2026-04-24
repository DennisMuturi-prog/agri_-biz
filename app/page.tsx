import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tractor, Sprout, CheckCircle2, Users } from "lucide-react"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* ── Navigation ── */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <Tractor className="size-6 text-primary" />
          <span className="text-lg font-semibold">AgriBiz</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center md:px-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Manage your fields, track your harvest
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            AgriBiz helps agricultural teams oversee every stage of field
            management — from planting to harvest. Assign fields to agents,
            record observations, monitor progress, and get a clear overview of
            your entire operation.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-5 text-left">
              <Sprout className="mb-3 size-6 text-primary" />
              <h3 className="font-semibold">Track Stages</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Fields move through Planted → Growing → Ready → Harvested. No
                skipping, no going back.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-left">
              <Users className="mb-3 size-6 text-primary" />
              <h3 className="font-semibold">Assign Agents</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Admins assign fields to field agents. Each agent sees only their
                own fields.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-left">
              <CheckCircle2 className="mb-3 size-6 text-primary" />
              <h3 className="font-semibold">Record Notes</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Agents add observations per field. Status is computed
                automatically from stage, age, and note activity.
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="px-6 py-4 text-center text-xs text-muted-foreground md:px-10">
        AgriBiz &mdash; Agricultural Field Management
      </footer>
    </div>
  )
}
