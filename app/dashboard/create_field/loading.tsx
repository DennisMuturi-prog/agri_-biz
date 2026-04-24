import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CreateFieldLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto p-6 md:p-10">
      <div className="w-full max-w-sm animate-pulse">
        <Card>
          <CardHeader>
            <div className="h-6 w-3/5 rounded bg-muted" />
            <div className="mt-2 h-4 w-4/5 rounded bg-muted" />
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Name field */}
            <div className="space-y-1.5">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-full rounded-lg bg-muted" />
            </div>
            {/* Crop type field */}
            <div className="space-y-1.5">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-full rounded-lg bg-muted" />
            </div>
            {/* Planting date field */}
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-full rounded-lg bg-muted" />
            </div>
            {/* Stage field */}
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-full rounded-lg bg-muted" />
            </div>
            {/* Agent field */}
            <div className="space-y-1.5">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-full rounded-lg bg-muted" />
            </div>
            {/* Submit button */}
            <div className="h-9 w-full rounded-lg bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
