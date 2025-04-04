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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation"; 
import {
    deleteApplication,
    shortlistApplicant,
    updateInterviewRoundStatus,
    advanceToNextRound,
    selectCandidate,
    rejectCandidate
} from "@/app/actions";
import { toast } from "sonner";
import { ApplicationStatus, InterviewRoundStatus } from "@prisma/client";
import Link from "next/link";
import { BaggageClaim, MoreHorizontal, XCircle, CheckCircle, UserCheck, UserX, ThumbsUp, ThumbsDown, FileText, Hourglass, Rocket } from "lucide-react";
import { ApplicationWithDetails } from "@/app/(mainLayout)/dashboard/applications/page"; // Import shared type

interface ApplicationsTableProps {
    applications: ApplicationWithDetails[];
    viewType: "COMPANY" | "JOBSEEKER";
}


// Helper to get status badge variant
const getStatusBadgeVariant = (status: ApplicationStatus): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (status) {
        case ApplicationStatus.SELECTED: return "success";
        case ApplicationStatus.REJECTED: return "destructive";
        case ApplicationStatus.SHORTLISTED: return "warning";
        case ApplicationStatus.IN_PROGRESS: return "default";
        case ApplicationStatus.PENDING: return "secondary";
        default: return "outline";
    }
};

// Helper to get round status badge variant
const getRoundStatusBadgeVariant = (status: InterviewRoundStatus): "default" | "success" | "destructive" | "secondary" => {
    switch (status) {
        case InterviewRoundStatus.QUALIFIED: return "success";
        case InterviewRoundStatus.NOT_QUALIFIED: return "destructive";
        case InterviewRoundStatus.PENDING: return "secondary";
        default: return "default";
    }
};

// Helper to format status and round
const formatApplicationStage = (app: ApplicationWithDetails): string => {
    switch (app.status) {
        case ApplicationStatus.PENDING: return "Pending Review";
        case ApplicationStatus.SHORTLISTED: return `Shortlisted (Round ${app.currentRound})`;
        case ApplicationStatus.IN_PROGRESS: return `In Progress (Round ${app.currentRound})`;
        case ApplicationStatus.SELECTED: return "Selected";
        case ApplicationStatus.REJECTED: return "Rejected";
        default: return app.status;
    }
};


