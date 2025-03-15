import Image from "next/image";
import Link from "next/link";
import Logo from "@/public/logo.png"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { SubmitButton } from "@/components/general/SubmitButton";
import { auth, signIn } from "../../lib/auth";
import { redirect } from "next/navigation";


export default async function Login() {
    const session = await auth();

    if (session?.user) {
        return redirect("/")
    }
    return (
        <div className="min-h-screen w-screen flex items-center justify-center">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <Link href="/" className="flex items-center self-center">
                    <Image
                        src={Logo}
                        alt="Dev jobs logo"
                        width={60}
                        height={60}
                    />
                    <h1 className="text-2xl font-bold">
                        Dev<span className="text-primary">Jobs</span>
                    </h1>
                </Link>
                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">
                                Welcome Back
                            </CardTitle>
                            <CardDescription>
                                Login with your Google or Github account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-6">
                                <form action={async () => {
                                    "use server"
                                    await signIn("google", {
                                        redirectTo: "/onboarding"
                                    })
                                }}>
                                    <SubmitButton
                                        variant="outline"
                                        text="Login With Google"
                                        width="w-full"
                                        icon={<FcGoogle className="mr-2 size-5" />}
                                    />
                                </form>
                                <form action={async () => {
                                    "use server"
                                    await signIn("github", {
                                        redirectTo: "/onboarding"
                                    })
                                }}>

                                    <SubmitButton
                                        variant="outline"
                                        text="Login With Github"
                                        width="w-full"
                                        icon={<FaGithub className="mr-2 size-5" />}
                                    />
                                </form>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}