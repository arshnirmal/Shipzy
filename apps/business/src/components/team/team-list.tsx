"use client";

import { Crown, Mail, Phone, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";

type TeamMember = {
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  phone?: string;
};

function MemberCard({ member }: { member: TeamMember }) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="transition-all hover:shadow-[var(--shadow-ambient-sm)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <Avatar className="size-10 border">
              <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{member.name}</p>
                {member.role === "owner" && (
                  <Crown className="size-3.5 text-amber-500 shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge
                  variant={member.role === "owner" ? "default" : "secondary"}
                  className="text-[10px] uppercase tracking-wider"
                >
                  {member.role}
                </Badge>
              </div>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3" /> {member.email}
                </p>
                {member.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="size-3" /> {member.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamList() {
  const { user } = useAuth();

  // Currently only the owner is shown; team invites are not yet supported
  const members: TeamMember[] = [
    {
      name: user?.fullName ?? "Business Owner",
      email: user?.email ?? "",
      role: "owner",
      phone: user?.phoneNumber,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length === 1 ? "" : "s"} in your organization.
          </p>
        </div>
        <Button variant="outline" disabled title="Team invites coming soon">
          <UserPlus className="mr-2 size-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, i) => (
          <MemberCard key={i} member={member} />
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Team management features — including role-based access and member invitations — will be available in a future update.
        </p>
      </div>
    </div>
  );
}
