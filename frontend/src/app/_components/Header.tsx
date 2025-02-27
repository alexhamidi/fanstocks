"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../_context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { logoutUser } from "../_utils/api";

export default function Header() {
  const { user, setUser } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <header className="flex items-center p-4 h-16 border-b border-gray-200">
      {user ? (
        <div className="w-full flex justify-center flex-row gap-10">
          {[
            { href: "/app/explore", label: "Explore" },
            { href: "/app/dashboard", label: "Dashboard" },
            { href: "/app/create", label: "Create" },
            { href: "/app/", label: "About" },
          ].map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`${isActive ? "bg-zinc-200" : ""} p-1 px-2 rounded-lg`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      ) : null}
      <div className="flex items-center ml-auto">
        {user ? (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-lg overflow-hidden focus:outline-none">
                <img
                  src={user?.avatar_url || "/default-avatar.png"}
                  alt="Profile"
                  className="w-full h-full"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/app/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="ghost">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
