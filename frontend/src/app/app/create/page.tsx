"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ProtectedRoute from "../../_components/ProtectedRoute";
import { useMessage } from "../../_context/MessageContext";
import { useLoading } from "../../_context/LoadingContext";
import { createMarket } from "../../_api/markets";
import { searchCommunity } from "../../_api/community";
import { requestWrapper } from "../../_utils/api";
import {
  Integration,
  IntegrationService,
  UIntegration,
  CreateStock,
  UStock,
  Community,
} from "../../_models/types";
import { uIntegration, uStock } from "../../_constants/constants";
import MarketComponent from "../../_components/MarketComponent";

export default function Create() {
  // Market state
  const [marketName, setMarketName] = useState("");

  // Integration state
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [newIntegration, setNewIntegration] = useState<UIntegration | null>(
    null,
  );
  const [searchResults, setSearchResults] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Stock state
  const [stocks, setStocks] = useState<CreateStock[]>([]);
  const [newStock, setNewStock] = useState<UStock | null>(null);
  const [newName, setNewName] = useState<string | null>(null);

  // Context hooks
  const { triggerError, triggerSuccess } = useMessage();
  const { setLoading } = useLoading();

  // ========================================
  // INTEGRATIONS
  // ========================================
  const handleSelectService = (value: string) => {
    setNewIntegration({
      community: undefined,
      service: value as IntegrationService,
    });
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSelectCommunity = (community: Community) => {
    setNewIntegration((prev) => ({
      ...prev!,
      community: community,
    }));
    setSearchTerm(community.name);
    setSearchResults([]);
  };

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const response = await requestWrapper(
      "Error searching",
      triggerError,
      "",
      null,
      setLoading,
      {},
      searchCommunity,
      searchTerm,
      newIntegration!.service!,
    );
    setSearchResults(response.data.communities);
  };

  const handleAddIntegration = () => {
    if (!newIntegration?.community || !newIntegration?.service) return;

    setIntegrations([...integrations, newIntegration as Integration]);
    setNewIntegration(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleDeleteIntegration = (index: number) => {
    setIntegrations(integrations.filter((_, idx) => idx !== index));
  };

  // ========================================
  // STOCKS
  // ========================================

  // Stock handlers
  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStock((prev) => ({
      ...prev!,
      ticker: e.target.value,
    }));
  };

  const handleAddName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newStock || !newName?.trim()) return;

    setNewStock((prev) => ({
      ...prev!,
      names: prev?.names ? [...prev.names, newName] : [newName],
    }));
    setNewName(null);
  };

  const handleAddStock = () => {
    if (!newStock?.ticker || !newStock?.names) return;

    setStocks([...stocks, newStock as CreateStock]);
    setNewStock(null);
  };

  const handleDeleteStock = (index: number) => {
    setStocks(stocks.filter((_, idx) => idx !== index));
  };

  const handleDeleteName = (index: number) => {
    if (!newStock?.names) return;

    const updatedNames = newStock.names.filter((_, idx) => idx !== index);
    setNewStock((prev) => ({
      ...prev!,
      names: updatedNames,
    }));
  };

  // Form submission
  const handleCreateMarket = async () => {
    if (marketName === "") {
      triggerError("Must provide a name");
    } else if (integrations.length === 0) {
      triggerError("Must provide at least one integration");
    } else if (stocks.length === 0) {
      triggerError("Must provide at least one stock");
    } else {
      await requestWrapper(
        "Error creating market",
        triggerError,
        "Market Created succesfully",
        triggerSuccess,
        setLoading,
        {},
        createMarket,
        marketName,
        integrations,
        stocks,
      );
    }
    triggerSuccess("Market Created succesfully")
  };

  return (
    <ProtectedRoute>
      <main className="flex flex-col items-center">
        <div className="flex flex-col w-[60vw] p-4">
          <h1 className="text-3xl font-semibold mb-2">Create a new market</h1>
          <hr className="mt-2 mb-2 border-zinc-400" />

          {/* Market Name Section */}
          <div className="my-4">
            <h3 className="text-xl font-semibold mb-1">Market Name</h3>
            <input
              type="text"
              className="border border-zinc-400 rounded w-full p-1"
              onChange={(e) => setMarketName(e.target.value)}
            />
          </div>

          <MarketComponent
            title="Integrations"
            items={integrations}
            newItem={newIntegration}
            deleteItemFunction={handleDeleteIntegration}
            addNewFunction={handleAddIntegration}
            setNewFunction={setNewIntegration}
            defaultItem={uIntegration}
            itemColumns={[
              { key: "service", label: "service" },
              {
                key: "community",
                label: "community",
                render: (item) => item.community.name,
              },
            ]}
            NewComponents={
              <>
                {newIntegration && (
                  <>
                    <div className="m-2">
                      <h5 className="font-semibold mb-1">Service</h5>
                      <Select
                        value={newIntegration.service}
                        onValueChange={handleSelectService}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reddit">reddit</SelectItem>
                          <SelectItem value="twitch">twitch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Community Search */}
                    {newIntegration.service && (
                      <div className="m-2">
                        <h5 className="font-semibold mb-1">
                          {newIntegration.service === "reddit"
                            ? "Subreddit"
                            : "Streamer"}
                        </h5>
                        <div className="relative">
                          <form onSubmit={handleSearchSubmit}>
                            <input
                              type="text"
                              className="border border-zinc-400 rounded w-full p-1"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </form>

                          {/* Search Results */}
                          {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-400 rounded shadow-lg">
                              {searchResults.map((community) => (
                                <div
                                  key={community.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() =>
                                    handleSelectCommunity(community)
                                  }
                                >
                                  <div className="font-semibold">
                                    {community.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {community.description}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {community.followers} followers
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            }
          />

          {/* Stocks Section */}
          <MarketComponent
            title="Stocks"
            items={stocks}
            newItem={newStock}
            deleteItemFunction={handleDeleteStock}
            addNewFunction={handleAddStock}
            setNewFunction={setNewStock}
            defaultItem={uStock}
            itemColumns={[
              {
                key: "ticker",
                label: "ticker",
                render: (item) => `$${item.ticker}`,
              },
              {
                key: "names",
                label: "names",
                render: (item) => item.names?.join(", "),
              },
            ]}
            NewComponents={
              <>
                {newStock && (
                  <>
                    {/* Ticker Input */}
                    <div className="m-2">
                      <h5 className="font-semibold mb-1">Ticker</h5>
                      <input
                        type="text"
                        className="border border-zinc-400 rounded w-full p-1"
                        value={newStock.ticker || ""}
                        onChange={handleTickerChange}
                      />
                    </div>

                    {/* Names Input */}
                    <div className="m-2">
                      <h5 className="font-semibold mb-1">Names</h5>
                      <form onSubmit={handleAddName}>
                        <input
                          type="text"
                          className="border border-zinc-400 rounded w-full p-1"
                          value={newName || ""}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                      </form>

                      {/* Added Names */}
                      <div className="flex flex-wrap mt-2">
                        {newStock.names?.map((name, idx) => (
                          <div
                            className="py-1 px-2 bg-zinc-200 rounded mr-2 mb-1 flex"
                            key={idx}
                          >
                            <span>{name}</span>
                            <button
                              className="ml-1"
                              onClick={() => handleDeleteName(idx)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            }
          />

          {/* Create Button */}
          <div className="my-4">
            <button
              className="bg-green-500 text-white p-1 px-2 rounded"
              onClick={handleCreateMarket}
            >
              Create
            </button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
