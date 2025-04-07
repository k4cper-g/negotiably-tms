"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Loader2, Trash2, CornerRightDown, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationsPage = () => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // Fetch notifications with the selected filter
  const { notifications, unreadCount } = useQuery(api.notifications.getUserNotifications, { 
    filter: activeFilter as "all" | "unread" | "agent" 
  }) || { notifications: [], unreadCount: 0 };
  
  const markReadMutation = useMutation(api.notifications.markNotificationRead);
  const markAllReadMutation = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotificationMutation = useMutation(api.notifications.deleteNotification);
  const clearAllNotificationsMutation = useMutation(api.notifications.clearAllNotifications);
  
  const [processingId, setProcessingId] = useState<Id<"notifications"> | null>(null);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  // Mark a single notification as read
  const handleMarkRead = async (notificationId: Id<"notifications">) => {
    setProcessingId(notificationId);
    try {
      await markReadMutation({ notificationId });
      toast.success("Notification marked as read");
    } catch (error: any) {
      toast.error(error.message || "Failed to mark notification as read");
    } finally {
      setProcessingId(null);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    setIsProcessingAll(true);
    try {
      const result = await markAllReadMutation({ filter: activeFilter as "all" | "agent" });
      toast.success(`${result.count} notifications marked as read`);
    } catch (error: any) {
      toast.error(error.message || "Failed to mark notifications as read");
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Delete a notification
  const handleDelete = async (notificationId: Id<"notifications">) => {
    setProcessingId(notificationId);
    try {
      await deleteNotificationMutation({ notificationId });
      toast.success("Notification deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete notification");
    } finally {
      setProcessingId(null);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    setIsProcessingAll(true);
    try {
      const result = await clearAllNotificationsMutation({ filter: activeFilter as "all" | "unread" | "agent" });
      toast.success(`${result.count} notifications cleared`);
    } catch (error: any) {
      toast.error(error.message || "Failed to clear notifications");
    } finally {
      setIsProcessingAll(false);
    }
  };

  // Get the icon for a notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'agent_needs_review':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'agent_price_increase':
        return <AlertCircle className="h-5 w-5 text-green-500" />;
      case 'agent_new_terms':
        return <CornerRightDown className="h-5 w-5 text-blue-500" />;
      case 'negotiation_update':
        return <Bell className="h-5 w-5 text-slate-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  // Get the text for a notification badge
  const getNotificationBadgeText = (type: string) => {
    switch (type) {
      case 'agent_needs_review':
        return 'Review';
      case 'agent_price_increase':
        return 'Price Update';
      case 'agent_new_terms':
        return 'New Terms';
      case 'negotiation_update':
        return 'Update';
      default:
        return 'Notification';
    }
  };

  const isLoading = notifications === undefined;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-semibold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>
        
        <div className="mx-auto w-full max-w-6xl">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Notifications</CardTitle>
                  <CardDescription>
                    Stay updated on your negotiation progress and AI agent activities
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={isProcessingAll || isLoading || (notifications && notifications.length === 0)}
                  >
                    {isProcessingAll ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCheck className="mr-2 h-4 w-4" />
                    )}
                    Mark all read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={isProcessingAll || isLoading || (notifications && notifications.length === 0)}
                  >
                    {isProcessingAll ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Clear all
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveFilter}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="agent">Agent</TabsTrigger>
                </TabsList>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div 
                        key={notification._id} 
                        className={`flex items-start justify-between p-4 rounded-lg border ${!notification.isRead ? 'bg-muted/60' : ''}`}
                      >
                        <div className="flex gap-3">
                          {getNotificationIcon(notification.type)}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{notification.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {getNotificationBadgeText(notification.type)}
                              </Badge>
                              {!notification.isRead && (
                                <Badge variant="secondary" className="text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">{notification.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                              {notification.sourceName && ` • ${notification.sourceName}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkRead(notification._id)}
                              disabled={processingId === notification._id}
                            >
                              {processingId === notification._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCheck className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(notification._id)}
                            disabled={processingId === notification._id}
                          >
                            {processingId === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No notifications to display</p>
                  </div>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;