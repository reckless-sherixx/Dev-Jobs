import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Building2, Heart, LibraryBig, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";
import { UserType } from "@prisma/client";

interface UserDropdownProps {
    email: string,
    name: string,
    image: string,
    userType: UserType
}

export function UserDropdown({email, name, image, userType}: UserDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                    <Avatar>
                        <AvatarImage src={image} alt="Profile Image" />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuLabel className="flex">
                    <Avatar>
                        <AvatarImage src={image} alt="Profile Image" />
                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col justify-center ml-2">
                        <span className="text-sm font-medium text-foreground">
                            {name}
                        </span>
                        <span className="text-xs text-muted-foreground">{email}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {userType === 'JOB_SEEKER' ? (
                        <>
                            <DropdownMenuItem asChild>
                                <Link href="/favorites">
                                    <Heart size={16} strokeWidth={2} className="opacity-60" />
                                    <span className="ml-2">Favorite Jobs</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/applications">
                                    <LibraryBig size={16} strokeWidth={2} className="opacity-60" />
                                    <span className="ml-2">My Applications</span>
                                </Link>
                            </DropdownMenuItem>
                            {/* <DropdownMenuItem asChild>
                                <Link href="/profile">
                                    <UserRound size={16} strokeWidth={2} className="opacity-60" />
                                    <span className="ml-2">My Profile</span>
                                </Link>
                            </DropdownMenuItem> */}
                        </>
                    ) : (
                        <>
                            <DropdownMenuItem asChild>
                                <Link href="/my-jobs">
                                    <Building2 size={16} strokeWidth={2} className="opacity-60" />
                                    <span className="ml-2">My Job Listings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/applications">
                                    <LibraryBig size={16} strokeWidth={2} className="opacity-60" />
                                    <span className="ml-2">Applications</span>
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem asChild>
                        <form action={async ()=>{
                            "use server"
                            await signOut({redirectTo:"/"})
                        }}>
                            <button className="flex w-full items-center gap-2">
                                <LogOut size={16} strokeWidth={2} className="opacity-60"/>
                                <span>Logout</span>
                            </button>
                        </form>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}