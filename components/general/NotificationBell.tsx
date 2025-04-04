"use client";

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { Notification, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/app/actions';
import { useRouter } from 'next/navigation'; 

export function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null); 
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const loadNotifications = useCallback(async () => {
        setFetchError(null); // Reset error state on new fetch attempt
        // Only load if userId is provided
        if (!userId) {
            console.warn("NotificationBell: No userId provided, skipping fetch.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const fetchedNotifications = await getNotifications(userId);
            setNotifications(fetchedNotifications);
            setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            console.error(`NotificationBell: Could not load notifications for userId ${userId}`, error); 
            setFetchError(errorMessage); // Store error message
            toast.error(`Could not load notifications: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [userId]); // Dependency array includes userId

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications,userId]);

    const handleMarkAsRead = async (notificationId: string) => {
        startTransition(async () => {
            try {
                await markNotificationAsRead(notificationId);
                setNotifications(prev =>
                    prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
                toast.success("Marked as read");

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to mark as read: ${errorMessage}`);

                setNotifications(prev =>
                    prev.map(n => (n.id === notificationId ? { ...n, read: false } : n))
                );
                setUnreadCount(prev => prev + 1);
            }
        });
    };

    const handleMarkAllRead = async () => {
        startTransition(async () => {
            const originalNotifications = [...notifications];
            const originalUnreadCount = unreadCount;
            try {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                await markAllNotificationsAsRead(userId);
                toast.success("All notifications marked as read");
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                toast.error(`Failed to mark all as read: ${errorMessage}`);
                setNotifications(originalNotifications);
                setUnreadCount(originalUnreadCount);
            }
        });
    };

    // Function to handle clicking on a notification item
    const handleNotificationClick = (notification: Notification) => {
        // Mark as read if not already read
        if (!notification.read) {
            handleMarkAsRead(notification.id);
        }
        // Navigate to the application page with hash
        if (notification.applicationId) {
            router.push(`/applications#${notification.applicationId}`);
        } else {
            router.push('/applications'); // Fallback if no applicationId
        }
    };


    return (
        <DropdownMenu onOpenChange={(open) => {
            // Reload notifications when the menu is opened to ensure freshness
            if (open) {
                console.log("NotificationBell: Dropdown opened, reloading notifications.");
                loadNotifications();
            }
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {notifications.length > 0 && unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent menu closing
                                handleMarkAllRead();
                            }}
                            disabled={isPending}
                            className="text-xs h-auto px-2 py-1"
                        >
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                    <div className="p-2 space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : fetchError ? ( // Display error message if fetch failed
                    <p className="p-4 text-sm text-destructive text-center">
                        Error loading notifications: <br /> {fetchError}
                    </p>
                ) : notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                        No notifications yet
                    </p>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex items-start gap-2 cursor-pointer ${!notification.read ? 'font-semibold' : ''}`}
                                onSelect={(e) => {
                                    e.preventDefault(); // Prevent default closing behavior
                                    handleNotificationClick(notification);
                                }}
                            >
                                <div className="flex-grow">
                                    {/* Link removed, navigation handled by onSelect */}
                                    <p className="text-sm mb-1">{notification.title}</p>
                                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(notification.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 flex-shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent triggering item onSelect
                                            handleMarkAsRead(notification.id);
                                        }}
                                        disabled={isPending}
                                        aria-label="Mark as read"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="justify-center cursor-pointer">
                    <Link href="/applications" className="text-sm text-center w-full">
                        View all applications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
