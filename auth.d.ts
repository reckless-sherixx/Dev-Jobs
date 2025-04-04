import { UserType } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user?: {
            id?: string | null;
            userType?: UserType | null;
        } & DefaultSession['user'];
    }


    interface User {
        userType?: UserType | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        idToken?: string;
        userType?: UserType | null; 
    }
}
