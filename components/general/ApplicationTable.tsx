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
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { updateApplicationStatus } from "@/app/actions";
import { toast } from "sonner";

interface ApplicationsTableProps {
    applications: {
        id: string;
        name: string;
        about: string;
        resume: string;
        status: "PENDING" | "ACCEPTED" | "REJECTED";
        createdAt: Date;
        jobTitle: string;
        companyName: string;
    }[];
    viewType: "COMPANY" | "JOBSEEKER";
}

export function ApplicationsTable({ applications, viewType }: ApplicationsTableProps) {
    const [updating, setUpdating] = useState<string | null>(null);

    async function handleStatusUpdate(id: string, status: "ACCEPTED" | "REJECTED") {
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
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Status</TableHead>
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
                                    application.status === "ACCEPTED" ? "success" :
                                        application.status === "REJECTED" ? "destructive" :
                                            "secondary"
                                }>
                                    {application.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
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
                                application.status === "ACCEPTED" ? "success" :
                                    application.status === "REJECTED" ? "destructive" :
                                        "secondary"
                            }>
                                {application.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                                {application.status === "PENDING" && (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => handleStatusUpdate(application.id, "ACCEPTED")}
                                            disabled={updating === application.id}
                                        >
                                            {updating === application.id ? "Accepting..." : "Accept"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleStatusUpdate(application.id, "REJECTED")}
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