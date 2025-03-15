import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/logo.png"
import { buttonVariants } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { auth } from "@/lib/auth";
import { UserDropdown } from "./UserDropdown";


export async function Navbar() {
    const session = await auth();
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

            <div className="hidden md:flex items-center gap-5">
                <ThemeToggle />
                <Link href="/post-job" className={buttonVariants({ size: "lg" })}>Post Job</Link>
                {session?.user ? (
                    <UserDropdown
                        email={session.user.email as string}
                        image={session.user.image as string}
                        name={session.user.name as string}
                    />
                ) : (
                    <Link
                        href="/login"
                        className={buttonVariants({ variant: "outline", size: "lg"})} 
                    >Login</Link>
                )}

            </div>
        </nav>
    )
}

