//====================================================//
// USER
//====================================================//
export interface ProfileData {
  id: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

export interface Credentials {
  email: string;
  password: string;
}

//====================================================//
// CREATE
//====================================================//
export interface Integration {
  service: IntegrationService;
  community: Community;
}

export interface UIntegration {
  service: IntegrationService | undefined;
  community: Community | undefined;
}

export interface CreateStock {
  ticker: string;
  names: string[];
}

export interface UStock {
  ticker: string | undefined;
  names: string[] | undefined;
}

export interface Community {
  name: string;
  id: string;
  followers: number;
  description: string;
}

export type IntegrationService = "reddit" | "twitch";

//====================================================//
// EXPLORE
//====================================================//
export interface ExploreMarket {
  market_name: string;
  id: string;
  status: "none" | "owned" | "joined";
}

//====================================================//
// DASHBOARD
//====================================================//
export interface DashboardMarket {
  market_name: string;
  market_id: string;
  free_currency: number;
}

//====================================================//
// MARKET
//====================================================//
export interface StockPrice {
  price: number;
  timestamp: string; //iso8601
}

export interface Comment {
  created_at: string;
  user_email: string;
  comment_id: string;
  message: string;
}

export interface Stock {
  stock_id: string;
  ticker: string;
  comments: Comment[];
  h_prices: StockPrice[];
  m_prices: StockPrice[];
  d_prices: StockPrice[];
  max_prices: StockPrice[];
  shares: number;
  price: number
}

export interface StockMarket {
  market_name: string;
  market_id: string;
  stocks: Stock[];
  free_currency: number;
}

export type TimeRange = "h" | "d" | "m" | "max";
export type TimeRangeKey = "h_prices" | "d_prices" | "m_prices" | "max_prices";

// sinngle
