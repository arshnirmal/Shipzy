"use client";

import { NotificationList } from "@/components/notifications/notification-list";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Order updates, billing alerts, and system announcements.
        </p>
      </div>

      <NotificationList />
    </div>
  );
}
