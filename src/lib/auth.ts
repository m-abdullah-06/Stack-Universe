import GithubProvider from "next-auth/providers/github"

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
          login: profile.login,
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).login = token.login;
      }
      return session;
    },
    async jwt({ token, profile }: any) {
      if (profile) {
        token.login = profile.login;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
