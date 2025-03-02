"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProtectedRoute from "../../../_components/ProtectedRoute";
import { useLoading } from "../../../_context/LoadingContext";
import { useMessage } from "../../../_context/MessageContext";
import { getStockMarket, addNewComment } from "../../../_api/markets";
import { executeBuyOrder, executeSellOrder } from "../../../_api/stocks";
import {
  ChevronLeft,
  Send,
  Wallet,
  X,
  RotateCcw,
  DollarSign
} from "lucide-react";
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
import {
  StockMarket,
  Stock,
  TimeRange,
  TimeRangeKey,
} from "../../../_models/types";
import { requestWrapper } from "../../../_utils/api";
import {
  calculatePriceChange,
  getChartData,
  chartOptions,
  formatDate,
} from "../../../_utils/stockdata";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const timeRanges = ["h", "d", "m", "max"];

export default function MarketView() {
  const { triggerError, triggerSuccess } = useMessage();
  const { setLoading, isLoading } = useLoading();
  const { marketId } = useParams();

  const [market, setMarket] = useState<StockMarket | null>(null);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("max");
  const [buying, setBuying] = useState<boolean>(false);
  const [selling, setSelling] = useState<boolean>(false);
  const [sharesInput, setSharesInput] = useState<number | string>("");
  const [newComment, setNewComment] = useState<string>("");


  const priceChange = calculatePriceChange(selectedStock?.[(timeRange + "_prices") as TimeRangeKey] ?? [])

  useEffect(() => {
    const savedStock = localStorage.getItem("selectedStock");
    if (savedStock) {
      setSelectedStock(JSON.parse(savedStock));
    }
  }, []);

  useEffect(() => {
    if (selectedStock) {
      localStorage.setItem("selectedStock", JSON.stringify(selectedStock));
    }
  }, [selectedStock]);


  const handleFetchMarket = useCallback(async () => {
    const response = await requestWrapper(
      "Error fetching market",
      triggerError,
      "",
      null,
      setLoading,
      {},
      getStockMarket,
      marketId as string,
    );

    const newMarket = response.data.market;
    // console.log(newMarket.stocks[0].prices["max"])
    setMarket(newMarket);
    return newMarket; // Return the fetched market data
  }, [marketId]);

  useEffect(() => {
    handleFetchMarket();
  }, [handleFetchMarket]);


  useEffect(() => {
    handleFetchMarket();
  }, [handleFetchMarket]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !marketId) return;
    await requestWrapper(
      "Error posting comment",
      triggerError,
      "",
      null,
      null,
      {},
      addNewComment,
      marketId as string,
      newComment
    );
    await handleRefresh();
    setNewComment("");
  };

  const handleRefresh = async () => {
    const prevId = selectedStock?.stock_id;
    const newMarket: StockMarket = await handleFetchMarket(); // Wait for the fetch to complete
    // Find the updated stock from the newMarket data
    const updatedStock = newMarket.stocks.find(stock => stock.stock_id === prevId);
    setSelectedStock(updatedStock || null);
};

  const handleBuy = async () => {
    const numShares = Number(sharesInput);
    if (isNaN(numShares)) {
      triggerError("Invalid number");
    } else if (numShares <= 0) {
      triggerError("Must buy at least 1 share");
    } else if (market!.free_currency < selectedStock!.price * numShares) {
      triggerError("Not enough funds to complete the purchase.");
    } else {
      await requestWrapper(
        "Error executing buy order",
        triggerError,
        "Purchase successful",
        triggerSuccess,
        null,
        {},
        executeBuyOrder,
        selectedStock!.stock_id,
        numShares,
      );
    }
  };

  const handleSell = async () => {
    const numShares = Number(sharesInput);
    if (isNaN(numShares)) {
      triggerError("Invalid number");
    } else if (numShares <= 0) {
      triggerError("Must sell at least 1 share");
    } else if (selectedStock!.shares < numShares) {
      triggerError("Not enough shares to sell.");
    } else {
      await requestWrapper(
        "Error executing sell order",
        triggerError,
        "Sale successful",
        triggerSuccess,
        null,
        {},
        executeSellOrder,
        selectedStock!.stock_id,
        numShares,
      );
    }
  };


  return (
    <ProtectedRoute>
      {market && (
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-[20vw] border-r border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button
                size="sm"
                className="rounded-full w-10 h-10 p-0 bg-white border border-gray-200 hover:bg-green-50 text-slate-600"
                onClick={() => (window.location.href = `/app/dashboard`)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{market.market_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Wallet className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">${market.free_currency.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">
                    ${(market.stocks.reduce((acc, stock) => acc + stock.shares * stock.price, 0) + market.free_currency).toFixed(2)}
                  </span>
                  <span className="font-medium text-slate-700"></span>
                </div>
              </div>
            </div>

            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Your Holdings</h2>
            <div className="space-y-2">
              {market.stocks .sort((a, b) => a.ticker.localeCompare(b.ticker)).map((stock) => (
                <div
                  key={stock.stock_id}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedStock?.stock_id === stock.stock_id ? "border-2 border-gray-200" : "bg-white border-2 border-transparent"
                  }`}
                  onClick={() => setSelectedStock(stock)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">${stock.ticker}</h3>
                      <p className="text-sm text-slate-500">{stock.shares || 0} shares</p>
                      <p className="text-sm text-slate-500"></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedStock && (
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-start justify-between ">
                    <div className="flex flex-col space-y-2 p-4 rounded-lg bg-white">
                        <h1 className="text-4xl font-bold text-slate-800">{selectedStock.ticker}</h1>

                        <span className="text-3xl font-bold text-slate-800">${selectedStock.price.toFixed(2)}</span>

                        <span className={`font-bold ${Number(priceChange.change) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {priceChange.change}  &nbsp;| &nbsp;{priceChange.percentage}%
                        </span>

                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Value Invested: {selectedStock.shares ?? 0} x {selectedStock.price.toFixed(2)} = {(selectedStock.price * selectedStock.shares).toFixed(2)}
                        </div>
                      </div>

                  <div className="flex gap-2">
                    <Button  className=" bg-emerald-600 hover:bg-emerald-700" onClick={() => setBuying(true)}>
                       Buy
                    </Button>
                    <Button  variant="secondary" className=" bg-rose-600 hover:bg-rose-700  text-white" onClick={() => setSelling(true)}>
                       Sell
                    </Button>
                    <Button  className="text-white " onClick={handleRefresh}>
                     <RotateCcw/>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-6">
                  {timeRanges.map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "ghost"}
                      className={`rounded-full px-4 ${
                        timeRange === range
                          ? "text-white"
                          : "text-slate-600"
                      }`}
                      onClick={() => setTimeRange(range as TimeRange)}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
               <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-8">
                  <Line data={getChartData(selectedStock[(timeRange + "_prices") as TimeRangeKey], timeRange)} options={chartOptions} />
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-800 mb-6">Comments</h2>
                  <div className="space-y-6 mb-6">
                    {selectedStock.comments && selectedStock.comments.map((comment) => (
                      <div key={comment.comment_id} className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-800">{comment.user_email}</span>
                            <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-slate-600">{comment.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your analysis..."
                      className="p-4 border-slate-200 focus-visible:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handlePostComment();
                        }
                      }}
                    />
                    <Button  className="rounded p-4" onClick={handlePostComment} disabled={!newComment.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
           )}

          {(buying || selling) && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">{buying ? "Buy Shares" : "Sell Shares"}</h3>
                  <Button variant="ghost" size="sm" className="rounded-full text-slate-400 hover:bg-slate-100" onClick={() => { setBuying(false); setSelling(false); setSharesInput(""); }}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="space-y-6">
                  <Input
                    type="number"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(e.target.value)}
                    placeholder="Number of shares"
                    className=" text-lg   border-slate-200 focus-visible:ring-blue-500"
                  />
                  <Button
                    size="lg"
                    className="w-full  hover:bg-blue-700"
                    onClick={buying ? handleBuy : handleSell}
                    disabled={
                      Number(sharesInput) <= 0 ||
                      (buying && Number(selectedStock!.price) * Number(sharesInput) > market!.free_currency) ||
                      (selling && Number(sharesInput) > selectedStock!.shares)
                    }
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}
