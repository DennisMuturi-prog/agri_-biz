import { betterAuth } from "better-auth"
import {
  sendDuplicateSignupEmailAlert,
  sendVerificationEmail,
} from "./send-email"
import { admin } from "better-auth/plugins"
import { db } from "database"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { user } from "@/db/auth-schema"

export const auth = betterAuth({
  experimental: { joins: true },
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    onExistingUserSignUp: async ({ user: existingUser }, request) => {
      const userAgent = request?.headers.get("user-agent") || "unknown"
      const forwardedFor = request?.headers.get("x-forwarded-for")
      const realIp = request?.headers.get("x-real-ip")
      const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"

      await sendDuplicateSignupEmailAlert({
        to: existingUser.email,
        username: existingUser.name,
        userAgent,
        ipAddress: ip,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user: newUser, url }) => {
      await sendVerificationEmail({
        to: newUser.email,
        username: newUser.name,
        url,
      })
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          // Check if this is the first user ever
          const existingUsers = await db
            .select({ id: user.id })
            .from(user)
            .limit(1)

          if (existingUsers.length === 0) {
            // First user gets admin role
            return {
              data: {
                ...userData,
                role: "admin",
              },
            }
          }

          // Subsequent users get no role (unassigned)
          return {
            data: {
              ...userData,
              role: null,
            },
          }
        },
      },
    },
  },
  plugins: [admin()],
})
