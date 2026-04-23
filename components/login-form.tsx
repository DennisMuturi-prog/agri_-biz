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
import Link from "next/link"
import { object as z_object, string as z_string, email as z_email } from "zod"
import { useForm } from "@tanstack/react-form"
import { authClient } from "@/lib/auth-client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Spinner } from "./ui/spinner"

const signinSchema = z_object({
  email: z_email("Please enter a valid email address").toLowerCase().trim(),
  password: z_string(),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },

    onSubmit: async ({ value }) => {
      const { data, error } = await authClient.signIn.email(
        {
          /**
           * The user email
           */
          email: value.email,
          /**
           * The user password
           */
          password: value.password,
          /**
           * A URL to redirect to after the user verifies their email (optional)
           */
          callbackURL: "/dashboard",
          /**
           * remember the user session after the browser is closed.
           * @default true
           */
          rememberMe: false,
        },
        {
          onRequest: (ctx) => {
            //show loading
            setLoading(true)
          },
          onSuccess: (ctx) => {
            //redirect to the dashboard or sign in page
            router.push("/dashboard")
          },
          onError: (ctx) => {
            // display the error message
            toast.error(ctx.error.message, {
              action: {
                label: "X",
                onClick: () => console.log("Action!"),
              },
              position: "top-center",
              duration:8000
            })
            setLoading(false)
          },
        }
      )
      console.log("login error", error)
    },

    validators: {
      onBlur: signinSchema,
      onChange: signinSchema,
      onSubmit: signinSchema,
    },
  })
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="signin-form"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
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
                      <div className="flex items-center">
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <Link
                          href="/passwordReset"
                          className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </Link>
                      </div>
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
              <Field>
                <Button type="submit" id="signin-form" disabled={loading}>
                  Login
                </Button>
                <Button variant="outline" type="button">
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
