"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../_context/AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoaded && !user) {
      router.replace("/login"); // Use replace to prevent back navigation
    }
  }, [isAuthLoaded, user, router]);

  if (!isAuthLoaded || !user) return null; // Prevent flickering

  return <>{children}</>;
}
