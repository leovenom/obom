import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { isGoogleAuthEnabled, resolveAuthSecretForNextAuth } from '@/lib/google-auth-config';
import { upsertGoogleUser } from '@/lib/google-user';

const providers = [];

if (isGoogleAuthEnabled()) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: resolveAuthSecretForNextAuth(),
  trustHost: true,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return true;
      if (!profile?.email || !account.providerAccountId) return false;

      await upsertGoogleUser({
        googleId: account.providerAccountId,
        email: profile.email,
        nome: profile.name || profile.email.split('@')[0],
      });
      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile?.email && account.providerAccountId) {
        const userId = await upsertGoogleUser({
          googleId: account.providerAccountId,
          email: profile.email,
          nome: profile.name || profile.email.split('@')[0],
        });
        token.dbUserId = userId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.dbUserId && session.user) {
        session.user.id = token.dbUserId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
