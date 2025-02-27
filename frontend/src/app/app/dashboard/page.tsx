"use client";

import { Button } from "@/components/ui/button";
import ProtectedRoute from "../../_components/ProtectedRoute";
import { useAuth } from "../../_context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  const handleTest = async () => {
    const response = await fetch("/api/auth");
    const data = await response.json();
    console.log(data.userId);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow flex justify-center px-4 mt-[30vh] py-8">
          <div className="text-center">
            <h1 className="text-4xl font-semibold dark:text-white mb-4">
              FanStocks
            </h1>
            <div className="text-sm text-gray-700 dark:text-gray-300 font-mono">
              Welcome back, {user?.email}
            </div>
            <Button className="mt-2" onClick={handleTest}>
              Click me
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
