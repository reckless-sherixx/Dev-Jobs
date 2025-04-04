import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/logo.png"
import { buttonVariants } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { auth } from "@/lib/auth";
import { UserDropdown } from "./UserDropdown";
import { NotificationBell } from "./NotificationBell"; 
import { UserType } from "@prisma/client"; 


export async function Navbar() {
    const session = await auth();
    const user = session?.user;
    const isJobSeeker = user?.userType === UserType.JOB_SEEKER;

    return (
        <nav className="flex items-center justify-between py-5">
            <Link href="/" className="flex items-center">
                <Image
                    src={Logo}
                    alt="Dev jobs logo"
                    width={60}
                    height={60}
                />
                <h1 className="text-2xl font-bold flex">
                    Dev<span className="text-primary pt-[1.5px]">Jobs</span>
                </h1>
            </Link>

            <div className="flex items-center gap-3 md:gap-5"> 
                <ThemeToggle />
                {/* Conditionally render NotificationBell for Job Seekers */}
                {isJobSeeker && user?.id && <NotificationBell userId={user.id} />}

                {user ? (
                    <>
                        {/* Show Post Job only if user is a COMPANY */}
                        {user.userType === UserType.COMPANY && (
                            <Link href="/post-job" className={`${buttonVariants({ size: "lg" })} hidden md:flex`}>Post Job</Link>
                        )}
                        <UserDropdown
                            email={user.email as string}
                            image={user.image as string}
                            name={user.name as string}
                            userType={user.userType as UserType}
                        />
                    </>
                ) : (
                    <>
                        {/* Show Post Job for logged-out users too*/}
                        <Link href="/post-job" className={`${buttonVariants({ size: "lg" })} hidden md:flex`}>Post Job</Link>
                        <Link
                            href="/login"
                            className={buttonVariants({ variant: "outline", size: "lg" })}
                        >Login</Link>
                    </>
                )}

            </div>
        </nav>
    )
}
