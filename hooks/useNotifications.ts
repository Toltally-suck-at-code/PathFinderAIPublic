"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export interface NotificationCount {
  pendingRequests: number;
  total: number;
}

export function useNotifications(): NotificationCount {
  const receivedRequests = useQuery(api.linkup.getReceivedIntroRequests, {});

  const pendingRequests =
    receivedRequests?.filter((r) => r.status === "pending").length || 0;

  return {
    pendingRequests,
    total: pendingRequests,
  };
}