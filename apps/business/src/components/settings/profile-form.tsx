"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useAuth } from "@/providers/auth-provider";

export function ProfileForm() {
  const { data, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();

  const profile = data?.data.profile;

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Sync form state when profile loads
  const isFormInitialized = profile && !fullName && !phoneNumber;
  if (isFormInitialized) {
    setFullName(profile.fullName ?? "");
    setPhoneNumber(profile.phoneNumber ?? "");
  }

  const handleSave = () => {
    const payload: Record<string, string> = {};
    if (fullName !== (profile?.fullName ?? "")) payload.fullName = fullName;
    if (phoneNumber !== (profile?.phoneNumber ?? "")) payload.phoneNumber = phoneNumber;

    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save.");
      return;
    }

    updateProfile.mutate(payload, {
      onSuccess: () => toast.success("Profile updated successfully."),
      onError: (err) => toast.error(err.message || "Failed to update profile."),
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Personal Information</CardTitle>
          <CardDescription>Update your name and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email ?? user?.email ?? ""}
                readOnly
                className="bg-surface-container-low text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 99999 99999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Input
                id="role"
                value="Business"
                readOnly
                className="bg-surface-container-low text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
              className="gradient-brand text-primary-foreground"
            >
              {updateProfile.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Business Details</CardTitle>
          <CardDescription>Business information set during registration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={user?.businessName ?? ""}
                readOnly
                className="bg-surface-container-low text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label>Verification Status</Label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    profile?.isVerified
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {profile?.isVerified ? "Verified" : "Pending Verification"}
                </span>
              </div>
            </div>
          </div>

          <Separator className="opacity-20" />

          <p className="text-xs text-muted-foreground">
            Business details like GST number and monthly volume can be updated by contacting support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
