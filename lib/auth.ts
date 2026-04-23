import { betterAuth } from "better-auth"
import Database from "better-sqlite3"
import {
  sendDuplicateSignupEmailAlert,
  sendVerificationEmail,
} from "./send-email"
import { admin } from "better-auth/plugins"
export const auth = betterAuth({
  database: new Database("./sqlite.db"),
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
