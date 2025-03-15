import { CreateJobForm } from "@/components/forms/CreateJobForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ArcjetLogo from '@/public/arcjet.jpg'
import InngestLogo from '@/public/inngest-locale.png'
import Google from "@/public/google.jpg"
import Meta from "@/public/1_9IKlJavI2QSn7CpKVee5uA.png"
import Amazon from "@/public/images.jpeg"
import Netflix from "@/public/images (1).png"
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireUser } from "@/app/utils/requireUser";


const companies = [
    { id: 0, name: 'ArcJet', logo: ArcjetLogo },
    { id: 1, name: 'ArcJet', logo: Netflix },
    { id: 2, name: 'ArcJet', logo: Google },
    { id: 3, name: 'ArcJet', logo: Meta },
    { id: 4, name: 'ArcJet', logo: Amazon },
    { id: 5, name: 'ArcJet', logo: InngestLogo }
]

const testimonials = [
    {
        id: 1,
        quote: "We filled our critical engineering role in half the time we expected, thanks to the platform's targeted reach. The quality of candidates was exceptional!",
        author: "Sarah M.",
        company: "Tech Startup CEO",
    },
    {
        id: 2,
        quote: "The platform's analytics helped us understand which job postings were performing best, allowing us to refine our strategy and attract top talent.",
        author: "Emily K.",
        company: "Recruitment Specialist, Retail Company",
    },
    {
        id: 3,
        quote: "The user-friendly interface made posting jobs and managing applications a breeze. It saved our HR team countless hours.",
        author: " David L.",
        company: "HR Manager, Tech Corporation",
    },
]

const stats = [
    { id: 0, value: "10k+", label: "Monthly active job seekers" },
    { id: 1, value: "48h", label: "Average time to hire" },
    { id: 2, value: "95%", label: "Employer satisfaction rate" },
    { id: 3, value: "500+", label: "Companies hiring remotely" },
]

async function getCompany(userId: string) {
    const data = await prisma.company.findUnique({
        where: {
            userId: userId,
        },
        select: {
            name: true,
            location: true,
            about: true,
            logo: true,
            linkedin: true,
            website: true,
        },
    });

    if (!data) {
        return redirect("/");
    }
    return data;
}
export default async function PostJobPage() {
    const session = await requireUser()
    const data = await getCompany(session.id as string);
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <CreateJobForm
                companyAbout={data.about}
                companyLocation={data.location}
                companyLogo={data.logo}
                companyName={data.name}
                companyLinkedin={data.linkedin}
                companyWebsite={data.website}
            />
            <div className="col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Trusted by Industry Leaders</CardTitle>
                        <CardDescription>
                            Join thousand of companies hiring top talent
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Top companies logo */}

                        <div className="grid grid-cols-3 gap-4">
                            {companies.map((company) => (
                                <div key={company.id}>
                                    <Image src={company.logo} alt={company.name} width={80} height={80} className="rounded-lg opacity-100 transition-all delay-50 duration-200 hover:opacity-75 hover:scale-105" />
                                </div>
                            ))}
                        </div>
                        {/* Testimonials */}
                        <div className="space-y-4 pt-4">
                            {testimonials.map((testimonial) => (
                                <blockquote className="border-l-2 border-primary pl-4 opacity-80 transition-all delay-50 duration-200 hover:opacity-100  hover:scale-105" key={testimonial.id}>
                                    <p className="text-sm text-muted-foreground italic">
                                    &quot;{testimonial.quote}&quot;
                                    </p>
                                    <footer className="mt-2 text-sm font-medium">
                                        ~ {testimonial.author} , {testimonial.company}
                                    </footer>
                                </blockquote>
                            ))}
                        </div>
                        {/* stats rendering */}
                        <div className="grid grid-cols-2 gap-4">
                            {stats.map((stat) => (
                                <div key={stat.id} className="rounded-lg bg-muted p-4">
                                    <h4 className="text-2xl font-bold">{stat.value}</h4>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}

                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}