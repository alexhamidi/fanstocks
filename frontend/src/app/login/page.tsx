"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "../_api/user";
import { useLoading } from "../_context/LoadingContext";
import { useAuth } from "../_context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessage } from "../_context/MessageContext";
import { requestWrapper } from "../_utils/api";

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { setUser } = useAuth();
  const router = useRouter();
  const { triggerError } = useMessage();
  const { setLoading } = useLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await requestWrapper(
      "Login Failed",
      triggerError,
      "",
      null,
      setLoading,
      { 401: "incorrect password", 404: "User not found" },
      loginUser,
      credentials,
    );
    if (!response) return;
    setUser(response.data.profile);
    const searchParams = new URLSearchParams(window.location.search);
    router.push(searchParams.get("redirect") || "/app/dashboard");
  };

  return (
    <main className="flex flex-col justify-center items-center flex-grow">
      <Card className="w-full sm:w-96 bg-white border border-gray-200">
        <CardHeader>
          <CardTitle className="pl-1 text-2xl">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-1">
              <Label htmlFor="email">Email</Label>
              <Input
                className="border-gray-200"
                id="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                required
              />
            </div>
            <div className="p-1">
              <Label htmlFor="password">Password</Label>
              <Input
                className="border-gray-200"
                id="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
              />
            </div>
            <div className="p-1">
              <Button type="submit" className="w-full">
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
