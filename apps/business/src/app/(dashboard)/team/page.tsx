"use client";

import { TeamList } from "@/components/team/team-list";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View and manage your business team members.
        </p>
      </div>

      <TeamList />
    </div>
  );
}
