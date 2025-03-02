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
import { logoutUser } from "../_api/user";
import { cn } from "@/lib/utils";
import { ChevronDown, LogOut, User } from "lucide-react";

export default function Header() {
  const { user, setUser, isAuthLoaded } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!isAuthLoaded) return null;

  const links = user
    ? [
        { href: "/app/explore", label: "Explore" },
        { href: "/app/dashboard", label: "Dashboard" },
        { href: "/app/create", label: "Create" },
        { href: "/app/about", label: "About" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/login", label: "Sign In" },
        { href: "/register", label: "Sign Up" },
      ];

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-0">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center h-16 gap-8">
          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const isActive =
                pathname === href ||
                (pathname.startsWith(href) && href === "/app/dashboard");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative px-4 py-2.5 text-sm font-medium text-gray-500 rounded-lg",
                    "hover:text-gray-900 hover:bg-gray-50",
                    isActive && "text-green-600 hover:text-green-600"
                  )}
                >
                  {label}
                  {isActive && (
                    <span className="absolute inset-x-1 -bottom-px h-0.5 bg-green-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          {user && (
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full gap-2 px-3 h-9 hover:bg-gray-100"
                  >
                    <span className="font-medium text-gray-900">
                      {user.email}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl shadow-lg border border-gray-100"
                >
                      <p className="text-sm font-medium text-gray-900 p-2">
                        {user.email}
                      </p>
                  <DropdownMenuItem
                    onSelect={handleLogout}
                    className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
