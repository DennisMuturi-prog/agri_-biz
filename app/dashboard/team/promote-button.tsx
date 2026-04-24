"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { promoteToFieldAgent, type PromoteResult } from "@/lib/actions/field"
import { useRouter } from "next/navigation"
import { ShieldCheck } from "lucide-react"

type PromoteButtonProps = {
  userId: string
  userName: string
}

export function PromoteButton({ userId, userName }: PromoteButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePromote() {
    setIsSubmitting(true)
    setError(null)

    const result: PromoteResult = await promoteToFieldAgent(userId)

    if (result.success) {
      router.refresh()
    } else {
      setError(result.error)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePromote}
        disabled={isSubmitting}
      >
        <ShieldCheck className="mr-1.5 size-3.5" />
        {isSubmitting ? "Promoting..." : "Promote to Agent"}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
