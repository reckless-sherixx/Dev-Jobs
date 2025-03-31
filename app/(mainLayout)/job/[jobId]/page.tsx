import { savedJobPost, unSaveJobPost } from "@/app/actions";
import arcjet, { detectBot } from "@/app/utils/arcjet";
import { getFlagEmoji } from "@/app/utils/countriesList";
import { benefits } from "@/app/utils/listOfBenefits";
import { JsonToHtml } from "@/components/general/JsonToHtml";
import { SaveJobButton } from "@/components/general/SubmitButton";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { request, tokenBucket } from "@arcjet/next";
import { ApplicationStatus } from "@prisma/client";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const aj = arcjet.withRule(
    detectBot({
        mode: "LIVE",
        allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"]
    })
)
function getClient(session: boolean) {
    if (session) {
        return aj.withRule(
            tokenBucket({
                mode: "LIVE",
                capacity: 100,
                interval: 60,
                refillRate: 30,
            })
        )
    } else {
        return aj.withRule(
            tokenBucket({
                mode: "LIVE",
                capacity: 100,
                interval: 60,
                refillRate: 10,
            })
        )
    }
}
async function getJob(jobId: string, userId?: string) {
    const [jobData, savedJob, application] = await Promise.all([
        await prisma.jobPost.findUnique({
            where: {
                status: "ACTIVE",
                id: jobId
            },
            select: {
                jobTitle: true,
                jobDescription: true,
                location: true,
                employmentType: true,
                benefits: true,
                listingDuration: true,
                createdAt: true,
                Company: {
                    select: {
                        name: true,
                        logo: true,
                        location: true,
                        about: true
                    }
                }
            }
        }),

        userId ? prisma.savedJobPost.findUnique({
            where: {
                userId_jobPostId: {
                    userId: userId,
                    jobPostId: jobId,
                }
            },
            select: {
                id: true
            }
        }) : null,
        userId ? prisma.application.findFirst({
            where: {
                jobPostId: jobId,
                JobSeeker: {
                    userId
                }
            }
        }) : null,
    ]);

    if (!jobData) {
        return notFound();
    }
    return {
        jobData,
        savedJob,
        application
    };
}

type Params = Promise<{ jobId: string }>;
export default async function JobIdPage({ params }: { params: Params }) {
    const { jobId } = await params;
    const session = await auth()

    const req = await request();
    const decision = await getClient(!!session).protect(req, { requested: 10 });

    if (decision.isDenied()) {
        throw new Error('forbidden')
    }
    const { jobData, savedJob, application } = await getJob(jobId, session?.user?.id);

    const locationFlag = getFlagEmoji(jobData.location)
    return (
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-8 col-span-2">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{jobData.jobTitle}</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <p className="font-medium">{jobData.Company?.name}</p>
                            <span className="hidden md:inline text-muted-foreground">*</span>
                            <Badge className="rounded-full" variant="secondary">Full-time</Badge>
                            <span className="hidden md:inline text-muted-foreground">*</span>

                            <Badge className="rounded-full">
                                {locationFlag && <span className="mr-1">{locationFlag}</span>}
                                {jobData.location}
                            </Badge>
                        </div>
                    </div>
                    {session?.user ? (
                        <form
                            action={
                                savedJob
                                    ? unSaveJobPost.bind(null, savedJob.id)
                                    : savedJobPost.bind(null, jobId)
                            }
                        >
                            <SaveJobButton savedJob={!!savedJob} />
                        </form>
                    ) : (
                        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                            <Heart className="size-4" />
                            Save Job
                        </Link>
                    )}


                </div>

                <section>
                    <JsonToHtml json={JSON.parse(jobData.jobDescription)} />
                </section>
                <section>
                    <h3 className="font-semibold mb-4">
                        Benefits
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {benefits.map((benefit) => {
                            const isOffered = jobData.benefits.includes(benefit.id);
                            return (
                                <Badge
                                    key={benefit.id}
                                    variant={isOffered ? "default" : "outline"}
                                    className={`text-sm px-4 py-1.5 rounded-full ${!isOffered && " opacity-75 cursor-not-allowed"
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {benefit.icon}
                                        {benefit.label}
                                    </span>
                                </Badge>
                            );
                        })}
                    </div>
                </section>
            </div>
            <div className="space-y-6">
                <Card className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold">Apply now</h3>
                            <p className="text-sm text-muted-foreground mt-1">Please let {jobData.Company.name} know you found this job on DevJobs. This helps us grow!</p>
                        </div>
                        {application ? (
                            <Badge variant={
                                application.status === ApplicationStatus.SELECTED ? "success" :
                                    application.status === ApplicationStatus.REJECTED ? "destructive" :
                                        application.status === ApplicationStatus.SHORTLISTED ? "secondary" :
                                            application.status === ApplicationStatus.IN_PROGRESS ? "default" :
                                                "outline"
                            }>
                                {application.status === ApplicationStatus.SELECTED ? "Application Selected" :
                                    application.status === ApplicationStatus.REJECTED ? "Application Rejected" :
                                        application.status === ApplicationStatus.SHORTLISTED ? "Application Shortlisted" :
                                            application.status === ApplicationStatus.IN_PROGRESS ? "Application In Progress" :
                                                "Application Pending"}
                            </Badge>
                        ) : (
                            <Button asChild className="w-full">
                                <Link href={`/apply/${jobId}`}>Apply now</Link>
                            </Button>
                        )}
                    </div>
                </Card>
                {/* job details card  */}
                <Card className="p-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold">About the job</h3>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Apply before
                                </span>
                                <span className="text-sm">
                                    {new Date(
                                        jobData.createdAt.getTime() +
                                        jobData.listingDuration * 24 * 60 * 60 * 1000
                                    ).toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Posted on
                                </span>
                                <span className="text-sm">
                                    {jobData.createdAt.toLocaleDateString("en-US", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Employment type
                                </span>
                                <span className="text-sm">{jobData.employmentType}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Location
                                </span>
                                <Badge variant="secondary">{jobData.location}</Badge>
                            </div>
                        </div>
                    </div>
                </Card>

                {/*Company Card */}
                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Image
                                src={jobData.Company.logo}
                                alt={"Company logo"}
                                width={48}
                                height={48}
                                className="rounded-full size-12"
                            />
                            <div className="flex flex-col">
                                <h3 className="font-semibold">{jobData.Company.name}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-3">{jobData.Company.about}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}