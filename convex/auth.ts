import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";

// Allowed email domains for Vinschool
const ALLOWED_DOMAINS = ["stu.vinschool.edu.vn"];

function isAllowedEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          hd: "stu.vinschool.edu.vn", // Hint to show only Vinschool student accounts
        },
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Validate email domain
      if (args.profile?.email) {
        if (!isAllowedEmail(args.profile.email)) {
          throw new Error(
            "Only Vinschool student email addresses (@stu.vinschool.edu.vn) are allowed."
          );
        }
      }

      if (args.existingUserId) {
        // User already exists, return existing ID
        return args.existingUserId;
      }

      // Create new user
      const userId = await ctx.db.insert("users", {
        email: args.profile?.email ?? "",
        name: args.profile?.name ?? undefined,
        role: "student", // Default role, can be changed by admin
        profileComplete: false,
        createdAt: Date.now(),
      });

      return userId;
    },
  },
});
