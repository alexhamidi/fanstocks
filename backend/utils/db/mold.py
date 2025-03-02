


# def get_joined_markets(user_id: str) -> List[DashboardMarket]:
#     joined_markets_data = supabase_client.table("joined_markets") \
#         .select("market_id, free_currency") \
#         .eq("user_id", user_id) \
#         .execute().data

#     if not joined_markets_data:
#         return []

#     joined_markets = []

#     for joined_market in joined_markets_data:
#         market_id = joined_market["market_id"]

#         market_data = supabase_client.table("markets").select("market_name").eq("id", market_id).execute().data

#         if not market_data:
#             continue

#         joined_markets.append(DashboardMarket(
#             market_id=market_id,
#             market_name=market_data[0]["market_name"],
#             free_currency=joined_market["free_currency"]
#         ))

#     return joined_markets





# def get_all_markets(user_id: str) -> List[ExploreMarket]:
#     markets_data = supabase_client.table("markets").select("id, market_name").execute().data

#     if not markets_data:
#         return []

#     owned_markets = supabase_client.table("owned_markets").select("market_id").eq("user_id", user_id).execute().data
#     owned_market_ids = set(
#         market["market_id"] for market in owned_markets
#     )

#     joined_markets = supabase_client.table("joined_markets").select("market_id").eq("user_id", user_id).execute().data
#     joined_market_ids = set(
#         market["market_id"] for market in joined_markets
#     )

#     markets = []
#     for market in markets_data:
#         markets.append(ExploreMarket(
#             market_id=market["id"],
#             market_name=market["market_name"],
#             status="owned" if market["id"] in owned_market_ids else "joined" if market["id"] in joined_market_ids else "none"
#         ))
#     return markets








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



# def get_stock_market(user_id: str, market_id: str) -> StockMarket:

#     market_data = supabase_client.table("markets").select("market_name").eq("id", market_id).execute().data
#     if not market_data:
#         raise HTTPException(status_code=404, detail="Market not found")

#     market_name = market_data[0]["market_name"]

#     free_currency_data = supabase_client.table("joined_markets") \
#         .select("free_currency") \
#         .eq("user_id", user_id) \
#         .eq("market_id", market_id) \
#         .execute().data

#     free_currency = free_currency_data[0]["free_currency"]

#     stock_data = supabase_client.table("stocks").select("id, ticker").eq("market_id", market_id).execute().data
#     if not stock_data:
#         raise HTTPException(status_code=404, detail="No stocks found for the given market")

#     stocks = []
#     for stock in stock_data:
#         stock_id = stock["id"]
#         stock_ticker = stock["ticker"]

#         user_shares_data= supabase_client.table("profiles_stocks") \
#             .select("shares") \
#             .eq("profile_id", user_id) \
#             .eq("stock_id", stock_id) \
#             .execute().data
#         user_shares = user_shares_data[0]["shares"]

#         prices_data = supabase_client.table("stock_prices") \
#             .select("price, timestamp") \
#             .eq("stock_id", stock_id) \
#             .order("timestamp", desc=True) \
#             .execute().data

#         prices = [
#             StockPrice(price=price_data["price"], timestamp=price_data["timestamp"])
#             for price_data in prices_data
#         ]

#         comments_query = supabase_client.table("comments") \
#             .select("created_at, user_id, id, message") \
#             .eq("market_id", market_id) \
#             .execute()

#         comments = []
#         for comment_data in comments_query.data:
#             user_email_query = supabase_client.table("profiles") \
#                 .select("email") \
#                 .eq("id", comment_data["user_id"]) \
#                 .execute()
#             user_email = user_email_query.data[0]["email"] if user_email_query.data else ""

#             comments.append(Comment(
#                 created_at=comment_data["created_at"],
#                 user_email=user_email,
#                 comment_id=comment_data["id"],
#                 message=comment_data["message"]
#             ))

#         stocks.append(Stock(
#             stock_id=stock_id,
#             ticker=stock_ticker,
#             comments=comments,
#             prices=prices,
#             shares=user_shares
#         ))

#     return StockMarket(
#         market_name=market_name,
#         market_id=market_id,
#         stocks=stocks,
#         free_currency=free_currency
#     )
