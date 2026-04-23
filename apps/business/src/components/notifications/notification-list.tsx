"use client";

import { format, formatDistanceToNow } from "date-fns";
import { Bell, Check, Package, AlertTriangle, CreditCard, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MockNotification = {
  id: string;
  type: "order_update" | "billing_alert" | "team_invite" | "system";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "1",
    type: "order_update",
    title: "Order #ORD-1024 delivered",
    description: "Your package has been successfully delivered to Koramangala.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
  },
  {
    id: "2",
    type: "order_update",
    title: "Driver assigned to ORD-1025",
    description: "Rohit Kumar has accepted your delivery request.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    read: false,
  },
  {
    id: "3",
    type: "billing_alert",
    title: "Monthly invoice ready",
    description: "Your April invoice for ₹16,500 is now available for download.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: true,
  },
  {
    id: "4",
    type: "system",
    title: "Scheduled maintenance",
    description: "The platform will undergo maintenance on Apr 25, 2:00–4:00 AM IST.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: "5",
    type: "order_update",
    title: "Bulk order completed",
    description: "All 12 orders from your bulk upload have been created successfully.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

const TYPE_CONFIG: Record<
  MockNotification["type"],
  { icon: typeof Package; color: string; label: string }
> = {
  order_update: { icon: Package, color: "text-blue-500", label: "Order" },
  billing_alert: { icon: CreditCard, color: "text-amber-500", label: "Billing" },
  team_invite: { icon: Users, color: "text-green-500", label: "Team" },
  system: { icon: AlertTriangle, color: "text-muted-foreground", label: "System" },
};

function NotificationCard({ notification }: { notification: MockNotification }) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  return (
    <Card className={`transition-all hover:shadow-[var(--shadow-ambient-sm)] ${!notification.read ? "border-l-2 border-l-primary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high ${config.color}`}>
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                {notification.title}
              </p>
              {!notification.read && (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {notification.description}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationList() {
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read);
  const all = MOCK_NOTIFICATIONS;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {unread.length > 0
              ? `${unread.length} unread notification${unread.length === 1 ? "" : "s"}`
              : "You're all caught up!"}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Check className="size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="h-10 bg-surface-container-low p-1">
          <TabsTrigger value="all" className="rounded-md px-4 text-sm data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-md px-4 text-sm data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-sm">
            Unread {unread.length > 0 && `(${unread.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-3">
          {all.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </TabsContent>
        <TabsContent value="unread" className="mt-4 space-y-3">
          {unread.length > 0 ? (
            unread.map((n) => <NotificationCard key={n.id} notification={n} />)
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-surface-container-highest mb-4">
                <Bell className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No unread notifications</h3>
              <p className="mt-1 text-sm text-muted-foreground">You've read everything.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
