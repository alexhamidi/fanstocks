import axios from "axios";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import { IntegrationService, Integration, Stock } from "../_models/types";

export const searchCommunity = async (
  searchTerm: string,
  newService: IntegrationService,
) => {
  const full_url = `${BACKEND_URL}/api/${newService === "reddit" ? "reddit/subreddit_search" : "twitch/channel_search"}`;
  const response = await axios.post(full_url, null, {
    params: { term: searchTerm },
    withCredentials: true, // Add this line
  });
  return response.data;
};
