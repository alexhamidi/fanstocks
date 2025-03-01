"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "../../../_components/ProtectedRoute";
import { useAuth } from "../../../_context/AuthContext";
import { useError } from "../../../_context/ErrorContext";
import { getStockMarket } from "../../../_api/markets";
import { getStockPrices } from "../../../_api/stocks";
import { ChevronLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { StockPrices, StockMarket, StockPrice, SimpleStock } from "../../../_models/types";
import { isAxiosError } from "axios";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type TimeRange = "1d" | "1w" | "1m" | "max";

export default function MarketView() {
  const { user } = useAuth();
  const { triggerError } = useError();
  const { marketId } = useParams();

  const [market, setMarket] = useState<StockMarket | null>(null);
  const [selectedStock, setSelectedStock] = useState<SimpleStock>();
  const [currentStockData, setCurrentStockData] = useState<StockPrices | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("max");

  const handleFetchStockData = useCallback(
    async (selectedStockId: string) => {
      try {
        const response = await getStockPrices(selectedStockId);
        setCurrentStockData(response.data.prices);
      } catch (err) {
        let errorMessage = "Error fetching stock data";
        if (isAxiosError(err)) {
          errorMessage = err.message;
        }
        triggerError(errorMessage);
      }
    },
    [triggerError]
  );

  useEffect(() => {
    if (selectedStock) {
      handleFetchStockData(selectedStock.stock_id);
    }
  }, [selectedStock, handleFetchStockData]);

  const handleFetchMarkets = useCallback(async () => {
    try {
      const response = await getStockMarket(marketId as string);
      setMarket(response.data.market);
    } catch (err) {
      let errorMessage = "Error fetching market";
      if (isAxiosError(err)) {
        errorMessage = err.message;
      }
      triggerError(errorMessage);
    }
  }, [marketId, triggerError]);

  useEffect(() => {
    handleFetchMarkets();
  }, [handleFetchMarkets]);

  const limitChartData = (data: StockPrice[]) => {
    const maxPoints = 500;
    if (data.length <= maxPoints) return data;
    const step = Math.floor(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
  };

  const getFilteredPrices = () => {
    if (!currentStockData?.prices?.length) return [];
    const now = new Date();
    const prices = currentStockData.prices;
    let filteredPrices: StockPrice[] = [];

    switch (timeRange) {
      case "1d":
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filteredPrices = prices.filter((item) => new Date(item.timestamp) >= oneDayAgo);
        break;
      case "1w":
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredPrices = prices.filter((item) => new Date(item.timestamp) >= oneWeekAgo);
        break;
      case "1m":
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredPrices = prices.filter((item) => new Date(item.timestamp) >= oneMonthAgo);
        break;
      case "max":
      default:
        filteredPrices = prices;
        break;
    }
    return limitChartData(filteredPrices);
  };

  const filteredPrices = getFilteredPrices();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case "1d":
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
      case "1w":
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      case "1m":
      case "max":
        return `${date.getMonth() + 1}/${date.getDate()}`;
      default:
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    }
  };

  const chartData = {
    labels: filteredPrices.map((item) => formatTime(item.timestamp)),
    datasets: [
      {
        data: filteredPrices.map((item) => item.price),
        fill: {
          target: "origin",
          above: "rgba(0, 130, 255, 0.2)",
        },
        borderColor: "rgb(0, 130, 255)",
        pointRadius: 0,
        borderWidth: 2,
        hitRadius: 5,
      },
    ],
  };

  const calculatePriceChange = () => {
    if (filteredPrices.length < 2) return { change: 0, percentage: 0 };
    const firstPrice = filteredPrices[0].price;
    const lastPrice = filteredPrices[filteredPrices.length - 1].price;
    const change = lastPrice - firstPrice;
    const percentage = (change / firstPrice) * 100;

    return {
      change: change.toFixed(2),
      percentage: percentage.toFixed(2),
    };
  };

  const priceChange = calculatePriceChange();

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 0,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.raw.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: false,
      },
    },
  };

  const currentPrice = currentStockData?.prices?.slice(-1)[0]?.price.toFixed(2) || "0";

  return (
    <ProtectedRoute>
      {market && (
        <div className="flex h-screen bg-gray-100">
          <div className="w-1/4 bg-white p-4 overflow-y-auto">

              <Button
                className="rounded-full text-black hover:bg-gray-100 bg-white border border-zinc-300 mr-3"
                onClick={() => (window.location.href = `/app/dashboard`)}
              >
                <ChevronLeft size={16} />
              </Button>
              <h2 className="text-lg font-semibold mb-4 flex flex-row items-center">Market: {market.market_name}</h2>
              <h2 className="text-lg font-semibold mb-4 flex flex-row items-center">${market.free_currency}</h2>

            <h2 className="text-lg font-semibold mb-4 flex flex-row items-center">Stocks</h2>

            {market.stocks.map((stock) => (
              <div
                key={stock.stock_id}
                className={`p-2 hover:bg-gray-200 cursor-pointer ${
                  selectedStock?.stock_id === stock.stock_id ? "bg-gray-300" : ""
                }`}
                onClick={() => setSelectedStock(stock)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">${stock.ticker}</span>
                  <span className="text-sm text-gray-600">{stock.shares} shares</span>
                </div>
              </div>
            ))}
          </div>

          {selectedStock && (
            <div className="flex-grow p-4">
              <h2 className="text-lg font-semibold mb-4">Stock Details</h2>
              <div className="bg-white p-6 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold">${selectedStock.ticker}</h3>
                    <p className="text-gray-700 mt-2">Current Price: ${currentPrice}</p>
                    <p
                      className={`mt-1 ${
                        Number(priceChange.change) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {Number(priceChange.change) >= 0 ? "+" : ""}
                      {priceChange.change} ({Number(priceChange.percentage) >= 0 ? "+" : ""}
                      {priceChange.percentage}%)
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant={timeRange === "1d" ? "default" : "outline"}
                      onClick={() => setTimeRange("1d")}
                      className="text-xs h-8"
                    >
                      1D
                    </Button>
                    <Button
                      variant={timeRange === "1w" ? "default" : "outline"}
                      onClick={() => setTimeRange("1w")}
                      className="text-xs h-8"
                    >
                      1W
                    </Button>
                    <Button
                      variant={timeRange === "1m" ? "default" : "outline"}
                      onClick={() => setTimeRange("1m")}
                      className="text-xs h-8"
                    >
                      1M
                    </Button>
                    <Button
                      variant={timeRange === "max" ? "default" : "outline"}
                      onClick={() => setTimeRange("max")}
                      className="text-xs h-8"
                    >
                      MAX
                    </Button>
                  </div>
                </div>

                {currentStockData && (
                  <div className="mt-8">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                )}
              </div>
              <h2 className="text-lg font-semibold m-4">Comments</h2>
            </div>
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}
