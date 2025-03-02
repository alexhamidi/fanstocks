"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type LoadingContextType = {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
      {isLoading && (
        <></>
        // <div className="fixed inset-0 flex items-center justify-center  z-50">
        //   <div className="bg-white p-4 rounded-md flex flex-col justify-center items-center">
        //     {/* <p>...</p> */}
        //   </div>
        // </div>
      )}
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);
