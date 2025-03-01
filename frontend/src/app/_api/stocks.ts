import axios from "axios";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import {handleResponse} from "../_utils/api"
import {IntegrationService, Integration, Stock} from "../_models/types"


export const getAllPublicMarkets = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/markets/public`, {
    withCredentials: true,
  });
  return handleResponse(response);
};



export const getStockPrices = async (stockId: string) => {
    const response = await axios.get(`${BACKEND_URL}/api/stocks/prices`, {
        params: {stock_id: stockId},
        withCredentials: true,
    });
    return handleResponse(response);
};

