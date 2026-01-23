import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { getUserByEmail } from "@/lib/db-actions";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // DynamoDB lookup
                const user: any = await getUserByEmail(credentials.email);

                if (!user) {
                    return null;
                }

                const isValid = await compare(credentials.password, user.passwordHash);
                if (!isValid) {
                    return null;
                }

                return {
                    id: user.PK, // Use Partition Key as ID
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            }
        })
    ],
    pages: {
        signIn: '/auth',
    },
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.role = user.role;
                token.sub = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.sub;
                session.user.role = token.role;
            }
            return session;
        }
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET || 'secret'
};
