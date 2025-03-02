// src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "../_api/user";
import { useAuth } from "../_context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMessage } from "../_context/MessageContext";
import { isAxiosError } from "axios";

export default function Register() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { setUser } = useAuth();
  const router = useRouter();

  const { triggerError } = useMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.password.length < 6) {
      triggerError("Password must have at least 6 characters");
      return;
    }
    try {
      const { data } = await registerUser(credentials);
      setUser(data.profile);
      const searchParams = new URLSearchParams(window.location.search);
      router.push(searchParams.get("redirect") || "/app/dashboard");
    } catch (err) {
      let errorMessage = "Register Failed";
      console.log(typeof err);
      if (isAxiosError(err) && err.status === 409) {
        errorMessage = "User already exists with this email";
      }
      triggerError(errorMessage);
    }
  };

  return (
    <main className="flex flex-col items-center ">
      <Card className="w-full sm:w-96 bg-white dark:bg-zinc-800 mt-[20vh] dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="pl-1 text-2xl dark:text-white">
            Register
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-1">
              <Label htmlFor="email" className="dark:text-white">
                Email
              </Label>
              <Input
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
              <Label htmlFor="password" className="dark:text-white">
                Password
              </Label>
              <Input
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
                Register
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
