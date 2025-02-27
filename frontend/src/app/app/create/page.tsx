"use client";

import {
  Integration,
  IntegrationService,
  UIntegration,
  Stock,
  UStock,
  Community,
} from "../../_models/types";
import { uIntegration, uStock } from "../../_constants/constants";
import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import axios from "axios";
import { X } from "lucide-react";
import ProtectedRoute from "../../_components/ProtectedRoute";
import { useError } from "../../_context/ErrorContext";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Create() {
  const [marketName, setMarketName] = useState<string>("");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [newIntegration, setNewIntegration] = useState<UIntegration | null>(
    null,
  );
  const [searchResults, setSearchResults] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { triggerError } = useError();

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const full_url = `${BACKEND_URL}/api/${newIntegration!.service === "reddit" ? "reddit/subreddit_search" : "twitch/channel_search"}`;
      const response = await axios.post(full_url, null, {
        params: { term: searchTerm },
        withCredentials: true, // Add this line
      });
      const communities: Community[] = response.data.data;
      setSearchResults(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      setSearchResults([]);
    }
  };

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

  const handleAddIntegration = () => {
    if (
      !newIntegration ||
      !newIntegration.community ||
      !newIntegration.service
    ) {
      return;
    }
    setIntegrations([...integrations, newIntegration as Integration]);
    setNewIntegration(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleDeleteIntegration = (index: number) => {
    const updatedIntegrations = integrations.filter((_, idx) => idx !== index);
    setIntegrations(updatedIntegrations);
  };

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [newStock, setNewStock] = useState<UStock | null>(null);
  const [newName, setNewName] = useState<string | null>(null);

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewStock((prev) => ({
      ...prev!,
      ticker: e.target.value,
    }));
  };

  const handleAddName = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newStock || !newName?.trim()) {
      return;
    }
    setNewStock((prev) => ({
      ...prev!,
      names: prev?.names ? [...prev.names, newName] : [newName],
    }));
    setNewName(null);
  };

  const handleAddStock = () => {
    if (!newStock || !newStock.ticker || !newStock.names) {
      return;
    }
    setStocks([...stocks, newStock as Stock]);
    setNewStock(null);
  };

  const handleDeleteStock = (index: number) => {
    const updatedStocks = stocks.filter((_, idx) => idx !== index);
    setStocks(updatedStocks);
  };

  const handleDeleteName = (index: number) => {
    if (!newStock || !newStock.names) return;
    const updatedNames = newStock.names.filter((_, idx) => idx !== index);
    setNewStock((prev) => ({
      ...prev!,
      names: updatedNames,
    }));
  };

  // disabled = {marketName === "" || integrations.length === 0 || stocks.length === 0}

  const handleCreateMarket = () => {
    if (marketName === "") {
      triggerError("Must provide a name");
      return;
    } else if (integrations.length === 0) {
      triggerError("Must provide at least one integration");
      return;
    } else if (stocks.length === 0) {
      triggerError("Must provide at least one stock");
      return;
    }
    console.log(marketName, integrations, stocks);
  };

  return (
    <ProtectedRoute>
      <main className="flex flex-col items-center ">
        <div className="flex flex-col w-[60vw] p-4">
          <h1 className="text-3xl font-semibold mb-2">Create a new market</h1>
          <div className="text-sm text-gray-700 font-mono">
            markets are Lorem Ipsum is simply dummy text of the printing and
            typesetting industry. Lorem Ipsum has been the industry's standard
            dummy text ever since the 1500s, when an unknown printer
          </div>
          <hr className="mt-2 mb-2 border-zinc-400"></hr>
          <div className="my-4">
            <h3 className="text-xl font-semibold  mb-1">Market Name</h3>
            <input
              type="text"
              className="border border-zinc-400 rounded w-[100%] p-1"
              onChange={(e) => setMarketName(e.target.value)}
            />
          </div>

          <div className="my-4">
            <h3 className="text-xl font-semibold  mb-2">Integrations</h3>
            <div className="w-full ">
              <div className="grid grid-cols-2 text-gray-700 font-mono p-2 border-b border-zinc-400">
                <span>service</span>
                <span>community</span>
              </div>
              {integrations.map((integration, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 relative p-2 border-b border-zinc-400"
                >
                  <span>{integration.service}</span>
                  <span>{integration.community.name}</span>
                  <button
                    onClick={() => handleDeleteIntegration(index)}
                    className="absolute right-3 top-3"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {newIntegration ? (
              <div className="flex flex-col rounded mt-1 border border-zinc-400 ">
                <h4 className="text-lg font-semibold  text-center mb-2">
                  New Integration
                </h4>
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
                          className="border border-zinc-400 rounded w-[100%] p-1"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </form>
                      {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-300 rounded shadow-lg">
                          {searchResults.map((community) => (
                            <div
                              key={community.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                              onClick={() => handleSelectCommunity(community)}
                            >
                              <div className="flex-1">
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
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-end m-2">
                  <button
                    className="  p-1 px-3 rounded"
                    onClick={handleAddIntegration}
                    disabled={
                      !newIntegration.service || !newIntegration.community
                    }
                  >
                    Add
                  </button>
                  <button
                    className="p-1 px-3 rounded"
                    onClick={() => setNewIntegration(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="mt-2 "
                onClick={() => setNewIntegration(uIntegration)}
              >
                + Add Integration
              </button>
            )}
          </div>

          <div className="my-4">
            <h3 className="text-xl font-semibold  mb-2">Stocks</h3>
            <div className="w-full ">
              <div className="grid grid-cols-2 text-gray-700 font-mono p-2 border-b border-zinc-400">
                <span>ticker</span>
                <span>names</span>
              </div>
              {stocks.map((stock, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 relative p-2 border-b border-zinc-400"
                >
                  <span>${stock.ticker.toUpperCase()}</span>
                  <span>{stock.names?.join(", ")}</span>
                  <button
                    onClick={() => handleDeleteIntegration(index)}
                    className="absolute right-3 top-3"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {newStock ? (
              <div className="flex flex-col rounded mt-1 border border-zinc-400 ">
                <h4 className="text-lg font-semibold  text-center mb-2">
                  New Stock
                </h4>

                <div className="m-2">
                  <h5 className="font-semibold mb-1">Ticker</h5>
                  <form>
                    <input
                      type="text"
                      className="border border-zinc-400 rounded w-[100%] p-1"
                      value={newStock.ticker}
                      onChange={handleTickerChange}
                    />
                  </form>
                </div>

                <div className="m-2">
                  <h5 className="font-semibold mb-1">Names</h5>
                  <form onSubmit={handleAddName}>
                    <input
                      type="text"
                      className="border border-zinc-400 rounded w-[100%] p-1"
                      value={newName || ""}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </form>
                  <div className="flex flex-row">
                    {newStock.names &&
                      newStock.names.map((name, idx) => (
                        <div
                          className="py-1 px-2 bg-zinc-200 rounded mr-2 flex"
                          key={idx}
                        >
                          <span className="mr-1">{name}</span>
                          <button onClick={() => handleDeleteName(idx)}>
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex justify-end m-2">
                  <button
                    className="  p-1 px-3 rounded"
                    onClick={handleAddStock}
                    disabled={!newStock.ticker || !newStock.names}
                  >
                    Add
                  </button>
                  <button
                    className="p-1 px-3 rounded"
                    onClick={() => setNewStock(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="mt-2 " onClick={() => setNewStock(uStock)}>
                + Add Stock
              </button>
            )}
          </div>

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
