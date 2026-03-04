import NextAuth from 'next-auth';
import { encode } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import axios from 'axios';

const secret = process.env.NEXTAUTH_SECRET;
// Usar la URL interna si está disponible (en el servidor), si no, la pública (en el cliente)
const backendApiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

if (!secret) {
  throw new Error('NEXTAUTH_SECRET is not set');
}

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const response = await axios.post(`${backendApiUrl}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          const user = response.data.user;

          if (user) {
            return user as any;
          }
          return null;
        } catch (error: any) {
          console.error('Error de autenticación con el backend:', error.response?.data || error.message);
          throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
        }
      }
    })
  ],
  secret: secret,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.user.role = token.role;
      }
      // @ts-ignore
      session.accessToken = await encode({ token, secret });
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  }
});
