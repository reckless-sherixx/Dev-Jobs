import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import { UserType } from "@prisma/client"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [Google, GitHub],
    callbacks: {
        session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                const userWithRole = user as typeof user & { userType?: UserType | null };
                if (userWithRole.userType) {
                    session.user.userType = userWithRole.userType;
                }
            }
            return session;
        },
    },
})