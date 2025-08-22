import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./useAuth";
import type { Notification } from "@shared/schema";

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query for user notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await apiRequest("GET", `/api/notifications/user/${user.id}`);
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query for unread notification count
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread", user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0 };
      const response = await apiRequest("GET", `/api/notifications/user/${user.id}/unread-count`);
      return response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 15000, // Check more frequently for unread count
  });

  // Mutation to mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread", user?.id] });
    },
  });

  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const response = await apiRequest("PATCH", `/api/notifications/user/${user.id}/read-all`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread", user?.id] });
    },
  });

  const formatNotificationTime = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return created.toLocaleDateString();
  };

  return {
    notifications,
    unreadCount: unreadCountData?.count || 0,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    formatNotificationTime,
  };
}