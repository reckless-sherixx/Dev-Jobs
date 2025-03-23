import { requireUser } from "@/app/utils/requireUser";
import { EditJobForm } from "@/components/forms/EditJobForm";
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation";

async function getData(jobId: string, userId: string) {
    const data = await prisma.jobPost.findUnique({
        where: {
            id: jobId,
            Company: {
                userId: userId,
            }
        },
        select: {
            benefits: true,
            id: true,
            jobTitle: true,
            jobDescription: true,
            salaryTo: true,
            salaryFrom: true,
            location: true,
            employmentType: true,
            listingDuration: true,
            Company: {
                select: {
                    about: true,
                    name: true,
                    location: true,
                    website: true,
                    linkedin: true,
                    logo: true,
                },
            },
        },
    });
    if (!data) {
        return notFound();
    }
    return data;
}

type Params = Promise<{ jobId: string }>;
export default async function EditJobPage({ params }: { params: Params }) {
    const { jobId } = await params;
    const user = await requireUser();
    const data = await getData(jobId, user.id as string);
    return (
        <EditJobForm jobPost={data} />
    )
}