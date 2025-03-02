import axios from "axios";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import { IntegrationService, Integration, Stock } from "../_models/types";

export const getAllPublicMarkets = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/markets/public`, {
    withCredentials: true,
  });
  return response.data;
};

export const getStockPrices = async (stockId: string) => {
  const response = await axios.get(`${BACKEND_URL}/api/stocks/prices`, {
    params: { stock_id: stockId },
    withCredentials: true,
  });
  return response.data;
};

export const executeBuyOrder = async (stockId: string, shares: number) => {
  const response = await axios.get(`${BACKEND_URL}/api/stocks/buy`, {
    params: { stock_id: stockId, shares: shares },
    withCredentials: true,
  });
  return response.data;
};

export const executeSellOrder = async (stockId: string, shares: number) => {
  const response = await axios.get(`${BACKEND_URL}/api/stocks/sell`, {
    params: { stock_id: stockId, shares: shares },
    withCredentials: true,
  });
  return response.data;
};
