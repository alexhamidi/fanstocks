export interface Integration {
  service: IntegrationService;
  community: Community;
}

export interface UIntegration {
  service: IntegrationService | undefined;
  community: Community | undefined;
}

export interface Stock {
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

export interface ExploreMarket {
  stocks: Stock[];
  market_name: string;
  market_id: string;
  status: "none" | "owned" | "joined";
}

export interface DashboardMarket {
  market_name: string;
  market_id: string;
  free_currency: number
}


export interface SimpleStock {
  stock_id: string
  ticker: string
  shares: number
}


export interface StockMarket {
  market_name: string;
  market_id: string
  stocks: SimpleStock[]
  free_currency: number
}


export interface StockPrice {
  price: number;
  timestamp: string //iso8601
}

export interface StockPrices {
  prices: StockPrice[]

}
