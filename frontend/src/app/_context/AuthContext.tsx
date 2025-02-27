"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { ProfileData } from "../_models/types";
import { getCurrentUser } from "../_utils/api";

type AuthContextType = {
  user: ProfileData | null;
  isLoading: boolean;
  setUser: (user: ProfileData | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await getCurrentUser();
        setUser(data.profile);
        if (
          window.location.pathname === "/login" ||
          window.location.pathname === "/register"
        ) {
          router.push("/app/dashboard");
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
