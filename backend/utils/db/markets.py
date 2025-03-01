import os
import supabase
from models.classes import Market, Stock, DisplayMarket, SimpleStock, StockMarket, StockPrice, StockPrices
from datetime import datetime, timedelta
from fastapi import HTTPException
from constants.constants import DEFAULT_STOCK_PRICE, INITIAL_CURRENCY
import numpy as np
import random

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PRIVATE_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)


def create(market_data: Market, user_id: str):
    try:
        market_response = supabase_client.table("markets").insert({
            "market_name": market_data.market_name,
        }).execute()

        if not market_response.data or len(market_response.data) == 0:
            raise Exception("Failed to create market")

        market_id = market_response.data[0]["id"]

        supabase_client.table("owned_markets").insert({
            "user_id": user_id,
            "market_id": market_id
        }).execute()

        for integration in market_data.integrations:
            supabase_client.table("integrations").insert({
                "market_id": market_id,
                "service": integration.service,
                "community_id": integration.community.id
            }).execute()

        for stock in market_data.stocks:
            stock_response = supabase_client.table("stocks").insert({
                "market_id": market_id,
                "ticker": stock.ticker,
                "names": stock.names,
                "price": DEFAULT_STOCK_PRICE  # Default price as specified
            }).execute()

    except Exception as e:
        # Rollback: Delete the main row in 'markets' to trigger cascading delete
        try:
            supabase_client.table("markets").delete().eq("id", market_id).execute()
        except Exception as rollback_error:
            pass  # Optionally log or handle any errors that occur during rollback
        raise e

def get_all(user_id: str):
    try:
        # Get all markets
        all_markets_response = supabase_client.table("markets").select("id, market_name").execute()

        if not all_markets_response.data:
            return []

        # Get markets owned by the user
        owned_markets_response = supabase_client.table("owned_markets").select("market_id").eq("user_id", user_id).execute()
        owned_market_ids = [market["market_id"] for market in owned_markets_response.data]

        # Get markets joined by the user
        joined_markets_response = supabase_client.table("joined_markets").select("market_id").eq("user_id", user_id).execute()
        joined_market_ids = [market["market_id"] for market in joined_markets_response.data]

        # Initialize result list
        markets = []

        # Process each market and add status
        for market in all_markets_response.data:
            market_id = market["id"]

            # # Fetch stocks for the current market
            stock_response = supabase_client.table("stocks").select("ticker, names").eq("market_id", market_id).execute()
            stocks = [Stock(ticker=stock["ticker"], names=stock["names"]) for stock in stock_response.data] if stock_response.data else []


            # Determine the status
            status = "none"
            if market_id in owned_market_ids:
                status = "owned"
            elif market_id in joined_market_ids:
                status = "joined"

            # Include the market_id and status in the MarketStocks object
            display_market = DisplayMarket(
                stocks=stocks,
                market_id=market_id,
                market_name=market["market_name"],
                status=status,
            )

            markets.append(display_market)

        return markets

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")


def get_joined(user_id: str):
    try:
        # Get markets joined by the user
        joined_markets_query = supabase_client.table("joined_markets") \
            .select("market_id, free_currency") \
            .eq("user_id", user_id) \
            .execute()

        if not joined_markets_query.data:
            return []

        # Get the market details for each joined market
        joined_market_list = []

        for joined_market in joined_markets_query.data:
            market_id = joined_market["market_id"]

            # Get market name from markets table
            market_query = supabase_client.table("markets") \
                .select("market_name") \
                .eq("id", market_id) \
                .execute()

            if market_query.data:
                joined_market_list.append({
                    "market_id": market_id,
                    "market_name": market_query.data[0]["market_name"],
                    "free_currency": joined_market["free_currency"]
                })

        return joined_market_list

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")




def user_join(user_id: str, market_id: str):
    try:
        # First, check if the user already owns this market
        owned_check = supabase_client.table("owned_markets").select("*").eq("user_id", user_id).eq("market_id", market_id).execute()

        if owned_check.data:
            # User already owns this market
            raise HTTPException(status_code=400, detail="User already owns this market")

        # Then check if the user has already joined this market
        joined_check = supabase_client.table("joined_markets").select("*").eq("user_id", user_id).eq("market_id", market_id).execute()

        if joined_check.data:
            # User already joined this market
            raise HTTPException(status_code=400, detail="User already joined this market")

        # User hasn't joined or owned the market, so add to joined_markets
        response = supabase_client.table("joined_markets").insert({
            "user_id": user_id,
            "market_id": market_id,
            "free_currency": INITIAL_CURRENCY
        }).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to join market")

        return True

    except HTTPException:
        # Re-raise HTTP exceptions to maintain their status codes
        raise
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

