import { requireUser } from "@/app/utils/requireUser";
import { ApplyJobForm } from "@/components/forms/ApplyJobForm";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

async function getJobSeekerData(userId: string) {
    const jobSeeker = await prisma.jobSeeker.findFirst({
        where: { userId },
        select: {
            id: true,
            name: true,
            about: true,
            resume: true
        }
    });

    if (!jobSeeker) {
        redirect('/onboarding');
    }

    return jobSeeker;
}

async function getJobData(jobId: string) {
    const job = await prisma.jobPost.findUnique({
        where: {
            id: jobId,
            status: "ACTIVE"
        },
        select: {
            id: true,
            jobTitle: true,
            employmentType:true,
            Company: {
                select: {
                    name: true,
                }
            }
        }
    });

    if (!job) {
        notFound();
    }

    return job;
}

type Params = Promise<{jobId:string}>
export default async function ApplyPage({ params }: { params: Params }) {
    const session = await requireUser();
    const {jobId} = await params;
    
    if (!session?.id) {
        redirect('/login');
    }

    // Check if user has already applied
    const existingApplication = await prisma.application.findFirst({
        where: {
            jobPostId: jobId,
            JobSeeker: {
                userId: session.id
            }
        }
    });

    if (existingApplication) {
        redirect('/applications');
    }

    const [jobSeeker, job] = await Promise.all([
        getJobSeekerData(session.id),
        getJobData(jobId)
    ]);

    return (
        <div className="container max-w-2xl py-8">
            <ApplyJobForm jobSeeker={jobSeeker} jobId={jobId} jobTitle={job.jobTitle} companyName={job.Company.name} employmentType={job.employmentType}/>
        </div>
    );
}