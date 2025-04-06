"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Bell, CheckCheck, Trash2, MoreVertical, X, Bot, AlertTriangle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const router = useRouter();
  
  // Fetch notifications based on active tab
  const filter = activeTab === "unread" ? "unread" : activeTab === "agent" ? "agent" : "all";
  const notificationsData = useQuery(api.notifications.getUserNotifications, { 
    filter,
    limit: 50  // Fetch more notifications at once
  });
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;
  
  // Mutations
  const markNotificationRead = useMutation(api.notifications.markNotificationRead);
  const markAllRead = useMutation(api.notifications.markAllNotificationsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const clearAllNotifications = useMutation(api.notifications.clearAllNotifications);
  
  // Handlers
  const handleMarkAllAsRead = async () => {
    setIsMarkingRead(true);
    try {
      await markAllRead({ filter: activeTab === "agent" ? "agent" : undefined });
    } finally {
      setIsMarkingRead(false);
    }
  };
  
  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications? This cannot be undone.")) {
      return;
    }
    
    setIsClearing(true);
    try {
      await clearAllNotifications({ 
        filter: activeTab === "unread" ? "read" : activeTab === "agent" ? "agent" : undefined 
      });
    } finally {
      setIsClearing(false);
    }
  };
  
  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationRead({ notificationId: notification._id });
    }
    
    // Navigate to source if available
    if (notification.sourceId) {
      router.push(`/negotiations/${notification.sourceId}`);
    }
  };
  
  const handleDeleteNotification = async (e: React.MouseEvent, id: Id<"notifications">) => {
    e.stopPropagation();
    await deleteNotification({ notificationId: id });
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "agent_needs_review":
        return <Bot className="h-5 w-5 text-amber-500" />;
      case "agent_price_increase":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "agent_new_terms":
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };
  
  if (!notificationsData) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest activity and alerts.
        </p>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all" className="relative">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1.5 px-1.5 py-0">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agent" className="relative">
              AI Agent
            </TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
              disabled={isMarkingRead || unreadCount === 0}
            >
              {isMarkingRead ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Mark all as read
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              disabled={isClearing || notifications.length === 0}
            >
              {isClearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear all
            </Button>
          </div>
        </div>
        
        <TabsContent value="all">
          <NotificationsList 
            notifications={notifications} 
            onNotificationClick={handleNotificationClick}
            onDeleteNotification={handleDeleteNotification}
            getNotificationIcon={getNotificationIcon}
          />
        </TabsContent>
        
        <TabsContent value="unread">
          <NotificationsList 
            notifications={notifications} 
            onNotificationClick={handleNotificationClick}
            onDeleteNotification={handleDeleteNotification}
            getNotificationIcon={getNotificationIcon}
          />
        </TabsContent>
        
        <TabsContent value="agent">
          <NotificationsList 
            notifications={notifications} 
            onNotificationClick={handleNotificationClick}
            onDeleteNotification={handleDeleteNotification}
            getNotificationIcon={getNotificationIcon}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Define notification type
interface Notification {
  _id: Id<"notifications">;
  type: "agent_needs_review" | "agent_price_increase" | "agent_new_terms" | "negotiation_update";
  title: string;
  content: string;
  sourceId?: Id<"negotiations">;
  sourceName?: string;
  isRead: boolean;
  createdAt: number;
}

function NotificationsList({ 
  notifications, 
  onNotificationClick, 
  onDeleteNotification,
  getNotificationIcon
}: { 
  notifications: Notification[], 
  onNotificationClick: (notification: Notification) => void,
  onDeleteNotification: (e: React.MouseEvent, id: Id<"notifications">) => void,
  getNotificationIcon: (type: string) => React.ReactNode
}) {
  if (notifications.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-muted rounded-full p-3 mb-4">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No notifications</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            When you receive notifications, they will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-4">
      <CardContent className="p-0">
        <ul className="divide-y">
          {notifications.map((notification, index) => (
            <li 
              key={notification._id} 
              className={cn(
                "flex p-4 hover:bg-muted/40 transition-colors cursor-pointer",
                !notification.isRead && "bg-primary/5"
              )}
              onClick={() => onNotificationClick(notification)}
            >
              <div className="flex-shrink-0 mr-4 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <p className={cn("text-sm font-medium", !notification.isRead && "font-semibold")}>
                    {notification.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    {!notification.isRead && (
                      <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => onDeleteNotification(e, notification._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.content}
                </p>
                
                {notification.sourceName && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {notification.sourceName}
                    </Badge>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
} 