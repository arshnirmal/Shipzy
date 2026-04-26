"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone } from "lucide-react";

export function SecuritySection() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-medium">Security & Sessions</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account security and active sessions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            Password
          </CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Password change functionality will be available in a future update.
            Contact support if you need to reset your password.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            Active Sessions
          </CardTitle>
          <CardDescription>Devices currently signed in to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-surface-container-lowest p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-surface-container-high">
                <Smartphone className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Current Session</p>
                <p className="text-xs text-muted-foreground">Web Browser</p>
              </div>
            </div>
            <Badge variant="default" className="text-[10px]">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
