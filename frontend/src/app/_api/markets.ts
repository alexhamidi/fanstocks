import axios from "axios";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import { IntegrationService, Integration, Stock } from "../_models/types";

export const getAllPublicMarkets = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/markets`, {
    withCredentials: true,
  });
  console.log(response.data);
  return response.data;
};

export const getAllJoinedMarkets = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/markets/joined`, {
    withCredentials: true,
  });
  return response.data;
};

export const createMarket = async (
  marketName: string,
  integrations: Integration[],
  stocks: Stock[],
) => {
  const full_url = `${BACKEND_URL}/api/markets/create`;
  const requestData = {
    market_name: marketName,
    integrations: integrations,
    stocks: stocks,
  };
  const response = await axios.post(full_url, requestData, {
    withCredentials: true, // Add this line
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.data;
};

export const joinMarket = async (marketId: string) => {
  const full_url = `${BACKEND_URL}/api/markets/join`;

  const response = await axios.post(full_url, null, {
    params: { market_id: marketId },
    withCredentials: true,
  });

  return response.data;
};

export const getStockMarket = async (marketId: string) => {
  const full_url = `${BACKEND_URL}/api/markets/stockmarket`;

  const response = await axios.get(full_url, {
    params: { market_id: marketId },
    withCredentials: true,
  });

  return response.data;
};

export const addNewComment = async (marketId: string, message: string) => {
  const full_url = `${BACKEND_URL}/api/markets/comment`;

  const response = await axios.post(full_url, null, {
    params: { market_id: marketId, message: message },
    withCredentials: true,
  });

  return response.data;
};
