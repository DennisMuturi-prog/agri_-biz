"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon, CheckIcon, Loader2Icon } from "lucide-react"
import { z } from "zod"
import { useForm } from "@tanstack/react-form"
import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createField } from "@/lib/actions/field"

// ---------------------------------------------------------------------------
// Zod schema – matches the `field` DB table
// ---------------------------------------------------------------------------
const createFieldSchema = z.object({
  name: z.string().min(2, "Name must have at least 2 characters").trim(),
  cropType: z.string().min(1, "Crop type is required").trim(),
  plantingDate: z
    .number({ message: "Planting date must be a valid date" })
    .int("Planting date must be a valid date")
    .min(1, "Planting date is required"),
  currentStageId: z
    .number({ message: "Stage must be a number" })
    .int()
    .min(1, "Stage is required"),
  fieldAgentId: z.string().optional().default(""),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(date: Date | undefined) {
  if (!date) return ""
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined): date is Date {
  return date instanceof Date && !isNaN(date.getTime())
}

function toFieldErrors(
  errors: readonly ({ message?: string } | string | null | undefined)[]
): { message?: string }[] {
  if (!errors || errors.length === 0) return []
  const result: { message?: string }[] = []
  for (const e of errors) {
    if (!e) continue
    if (typeof e === "string") {
      result.push({ message: e })
    } else {
      result.push({ message: e.message ?? "Invalid value" })
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Date picker sub-component
// ---------------------------------------------------------------------------
interface DatePickerFieldProps {
  value: number
  onChange: (epochMs: number) => void
  onBlur: () => void
  isInvalid: boolean
  isValid: boolean
  errors: readonly ({ message?: string } | string | null | undefined)[]
}

function DatePickerField({
  value,
  onChange,
  onBlur,
  isInvalid,
  isValid: isValidProp,
  errors,
}: DatePickerFieldProps) {
  const selectedDate = value ? new Date(value) : undefined
  const [textValue, setTextValue] = useState(formatDate(selectedDate))
  const [month, setMonth] = useState(selectedDate ?? new Date())
  const [open, setOpen] = useState(false)

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setTextValue(raw)
      const parsed = new Date(raw)
      if (isValidDate(parsed)) {
        onChange(parsed.getTime())
        setMonth(parsed)
        onBlur()
      }
    },
    [onChange, onBlur]
  )

  const commitDate = useCallback(
    (date: Date | undefined) => {
      if (isValidDate(date)) {
        onChange(date.getTime())
        setTextValue(formatDate(date))
        setMonth(date)
        onBlur()
      }
    },
    [onChange, onBlur]
  )

  return (
    <Field>
      <FieldLabel htmlFor="plantingDate-input">
        Planting date <span className="text-destructive">*</span>
      </FieldLabel>
      <InputGroup>
        <InputGroupInput
          id="plantingDate-input"
          value={textValue}
          placeholder="June 01, 2025"
          aria-invalid={isInvalid}
          onChange={handleTextChange}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          {isValidProp && !isInvalid && value > 0 && (
            <span className="mr-0.5 text-emerald-500">
              <CheckIcon className="size-3.5" />
            </span>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
              >
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto rounded-lg border bg-popover p-3 shadow-md"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                month={month}
                onMonthChange={setMonth}
                onSelect={(date) => {
                  commitDate(date)
                  setOpen(false)
                }}
                className="rounded-md"
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
      {isInvalid && <FieldError errors={toFieldErrors(errors)} />}
    </Field>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CreateFieldFormProps extends React.ComponentProps<"div"> {
  stages: { id: number; name: string }[]
  agents: { id: string; name: string; email: string }[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CreateFieldForm({
  className,
  stages,
  agents,
  ...props
}: CreateFieldFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const router = useRouter()
  const loadingToastId = useRef<string | number | undefined>(undefined)

  const form = useForm({
    defaultValues: {
      name: "",
      cropType: "",
      plantingDate: 0,
      currentStageId: 0,
      fieldAgentId: "",
    },

    onSubmit: async ({ value }) => {
      setSubmitting(true)

      // Show a loading toast
      loadingToastId.current = toast.loading("Creating field...", {
        description: "Please wait while we save your field.",
      })

      try {
        // Small artificial delay so the spinner is visible even on fast
        // network – makes the feedback feel intentional and reassuring.
        const result = await Promise.all([
          createField(value),
          new Promise<void>((r) => setTimeout(r, 600)),
        ]).then(([res]) => res)

        toast.dismiss(loadingToastId.current)
        loadingToastId.current = undefined

        if (!result.success) {
          toast.error(result.error, {
            description: "Please review the form and try again.",
          })
          return
        }

        toast.success("Field created successfully", {
          description: `${value.name} has been registered.`,
        })

        form.reset()
        setResetKey((k) => k + 1)
        router.refresh()
      } catch (err) {
        toast.dismiss(loadingToastId.current)
        loadingToastId.current = undefined

        toast.error(
          err instanceof Error ? err.message : "Failed to create field",
          {
            description: "An unexpected error occurred. Please try again.",
          }
        )
      } finally {
        setSubmitting(false)
      }
    },

    validators: {
      onBlur: ({ value }) => {
        const result = createFieldSchema.safeParse(value)
        if (!result.success) return result.error.issues.map((i) => i.message)
      },
      onChange: ({ value }) => {
        const result = createFieldSchema.safeParse(value)
        if (!result.success) return result.error.issues.map((i) => i.message)
      },
      onSubmit: ({ value }) => {
        const result = createFieldSchema.safeParse(value)
        if (!result.success) return result.error.issues.map((i) => i.message)
      },
    },
  })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Create a new field</CardTitle>
          <CardDescription>
            Fill in the details below to register a new agricultural field.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <fieldset disabled={submitting} className="contents">
              <FieldGroup>
                {/* ---- Name ---- */}
                <form.Field name="name">
                  {(field) => {
                    const isBlurred = field.state.meta.isBlurred
                    const isInvalid = isBlurred && !field.state.meta.isValid
                    const isValid =
                      isBlurred &&
                      field.state.meta.isValid &&
                      field.state.value.length > 0
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Field name <span className="text-destructive">*</span>
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="e.g. North Plot"
                            className={cn(isValid && "pr-8")}
                          />
                          {isValid && (
                            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-emerald-500">
                              <CheckIcon className="size-4" />
                            </span>
                          )}
                        </div>
                        {isInvalid && (
                          <FieldError
                            errors={toFieldErrors(field.state.meta.errors)}
                          />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>

                {/* ---- Crop type ---- */}
                <form.Field name="cropType">
                  {(field) => {
                    const isBlurred = field.state.meta.isBlurred
                    const isInvalid = isBlurred && !field.state.meta.isValid
                    const isValid =
                      isBlurred &&
                      field.state.meta.isValid &&
                      field.state.value.length > 0
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Crop type <span className="text-destructive">*</span>
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="e.g. Maize"
                            className={cn(isValid && "pr-8")}
                          />
                          {isValid && (
                            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-emerald-500">
                              <CheckIcon className="size-4" />
                            </span>
                          )}
                        </div>
                        {isInvalid && (
                          <FieldError
                            errors={toFieldErrors(field.state.meta.errors)}
                          />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>

                {/* ---- Planting date ---- */}
                <form.Field name="plantingDate">
                  {(field) => {
                    const isBlurred = field.state.meta.isBlurred
                    const isInvalid = isBlurred && !field.state.meta.isValid
                    const isValid =
                      isBlurred &&
                      field.state.meta.isValid &&
                      field.state.value > 0
                    return (
                      <DatePickerField
                        key={resetKey}
                        value={field.state.value}
                        onChange={field.handleChange}
                        onBlur={field.handleBlur}
                        isInvalid={isInvalid}
                        isValid={isValid}
                        errors={field.state.meta.errors}
                      />
                    )
                  }}
                </form.Field>

                {/* ---- Current stage ---- */}
                <form.Field name="currentStageId">
                  {(field) => {
                    const isBlurred = field.state.meta.isBlurred
                    const isInvalid = isBlurred && !field.state.meta.isValid
                    const isValid =
                      isBlurred &&
                      field.state.meta.isValid &&
                      field.state.value > 0
                    return (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          Current stage{" "}
                          <span className="text-destructive">*</span>
                        </FieldLabel>
                        <div className="relative">
                          <Select
                            value={String(field.state.value || "")}
                            onValueChange={(val) => {
                              field.handleChange(Number(val))
                              field.handleBlur()
                            }}
                          >
                            <SelectTrigger
                              id={field.name}
                              aria-invalid={isInvalid}
                              className={cn(isValid && "pr-10")}
                            >
                              <SelectValue placeholder="Select a stage" />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.map((s) => (
                                <SelectItem key={s.id} value={String(s.id)}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isValid && (
                            <span className="pointer-events-none absolute inset-y-0 right-9 flex items-center text-emerald-500">
                              <CheckIcon className="size-4" />
                            </span>
                          )}
                        </div>
                        {isInvalid && (
                          <FieldError
                            errors={toFieldErrors(field.state.meta.errors)}
                          />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>

                {/* ---- Field agent ---- */}
                <form.Field name="fieldAgentId">
                  {(_field) => (
                    <Field>
                      <FieldLabel htmlFor="fieldAgentId">
                        Field agent
                      </FieldLabel>
                      <Select
                        value={_field.state.value || "none"}
                        onValueChange={(val) => {
                          _field.handleChange(val === "none" ? "" : val)
                          _field.handleBlur()
                        }}
                      >
                        <SelectTrigger id="fieldAgentId">
                          <SelectValue placeholder="Pick a field agent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None — no agent</SelectItem>
                          {agents.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name} ({a.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldDescription>
                        The person responsible for this field
                      </FieldDescription>
                    </Field>
                  )}
                </form.Field>

                {/* ---- Submit ---- */}
                <Field>
                  <Button type="submit" disabled={submitting} className="gap-2">
                    {submitting ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create field"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
