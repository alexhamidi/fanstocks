// src/app/_components/Profile.tsx
"use client";

import { useAuth } from "../_context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutUser } from "../_utils/api";

export default function Profile() {
  const { user, setUser } = useAuth();

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium">Email: {user.email}</p>
          <p className="text-sm text-gray-500">
            Member since: {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button onClick={handleLogout} className="w-full">
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}
