"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "../../_components/ProtectedRoute";
import { useAuth } from "../../_context/AuthContext";
import {DashboardMarket} from "../../_models/types"
import {useError} from "../../_context/ErrorContext"
import { getAllJoinedMarkets } from "../../_api/markets"
import { isAxiosError } from "axios"
import { ChevronRight } from "lucide-react"

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [markets, setMarkets] = useState<DashboardMarket[]>([]);

  const { user } = useAuth();
  const { triggerError } = useError();
  //


  const fetchMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllJoinedMarkets();
      console.log(response)
      setMarkets(response.data.markets);
    } catch (err) {
      let errorMessage = "Error creating market";
      if (isAxiosError(err)) {
        errorMessage = err.message;
      }
      triggerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch markets on component mount
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return (
    <ProtectedRoute>
      <main className="flex flex-col items-center ">
        <div className="flex flex-col w-[60vw] p-4">
          {/* <h1 className="text-3xl font-semibold mb-2">Owned Markets</h1>
          <div>

          </div> */}
          <h1 className="text-3xl font-semibold mb-2">Joined Markets</h1>

          {isLoading ? (
              // Loading placeholder
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Loading markets...</p>
              </div>
            ) : markets.length > 0 ? (
              // Market cards
              markets.map((market, index) => (
                <div key={market.market_id} className="border rounded-lg p-4  flex items-center justify-between">
                   <p>{market.market_name} - ${market.free_currency} </p>

                   <Button className="rounded-full text-black hover:bg-gray-100 bg-white shadow-none border border-zinc-300 "
                        onClick={() => window.location.href = `/app/dashboard/${encodeURIComponent(market.market_id)}`}  // replace with id
                   >
                      <ChevronRight size={16}/>
                   </Button>
                </div>
              ))
            ) : (
              // No markets message
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-lg">No markets available. Check back later!</p>
              </div>
            )}

        </div>
      </main>
    </ProtectedRoute>
  );
}


// sidebar view for each market

// app/dashboard/market/kslgfneokrghergos
