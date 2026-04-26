"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { AddressesSection } from "@/components/settings/addresses-section";
import { SecuritySection } from "@/components/settings/security-section";

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your profile, saved addresses, and account security.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-10 bg-surface-container-low p-1">
          <TabsTrigger value="profile" className="rounded-md px-4 text-sm data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-sm">
            Profile
          </TabsTrigger>
          <TabsTrigger value="addresses" className="rounded-md px-4 text-sm data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-sm">
            Addresses
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-md px-4 text-sm data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-sm">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="addresses" className="mt-6">
          <AddressesSection />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecuritySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
