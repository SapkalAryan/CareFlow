import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User, UserRole } from '@/lib/models/User';
import { Doctor } from '@/lib/models/Doctor';
import { Patient } from '@/lib/models/Patient';
import { Pharmacy } from '@/lib/models/Pharmacy';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Find associated profile ID (Doctor, Patient, or Pharmacy)
        let profileId = '';
        if (user.role === 'doctor') {
          const doc = await Doctor.findOne({ userId: user._id });
          if (doc) profileId = doc._id.toString();
        } else if (user.role === 'patient') {
          const pat = await Patient.findOne({ userId: user._id });
          if (pat) profileId = pat._id.toString();
        } else if (user.role === 'pharmacy') {
          const pharm = await Pharmacy.findOne({ userId: user._id });
          if (pharm) profileId = pharm._id.toString();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName,
          role: user.role,
          phone: user.phone,
          profileId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.profileId = (user as any).profileId;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as UserRole;
        (session.user as any).profileId = token.profileId as string;
        (session.user as any).phone = token.phone as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'careflow_fallback_secret_for_development_mode_only_123',
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuthRole(allowedRoles: UserRole[]) {
  const session = await getAuthSession();
  if (!session || !session.user) {
    return { authorized: false, response: null, session: null };
  }

  const role = (session.user as any).role as UserRole;
  if (!allowedRoles.includes(role)) {
    return { authorized: false, response: null, session };
  }

  return { authorized: true, session };
}