def get_stock_market(user_id: str, market_id: str):
    try:
        # Fetch market name
        market_query = supabase_client.table("markets").select("market_name").eq("id", market_id).execute()
        if not market_query.data:
            raise HTTPException(status_code=404, detail="Market not found")

        market_name = market_query.data[0]["market_name"]

        # Fetch user's free currency from joined_markets
        free_currency_query = supabase_client.table("joined_markets").select("free_currency") \
            .eq("user_id", user_id).eq("market_id", market_id).execute()

        free_currency = free_currency_query.data[0]["free_currency"] if free_currency_query.data else 0  # Default to 0

        # Fetch stocks in the market
        stock_query = supabase_client.table("stocks").select("id, ticker").eq("market_id", market_id).execute()
        if not stock_query.data:
            raise HTTPException(status_code=404, detail="No stocks found for the given market")

        stocks = []

        for stock in stock_query.data:
            stock_id = stock["id"]
            stock_ticker = stock["ticker"]

            # Fetch user's shares for this stock
            user_shares_query = supabase_client.table("profiles_stocks").select("shares") \
                .eq("profile_id", user_id).eq("stock_id", stock_id).execute()

            user_shares = user_shares_query.data[0]["shares"] if user_shares_query.data else 0  # Default to 0

            stocks.append(SimpleStock(stock_id=stock_id, ticker=stock_ticker, shares=user_shares))


        return StockMarket(market_name=market_name, market_id=market_id, stocks=stocks, free_currency=free_currency)


    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")






def get_stock_prices(stock_id: str):
    try:
        # Step 1: Verify the stock exists
        stock_query = supabase_client.table("stocks").select("id").eq("id", stock_id).execute()
        if not stock_query.data:
            raise HTTPException(status_code=404, detail="Stock not found")

        # Step 2: Fetch the actual stock prices from the stock_prices table
        prices_query = supabase_client.table("stock_prices") \
            .select("price, timestamp") \
            .eq("stock_id", stock_id) \
            .order("timestamp", desc=False) \
            .execute()

        if not prices_query.data:
            return StockPrices(prices=[])  # Return empty list if no price data found

        # Step 3: Format the data as StockPrice objects
        prices = []
        for price_data in prices_query.data:
            # Parse the timestamp string to a datetime object
            timestamp = datetime.fromisoformat(price_data["timestamp"].replace("Z", "+00:00"))
            # Create a StockPrice object
            stock_price = StockPrice(
                price=float(price_data["price"]),
                timestamp=timestamp
            )
            prices.append(stock_price)

        # Step 4: Return the stock prices
        return StockPrices(prices=prices)

    except Exception as e:
        print(f"Error fetching stock prices: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")




# def get_stock_prices(stock_id: str):
#     try:
#         # Step 1: Get the created_at timestamp of the market associated with the stock
#         market_query = supabase_client.table("stocks").select("market_id").eq("id", stock_id).execute()
#         if not market_query.data:
#             raise HTTPException(status_code=404, detail="Stock not found")

#         market_id = market_query.data[0]["market_id"]
#         market_details_query = supabase_client.table("markets").select("created_at").eq("id", market_id).execute()
#         if not market_details_query.data:
#             raise HTTPException(status_code=404, detail="Market not found")

#         # Convert created_at string to datetime object (naive datetime)
#         created_at = market_details_query.data[0]["created_at"]
#         created_at = datetime.fromisoformat(created_at).replace(tzinfo=None)  # Ensure naive datetime

#         # Step 2: Calculate the number of minutes between created_at and now
#         now = datetime.now().replace(tzinfo=None)  # Ensure naive datetime
#         time_diff = now - created_at
#         num_data_points = int(time_diff.total_seconds() // 60)

#         # Step 3: Generate synthetic stock price data
#         initial_price = random.uniform(100, 500)
#         prices = []

#         # Generate stock price fluctuations using a random walk
#         current_price = initial_price
#         for minute in range(num_data_points):
#             # Simulate a small price change
#             price_change = random.uniform(-2, 2)  # Price changes between -2 and +2
#             current_price = max(0, current_price + price_change)  # Ensure price doesn't go negative
#             timestamp = created_at + timedelta(minutes=minute)
#             prices.append(StockPrice(price=round(current_price, 2), timestamp=timestamp))

#         # Step 4: Return the generated stock prices
#         return StockPrices(prices=prices)

#     except Exception as e:
#         print(e)
#         raise HTTPException(status_code=500, detail="Internal server error")
