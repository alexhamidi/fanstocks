"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "../../_components/ProtectedRoute";
import { getAllPublicMarkets, joinMarket } from "../../_api/markets";
import { ExploreMarket } from "../../_models/types";
import { CircleCheck } from "lucide-react";
import { useMessage } from "../../_context/MessageContext";
import { useLoading } from "../../_context/LoadingContext";
import { requestWrapper } from "../../_utils/api";
export default function Explore() {
  const [markets, setMarkets] = useState<ExploreMarket[] | null>(null);
  const { triggerError } = useMessage();
  const { setLoading, isLoading } = useLoading();

  const fetchMarkets = useCallback(async () => {
    const response = await requestWrapper(
      "Error fetching markets",
      triggerError,
      "",
      null,
      setLoading,
      {},
      getAllPublicMarkets,
    );
    if (!response) return;
    setMarkets(response.data.markets);
  }, [setLoading, triggerError]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const handleJoinMarket = async (marketId: string) => {
    await requestWrapper(
      "Error joining market",
      triggerError,
      "",
      null,
      setLoading,
      {},
      joinMarket,
      marketId,
    );
    fetchMarkets()
  };

  return (
    <ProtectedRoute>
      <main className="flex flex-col items-center">
        <div className="flex flex-col w-[60vw] p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold">Explore Markets</h1>
          </div>

          {/* Markets display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {!isLoading &&
              markets &&
              (markets.length > 0 ? (
                markets.map((market, index) => (
                  <div
                    key={market.id}
                    className="border rounded-lg border-gray-200 p-4"
                  >
                    <h3 className="text-lg font-semibold truncate mb-2">
                      {market.market_name}
                    </h3>
                    {/* <p className="text-sm text-gray-500 mb-2">
                      stocks
                    </p> */}
                    {market.status === "owned" ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={true}
                      >
                        <CircleCheck size={16} />
                        Owned
                      </Button>
                    ) : market.status === "joined" ? (
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled={true}
                      >
                        <CircleCheck size={16} />
                        Joined
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleJoinMarket(market.id)} // replace with id
                      >
                        Join Market
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500 text-lg">
                    No markets available. Check back later!
                  </p>
                </div>
              ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
