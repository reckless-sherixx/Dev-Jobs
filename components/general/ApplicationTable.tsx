"use client"
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { deleteApplication, updateApplicationStatus } from "@/app/actions";
import { toast } from "sonner";
import { ApplicationStatus } from "@prisma/client";
import Link from "next/link";
import { BaggageClaim, MoreHorizontal, XCircle } from "lucide-react";

interface ApplicationsTableProps {
    applications: {
        id: string;
        jobId: string;
        name: string;
        about: string;
        resume: string;
        status: ApplicationStatus;
        createdAt: Date;
        jobTitle: string;
        companyName: string;
    }[];
    viewType: "COMPANY" | "JOBSEEKER";
}

export function ApplicationsTable({ applications, viewType }: ApplicationsTableProps) {
    const [updating, setUpdating] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDeleteApplication = async (applicationId: string) => {
        try {
            setDeleting(applicationId);
            await deleteApplication(applicationId);
            toast.success('Application deleted successfully');
        } catch{
            toast.error('Failed to delete application');
        } finally {
            setDeleting(null);
        }
    };


    async function handleStatusUpdate(id: string, status: ApplicationStatus) {
        try {
            setUpdating(id);
            await updateApplicationStatus(id, status);
            toast.success(`Application ${status.toLowerCase()}`);
        } catch {
            toast.error("Failed to update application status");
        } finally {
            setUpdating(null);
        }
    }

    if (!applications.length) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">No applications found</p>
                <p className="text-sm text-muted-foreground">
                    {viewType === "JOBSEEKER"
                        ? "You haven't applied to any jobs yet"
                        : "No applications received yet"}
                </p>
            </div>
        );
    }

    if (viewType === "JOBSEEKER") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold mb-1">
                        My Job Applications
                    </CardTitle>
                    <CardDescription>
                        Manage your job listings and applications here.
                    </CardDescription>
                    <CardContent>
                        <Table className="mt-6">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Company</TableHead>
                                    <TableHead>Applied On</TableHead>
                                    <TableHead>Status On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.map((application) => (
                                    <TableRow key={application.id}>
                                        <TableCell>{application.jobTitle}</TableCell>
                                        <TableCell>{application.companyName}</TableCell>
                                        <TableCell>
                                            {new Date(application.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                application.status === ApplicationStatus.SELECTED ? "success" :
                                                    application.status === ApplicationStatus.REJECTED ? "destructive" :
                                                        application.status === ApplicationStatus.SHORTLISTED ? "secondary" :
                                                            application.status === ApplicationStatus.IN_PROGRESS ? "default" :
                                                                "outline"
                                            }>
                                                {application.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/job/${application.jobId}`}>
                                                            <BaggageClaim className="mr-2 size-4" />
                                                            View Job
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteApplication(application.id)}
                                                        disabled={deleting === application.id}
                                                        className="text-destructive"
                                                    >
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        {deleting === application.id ? "Deleting..." : "Delete Application"}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {applications.map((application) => (
                    <TableRow key={application.id}>
                        <TableCell>
                            <div>
                                <p className="font-medium">{application.name}</p>
                            </div>
                        </TableCell>
                        <TableCell>{application.jobTitle}</TableCell>
                        <TableCell>
                            {new Date(application.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                            <Badge variant={
                                application.status === ApplicationStatus.SELECTED ? "success" :
                                    application.status === ApplicationStatus.REJECTED ? "destructive" :
                                        application.status === ApplicationStatus.SHORTLISTED ? "warning" :
                                            application.status === ApplicationStatus.IN_PROGRESS ? "default" :
                                                "secondary"
                            }>
                                {application.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                {application.status === ApplicationStatus.PENDING && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => handleStatusUpdate(application.id, ApplicationStatus.SELECTED)}
                                            disabled={updating === application.id}
                                        >
                                            {updating === application.id ? "Accepting..." : "Accept"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleStatusUpdate(application.id, ApplicationStatus.REJECTED)}
                                            disabled={updating === application.id}
                                        >
                                            {updating === application.id ? "Rejecting..." : "Reject"}
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(application.resume, '_blank')}
                                >
                                    View Resume
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}