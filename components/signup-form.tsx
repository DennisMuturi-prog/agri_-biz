"use client"
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
import { object as z_object, string as z_string, email as z_email } from "zod"
import { useForm } from "@tanstack/react-form"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Spinner } from "@/components/ui/spinner"

const signupSchema = z_object({
  username: z_string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .trim(),

  email: z_email("Please enter a valid email address").toLowerCase().trim(),

  password: z_string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  confirmPassword: z_string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})
export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },

    onSubmit: async ({ value }) => {
      console.log(value)
      const { data, error } = await authClient.signUp.email(
        {
          email: value.email, // user email address
          password: value.password, // user password -> min 8 characters by default
          name: value.username, // user display name
          // User image URL (optional)
          callbackURL: "/dashboard", // A URL to redirect to after the user verifies their email (optional)
        },
        {
          onRequest: (ctx) => {
            //show loading
            setLoading(true)
          },
          onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            router.push("/verify")
          },
          onError: (ctx) => {
            // display the error message
            toast.error(ctx.error.message, {
              action: {
                label: "X",
                onClick: () => console.log("Action!"),
              },
              position: "top-center",
              duration: 8000,
            })
            setLoading(false)
          },
        }
      )
      console.log("error is ", error)
      console.log("data is ", data)
    },

    validators: {
      onBlur: signupSchema,
      onChange: signupSchema,
      onSubmit: signupSchema,
    },
  })
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="signup-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="username">
              {(field) => {
                const isInvalid =
                  field.state.meta.isBlurred && !field.state.meta.isValid
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="John Doe"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isBlurred && !field.state.meta.isValid
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="m@example.com"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isBlurred && !field.state.meta.isValid
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="confirmPassword">
              {(field) => {
                const isInvalid =
                  field.state.meta.isBlurred && !field.state.meta.isValid
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            {loading && <Spinner />}
            <FieldGroup>
              <Field>
                <Button type="submit" form="signup-form" disabled={loading}>
                  Create Account
                </Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