export function ApplicationsTable({ applications, viewType }: ApplicationsTableProps) {
    const [isPending, startTransition] = useTransition();
    const [pendingAction, setPendingAction] = useState<string | null>(null); 
    const router = useRouter(); 

     // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAction = (action: () => Promise<any>, successMessage: string, errorMessage: string, actionId: string) => {
        setPendingAction(actionId);
        startTransition(async () => {
            try {
                await action();
                toast.success(successMessage);
                router.refresh(); 
            } catch{
                toast.error("Unable to perform action");
            } finally {
                setPendingAction(null);
            }
        });
    };

    const handleDeleteApplication = (applicationId: string) => {
        handleAction(
            () => deleteApplication(applicationId),
            'Application deleted successfully',
            'Failed to delete application',
            `delete-${applicationId}`
        );
    };

    const handleShortlist = (applicationId: string) => {
        handleAction(
            async () => {
                try {
                    await shortlistApplicant(applicationId);
                } catch {
                    throw new Error("Failed to shortlist applicant");
                }
            },
            'Applicant shortlisted for Round 1',
            'Failed to shortlist applicant',
            `shortlist-${applicationId}`
        );
    };
    const handleUpdateRoundStatus = (roundId: string, status: InterviewRoundStatus, applicationId: string) => {
        const statusText = status === InterviewRoundStatus.QUALIFIED ? 'qualified' : 'not qualified';
        handleAction(
            () => updateInterviewRoundStatus(roundId, status , applicationId),
            `Round marked as ${statusText}`,
            `Failed to update round status`,
            `update-round-${roundId}-${status}`
        );
    };

    const handleAdvance = (applicationId: string) => {
        handleAction(
            () => advanceToNextRound(applicationId),
            'Applicant advanced to the next round',
            'Failed to advance applicant',
            `advance-${applicationId}`
        );
    };

    const handleSelect = (applicationId: string) => {
        handleAction(
            () => selectCandidate(applicationId),
            'Candidate selected successfully',
            'Failed to select candidate',
            `select-${applicationId}`
        );
    };

    const handleReject = (applicationId: string) => {
        handleAction(
            () => rejectCandidate(applicationId),
            'Candidate rejected',
            'Failed to reject candidate',
            `reject-${applicationId}`
        );
    };


    if (!applications.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold mb-1">
                        {viewType === "JOBSEEKER" ? "My Job Applications" : "Job Applicants"}
                    </CardTitle>
                    <CardDescription>
                        {viewType === "JOBSEEKER" ? "Manage your job applications here." : "Manage your job applicants here."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No applications found</p>
                    <p className="text-sm text-muted-foreground">
                        {viewType === "JOBSEEKER"
                            ? "You haven't applied to any jobs yet."
                            : "No applications received for your jobs yet."}
                    </p>
                    {viewType === "COMPANY" && (
                        <Button asChild className="mt-4">
                            <Link href="/post-job">Post a New Job</Link>
                        </Button>
                    )}
                    {viewType === "JOBSEEKER" && (
                        <Button asChild className="mt-4">
                            <Link href="/">Find Jobs</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        );
    }

    // --- JOB SEEKER VIEW ---
    if (viewType === "JOBSEEKER") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold mb-1">
                        My Job Applications
                    </CardTitle>
                    <CardDescription>
                        Track the status of your job applications.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table className="mt-6">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Job Title</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Applied On</TableHead>
                                <TableHead>Current Stage</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((application) => (
                                <TableRow key={application.id} id={application.id}> 
                                    <TableCell className="font-medium">{application.jobTitle}</TableCell>
                                    <TableCell>{application.companyName}</TableCell>
                                    <TableCell>
                                        {new Date(application.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(application.status)}>
                                            {formatApplicationStage(application)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isPending && pendingAction?.startsWith(`delete-${application.id}`)}>
                                                    {isPending && pendingAction === `delete-${application.id}` ? <Hourglass className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/job/${application.jobId}`}>
                                                        <BaggageClaim className="mr-2 size-4" />
                                                        View Job Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleDeleteApplication(application.id)}
                                                    disabled={isPending && pendingAction?.startsWith(`delete-${application.id}`)}
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                >
                                                    <XCircle className="mr-2 h-4 w-4" />
                                                    {pendingAction === `delete-${application.id}` ? "Deleting..." : "Withdraw Application"}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    }

    // --- COMPANY VIEW ---
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-bold mb-1">
                    Job Applicants
                </CardTitle>
                <CardDescription>
                    Manage applicants for your job postings.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Applied On</TableHead>
                            <TableHead>Current Stage</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {applications.map((application) => {
                            const currentActiveRound = application.interviewRounds.find(r => r.roundNumber === application.currentRound);
                            const isActionPending = isPending && pendingAction?.includes(application.id);
                            const isTerminalStatus = application.status === ApplicationStatus.SELECTED || application.status === ApplicationStatus.REJECTED;

                            return (
                                <TableRow key={application.id}>
                                    <TableCell>
                                        <div className="font-medium">{application.name}</div>
                                    </TableCell>
                                    <TableCell>{application.jobTitle}</TableCell>
                                    <TableCell>
                                        {new Date(application.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(application.status)}>
                                            {formatApplicationStage(application)}
                                        </Badge>
                                        {/* Only show round badge if status is not terminal and round exists */}
                                        {currentActiveRound && !isTerminalStatus && (
                                            <Badge variant={getRoundStatusBadgeVariant(currentActiveRound.status)} className="ml-2">
                                                Round {currentActiveRound.roundNumber}: {currentActiveRound.status}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(application.resume, '_blank')}
                                                disabled={isActionPending}
                                            >
                                                <FileText className="mr-1 h-4 w-4" /> Resume
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isActionPending}>
                                                        {isActionPending ? <Hourglass className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Manage Application</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuGroup>
                                                        {application.status === ApplicationStatus.PENDING && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleShortlist(application.id)}
                                                                disabled={isPending && pendingAction === `shortlist-${application.id}`}
                                                            >
                                                                <CheckCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                                                {pendingAction === `shortlist-${application.id}` ? "Shortlisting..." : "Shortlist for Round 1"}
                                                            </DropdownMenuItem>
                                                        )}

                                                        {/* Actions for active rounds */}
                                                        {currentActiveRound && !isTerminalStatus && (
                                                            <>
                                                                {currentActiveRound.status === InterviewRoundStatus.PENDING && (
                                                                    <DropdownMenuSub>
                                                                        <DropdownMenuSubTrigger>
                                                                            <Hourglass className="mr-2 h-4 w-4" />
                                                                            Evaluate Round {currentActiveRound.roundNumber}
                                                                        </DropdownMenuSubTrigger>
                                                                        <DropdownMenuPortal>
                                                                            <DropdownMenuSubContent>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleUpdateRoundStatus(currentActiveRound.id, InterviewRoundStatus.QUALIFIED, application.id)}
                                                                                    disabled={isPending && pendingAction === `update-round-${currentActiveRound.id}-${InterviewRoundStatus.QUALIFIED}`}
                                                                                >
                                                                                    <ThumbsUp className="mr-2 h-4 w-4 text-green-500" /> Mark as Qualified
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleUpdateRoundStatus(currentActiveRound.id, InterviewRoundStatus.NOT_QUALIFIED, application.id)}
                                                                                    disabled={isPending && pendingAction === `update-round-${currentActiveRound.id}-${InterviewRoundStatus.NOT_QUALIFIED}`}
                                                                                    className="text-destructive focus:text-destructive"
                                                                                >
                                                                                    <ThumbsDown className="mr-2 h-4 w-4" /> Mark as Not Qualified
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuSubContent>
                                                                        </DropdownMenuPortal>
                                                                    </DropdownMenuSub>
                                                                )}

                                                                {currentActiveRound.status === InterviewRoundStatus.QUALIFIED && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleAdvance(application.id)}
                                                                        disabled={isPending && pendingAction === `advance-${application.id}`}
                                                                    >
                                                                        <Rocket className="mr-2 h-4 w-4 text-blue-500" />
                                                                        {pendingAction === `advance-${application.id}` ? "Advancing..." : `Advance to Round ${currentActiveRound.roundNumber + 1}`}
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* select or reject only if not done before*/}
                                                        {!isTerminalStatus && (application.status === ApplicationStatus.SHORTLISTED || application.status === ApplicationStatus.IN_PROGRESS) && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleSelect(application.id)}
                                                                    disabled={isPending && pendingAction === `select-${application.id}`}
                                                                    className="text-success focus:text-success focus:bg-green-100 dark:focus:bg-green-900"
                                                                >
                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                    {pendingAction === `select-${application.id}` ? "Selecting..." : "Select Candidate"}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => handleReject(application.id)}
                                                                    disabled={isPending && pendingAction === `reject-${application.id}`}
                                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                >
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    {pendingAction === `reject-${application.id}` ? "Rejecting..." : "Reject Candidate"}
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
