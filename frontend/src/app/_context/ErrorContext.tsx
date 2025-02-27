"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";

type ErrorContextType = {
  error: string | null;
  triggerError: (message: string) => void;
  clearError: () => void;
};

const ErrorContext = createContext<ErrorContextType>({
  error: null,
  triggerError: () => {},
  clearError: () => {},
});

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [fade, setFade] = useState(false);

  const triggerError = (message: string) => {
    setError(message);
    setFade(false); // Reset fade effect
  };

  const clearError = () => {
    setFade(true);
    setTimeout(() => {
      setError(null);
    }, 500); // Delay to allow fade-out animation
  };

  // Automatically clear the error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000); // Clear error after 5 seconds
      return () => clearTimeout(timer); // Clean up timer if error changes
    }
  }, [error]);

  return (
    <ErrorContext.Provider value={{ error, triggerError, clearError }}>
      {children}
      {error && (
        <div className="fixed top-0 left-0 right-0 mt-2 mx-2 z-1000">
          <Alert
            variant="destructive"
            className="border-red-500 relative bg-red-50 dark:border-red-700 dark:bg-red-950"
          >
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <AlertTitle className="text-red-500 dark:text-red-400">
              Error
            </AlertTitle>
            <AlertDescription className="text-red-500 dark:text-red-400">
              {error}
              <button className="left-0 p-1" onClick={clearError}>
                <X size={24} className="absolute right-2 top-5 z-9999" />
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export const useError = () => useContext(ErrorContext);
