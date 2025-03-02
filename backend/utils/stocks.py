import os
import asyncio
import random
import math
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from supabase import acreate_client  # async client
from pydantic import BaseModel
from collections import defaultdict
# Load your Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PRIVATE_KEY")
MU = 0.00
SIGMA = 0.0005

MU_ATTRITION = 0.5
SIGMA_ATTRITION = 0.5

class StockData(BaseModel):
    w: float = 0.0


stock_data = defaultdict(StockData)

supabase_client = None

async def init_client():
    global supabase_client
    supabase_client = await acreate_client(SUPABASE_URL, SUPABASE_KEY)

async def update_stock_prices():
    try:
        # Fetch all stocks from the 'stocks' table
        response = await supabase_client.table('stocks').select('*').execute()
        stocks = response.data
        if not stocks:
            print("No stocks found in database")
            return

        current_time = datetime.now().isoformat()
        print(f"Updating prices for {len(stocks)} stocks at {current_time}")

        # Prepare asynchronous RPC calls for all stocks
        tasks = []
        for stock in stocks:


            mu_weight = 0#redis.mu.get(stock["id"])
            sigma_weight = 0#redis.sigma.get(stock["id"])

            mu = MU + mu_weight
            sigma = SIGMA + sigma_weight

            updated_mu_weight = mu_weight * MU_ATTRITION
            updated_vol_weight = sigma_weight * SIGMA_ATTRITION



            epsilon = random.gauss()


            last_price = float(stock.get("price", 0))
            new_price = last_price * math.exp(mu - (1/2)*(sigma**2) + sigma * epsilon)

            final_new_price = max(0, new_price)


            print(f"Adding new price {final_new_price} for stock {stock['id']}")

            payload = {
                "p_stock_id": stock["id"],
                "p_new_price": final_new_price,
                "p_ts": current_time
            }
            # Use the RPC method to both insert and update in one call
            tasks.append(supabase_client.rpc("update_stock_price", payload).execute())

        # Execute all RPC calls concurrently on the same event loop
        results = await asyncio.gather(*tasks, return_exceptions=True)
        print("Price update completed successfully")
    except Exception as e:
        print(f"Error updating stock prices: {str(e)}")

async def main():
    await init_client()

    scheduler = AsyncIOScheduler()
    # Schedule the job to run every second
    scheduler.add_job(update_stock_prices, 'interval', seconds=1, id="update_stock_prices", replace_existing=True)
    scheduler.start()
    print("Stock price update scheduler started successfully")

    # Keep the main coroutine alive.
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
