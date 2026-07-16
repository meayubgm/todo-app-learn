import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// session.user に id を持たせるための型拡張（既定の型には含まれないため）
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// Auth.js (NextAuth v5) の設定
// GitHub OAuth を利用。Client ID / Secret は環境変数
// AUTH_GITHUB_ID / AUTH_GITHUB_SECRET から自動注入される（v5 の命名規約）。
// Prisma Adapter + database セッション戦略のため OAuth を採用している
// （Credentials は database セッションと併用不可）。
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [GitHub],
  callbacks: {
    // database セッションでは第2引数に DB の user が渡る。id を session に載せる。
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
