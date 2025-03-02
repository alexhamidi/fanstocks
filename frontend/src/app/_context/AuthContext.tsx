"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileData } from "../_models/types";
import { getCurrentUser } from "../_api/user";

type AuthContextType = {
  user: ProfileData | null;
  isAuthLoaded: boolean;
  setUser: (user: ProfileData | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthLoaded: false,
  setUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ProfileData | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
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
        setIsAuthLoaded(true);
      }
    };

    fetchUser();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isAuthLoaded, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
