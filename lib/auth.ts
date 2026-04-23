import { betterAuth } from "better-auth"
import {
  sendDuplicateSignupEmailAlert,
  sendVerificationEmail,
} from "./send-email"
import { admin } from "better-auth/plugins"
import { db } from "database"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
export const auth = betterAuth({
  experimental: { joins: true },
  database: drizzleAdapter(db, { 
    provider: "sqlite",
  } // or "pg" or "mysql"
   ), 
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    onExistingUserSignUp: async ({ user }, request) => {
      console.log("hello")
      const userAgent = request?.headers.get("user-agent") || "unknown"

      const forwardedFor = request?.headers.get("x-forwarded-for")
      const realIp = request?.headers.get("x-real-ip")

      const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"

      console.log("user details", {
        email: user.email,
        ip,
        userAgent,
      })
      // Notify the existing user about the sign-up attempt
      await sendDuplicateSignupEmailAlert({
        to: user.email,
        username: user.name,
        userAgent,
        ipAddress: ip,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        username: user.name,
        url,
      })
    },

    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  plugins: [admin()],
})
