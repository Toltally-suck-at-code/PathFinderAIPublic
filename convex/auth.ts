import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";

type UserRole = "student" | "counselor" | "partner" | "admin";

const DEFAULT_ALLOWED_DOMAINS = ["stu.vinschool.edu.vn", "vinschool.edu.vn"];

function parseList(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => item.replace(/^@/, ""));
}

function parseEmailList(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.includes("@"));
}

const allowedDomains = (() => {
  const configured = parseList(process.env.ALLOWED_EMAIL_DOMAINS);
  return configured.length > 0 ? configured : DEFAULT_ALLOWED_DOMAINS;
})();

const bootstrapAdminEmails = parseEmailList(process.env.PILOT_ADMIN_EMAILS);
const bootstrapCounselorEmails = parseEmailList(process.env.PILOT_COUNSELOR_EMAILS);

function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function isAllowedEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return allowedDomains.includes(domain);
}

function getInitialRole(email: string): UserRole {
  const normalized = email.toLowerCase();
  if (bootstrapAdminEmails.includes(normalized)) return "admin";
  if (bootstrapCounselorEmails.includes(normalized)) return "counselor";
  return "student";
}

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      const email = args.profile?.email?.toLowerCase();
      if (!email || !email.includes("@")) {
        throw new Error("A valid Vinschool email address is required.");
      }

      if (!isAllowedEmail(email)) {
        throw new Error("Only approved Vinschool email domains are allowed.");
      }

      if (args.existingUserId) {
        return args.existingUserId;
      }

      const userId = await ctx.db.insert("users", {
        email,
        name: args.profile?.name ?? undefined,
        role: getInitialRole(email),
        profileComplete: false,
        createdAt: Date.now(),
      });

      return userId;
    },
  },
});
