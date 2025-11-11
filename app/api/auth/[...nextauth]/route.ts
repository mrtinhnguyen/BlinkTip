import NextAuth, { NextAuthOptions } from 'next-auth'
import TwitterProvider from 'next-auth/providers/twitter'

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: '2.0',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store Twitter data in JWT token on initial sign in
      if (account && profile) {
        const twitterProfile = profile as any
        token.twitterId = twitterProfile.data?.id || profile.sub
        token.twitterHandle = twitterProfile.data?.username
        token.twitterName = twitterProfile.data?.name
        token.twitterAvatarUrl = twitterProfile.data?.profile_image_url
      }
      return token
    },
    async session({ session, token }) {
      // Make Twitter data available in session
      if (token) {
        session.user.twitterId = token.twitterId as string
        session.user.twitterHandle = token.twitterHandle as string
        session.user.twitterName = token.twitterName as string
        session.user.twitterAvatarUrl = token.twitterAvatarUrl as string
      }
      return session
    },
    async signIn() {
      return true
    },
    async redirect({ url, baseUrl }) {
      // Redirect to register page after successful sign-in
      if (url.startsWith(baseUrl)) {
        return url
      }
      return `${baseUrl}/register`
    },
  },
  pages: {
    signIn: '/register',
    error: '/register',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
