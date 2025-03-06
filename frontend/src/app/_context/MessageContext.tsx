"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, X } from "lucide-react";

type MessageContextType = {
  error: string | null;
  success: string | null;
  triggerError: (message: string) => void;
  triggerSuccess: (message: string) => void;
  clearMessage: () => void;
};

const MessageContext = createContext<MessageContextType>({
  error: null,
  success: null,
  triggerError: () => {},
  triggerSuccess: () => {},
  clearMessage: () => {},
});

export function MessageProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fade, setFade] = useState(false);

  const triggerError = (message: string) => {
    setError(message);
    setSuccess(null); // Clear success when an error is triggered
    setFade(false); // Reset fade effect
  };

  const triggerSuccess = (message: string) => {
    setSuccess(message);
    setError(null); // Clear error when a success message is triggered
    setFade(false); // Reset fade effect
  };

  const clearMessage = () => {
    setFade(true);
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 500); // Delay to allow fade-out animation
  };

  // Automatically clear the message (error or success) after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessage, 5000); // Clear after 5 seconds
      return () => clearTimeout(timer); // Clean up timer if message changes
    }
  }, [error, success]);

  return (
    <MessageContext.Provider
      value={{ error, success, triggerError, triggerSuccess, clearMessage }}
    >
      {children}
      {(error || success) && (
        <div className="fixed top-0 left-0 right-0 mt-2 mx-2 z-1000">
          {error && (
            <Alert
              variant="destructive"
              className="border-red-500 relative bg-red-50 dark:border-red-700 dark:bg-red-950 z-1000"
            >
              <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
              <AlertTitle className="text-red-500 dark:text-red-400">
                Error
              </AlertTitle>
              <AlertDescription className="text-red-500 dark:text-red-400">
                {error}
                <button className="left-0 p-1" onClick={clearMessage}>
                  <X size={24} className="absolute right-2 top-5 z-9999" />
                </button>
              </AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert
              variant="destructive"
              className="border-green-500 relative bg-green-50 dark:border-green-700 dark:bg-green-950 z-100"
            >
              <CheckCircle color="#22C55D" className="h-4 w-4 text-green-500 dark:text-green-400" />
              <AlertTitle  className="text-green-500 dark:text-green-400">
                Success
              </AlertTitle>
              <AlertDescription className="text-green-500 dark:text-green-400">
                {success}
                <button className="left-0 p-1" onClick={clearMessage}>
                  <X size={24} className="absolute right-2 top-5 z-9999" />
                </button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </MessageContext.Provider>
  );
}

export const useMessage = () => useContext(MessageContext);
