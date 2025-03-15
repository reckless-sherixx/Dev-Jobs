import { Navbar } from "@/components/general/Navbar";
import { ReactNode } from "react";

export default function MainLayout({children}:{children:ReactNode}){
    return (
        <div className="max-w-8xl px-4 md:px-6 lg:px-8">
            <Navbar/>
            {children}
        </div>
    )
}