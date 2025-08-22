import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";

interface AuthUser {
  id: string;
  username: string;
  role: string;
  balance: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const queryClient = useQueryClient();

  // Query to refresh user data from server
  const userQuery = useQuery({
    queryKey: ["/api/auth/user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await apiRequest("GET", `/api/auth/user?userId=${user.id}`);
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; inviteCode: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
    },
  });

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    queryClient.clear();
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("auth_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("auth_user");
      }
    }
  }, []);

  // Use fresh data from server if available, otherwise use localStorage data
  const currentUser = userQuery.data || user;

  return {
    user: currentUser,
    login: loginMutation,
    register: registerMutation,
    logout,
    isAuthenticated: !!currentUser,
    refetchUser: userQuery.refetch,
  };
}
