"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "../../_components/ProtectedRoute";
import { useAuth } from "../../_context/AuthContext";
import { DashboardMarket } from "../../_models/types";
import { useMessage } from "../../_context/MessageContext";
import { getAllJoinedMarkets } from "../../_api/markets";
import { isAxiosError } from "axios";
import { ChevronRight, Coins, Wallet } from "lucide-react";
import { useLoading } from "../../_context/LoadingContext";
import { requestWrapper } from "../../_utils/api";

export default function Dashboard() {
  const [markets, setMarkets] = useState<DashboardMarket[]>([]);

  const { setLoading, isLoading } = useLoading();
  const { triggerError } = useMessage();

  const fetchMarkets = useCallback(async () => {
    const response = await requestWrapper(
      "Error fetching markets",
      triggerError,
      "",
      null,
      setLoading,
      {},
      getAllJoinedMarkets,
    );
    if (!response) return;
    setMarkets(response.data.markets);
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return (
    <ProtectedRoute>
      <main className="flex flex-col items-center ">
        <div className="flex flex-col w-[60vw] p-4">
          <h1 className="text-3xl font-semibold mb-2">Joined Markets</h1>
          {!isLoading &&
            (markets.length > 0 ? (
              markets.map((market) => (
                <div
                  key={market.market_id}
                  className="group relative rounded-xl p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Coins size={24} className="text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold ">
                            {market.market_name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            Market ID: {market.market_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span className="text-xl font-bold ">
                          ${market.free_currency.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full w-10 h-10 p-0 border border-gray-200 hover:bg-green-50 text-gray-500 bg-white shadow-sm absolute top-4 right-4"
                      onClick={() =>
                        (window.location.href = `/app/dashboard/${encodeURIComponent(
                          market.market_id,
                        )}`)
                      }
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 text-lg">No markets available.</p>
              </div>
            ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}
