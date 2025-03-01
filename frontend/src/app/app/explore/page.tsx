"use client"
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "../../_components/ProtectedRoute";
import { getAllPublicMarkets, joinMarket } from "../../_api/markets";
import { ExploreMarket } from "../../_models/types"; // Make sure the path is correct
import { CircleCheck } from "lucide-react"
import { isAxiosError } from "axios"
import {useError} from "../../_context/ErrorContext"

export default function Explore() {
  const [markets, setMarkets] = useState<ExploreMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { triggerError } = useError();


  // Memoized fetch function to avoid recreation on every render
  const handleJoinMarket = async(marketId: string) => {
    try {

      await joinMarket(marketId);
      fetchMarkets()
    } catch (err) {
      let errorMessage = "Error creating market";
      if (isAxiosError(err)) {
        errorMessage = err.message;
      }
      triggerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getAllPublicMarkets();
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold">Explore Markets</h1>
            <Button
              onClick={fetchMarkets}
              disabled={isLoading}
              variant="ghost"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
          </div>

          {/* Markets display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              // Loading placeholder
              <div className="col-span-full text-center py-10">
                <p className="text-gray-500">Loading markets...</p>
              </div>
            ) : markets.length > 0 ? (
              // Market cards
              markets.map((market, index) => (
                <div key={market.market_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold truncate">{market.market_name}</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {market.stocks.length} stocks
                  </p>
                  {market.status === "owned" ? <Button
                    className="w-full"
                    variant="outline"
                    disabled={true}
                  >
                    <CircleCheck size={16}/>Owned
                  </Button> : market.status === "joined" ?  <Button
                    className="w-full"
                    variant="outline"
                    disabled={true}
                  >
                    <CircleCheck size={16}/>Joined
                  </Button> : <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleJoinMarket(market.market_id)}  // replace with id
                  >
                    Join Market
                  </Button>}
                </div>
              ))
            ) : (
              // No markets message
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-lg">No markets available. Check back later!</p>
              </div>
            )}
          </div>
          </div>
          </main>
    </ProtectedRoute>
  );
}
