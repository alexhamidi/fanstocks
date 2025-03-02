import os
import asyncio
import random
import math
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from supabase import acreate_client  # async client

# Load your Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PRIVATE_KEY")

# Redis connection details
# Default parameters
MU = 0.00
SIGMA = 0.001

MU_ATTRITION = 0.2
SIGMA_ATTRITION = 0.2

MU_ACTIVITY_WEIGHT = 6
SIGMA_ACTIVITY_WEIGHT = 6

supabase_client = None

async def init_client():
    global supabase_client
    supabase_client = await acreate_client(SUPABASE_URL, SUPABASE_KEY)

async def update_stock_prices():
    try:

        # Fetch all stocks from the 'stocks' table
        response = await supabase_client.table('stocks').select('*').execute()
        stocks = response.data

        # Fetch all stock parameters from the 'stocks_params' table
        params_response = await supabase_client.table('stocks_params').select('*').execute()
        stock_params = {param['stock_id']: param for param in params_response.data}

        if not stocks:
            print("No stocks found in database")
            return

        current_time = datetime.now().isoformat()
        print(f"Updating prices for {len(stocks)} stocks at {current_time}")

        # Prepare asynchronous RPC calls for all stocks
        tasks = []
        for stock in stocks:
            stock_id = stock["id"]

            # Get custom parameters for this stock if available, otherwise use defaults
            if stock_id in stock_params:
                mu_activity_term = float(stock_params[stock_id].get("mu_term", 0))
                sigma_activity_term = float(stock_params[stock_id].get("sigma_term", 0))
            else:
                mu_activity_term = 0
                sigma_activity_term = 0

            # Apply activity weight to the terms
            mu = MU + mu_activity_term * MU_ACTIVITY_WEIGHT
            sigma = SIGMA + sigma_activity_term * SIGMA_ACTIVITY_WEIGHT

            # Calculate attrition (decay) for next iteration
            updated_mu_activity_term = mu_activity_term * MU_ATTRITION
            updated_sigma_activity_term = sigma_activity_term * SIGMA_ATTRITION

            # Update the parameters with attrition values if they exist
            if stock_id in stock_params:
                param_update = {
                    "mu_term": updated_mu_activity_term,
                    "sigma_term": updated_sigma_activity_term
                }
                tasks.append(
                    supabase_client.table("stocks_params")
                    .update(param_update)
                    .eq("stock_id", stock_id)
                    .execute()
                )

            # Generate random price movement
            epsilon = random.gauss(0, 1)

            last_price = float(stock.get("price", 0))
            new_price = last_price * math.exp(mu - (1/2)*(sigma**2) + sigma * epsilon)

            final_new_price = max(0, new_price)

            print(f"Adding new price {final_new_price} for stock {stock_id}")

            payload = {
                "p_stock_id": stock_id,
                "p_new_price": final_new_price,
                "p_ts": current_time
            }
            # Use the RPC method to both insert and update in one call
            tasks.append(supabase_client.rpc("update_stock_price", payload).execute())

        # Execute all RPC calls concurrently on the same event loop
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Check for exceptions
        for result in results:
            if isinstance(result, Exception):
                print(f"Error in async operation: {str(result)}")

        print("Price update completed successfully")
    except Exception as e:
        print(f"Error updating stock prices: {str(e)}")

async def main():
    await init_client()

    scheduler = AsyncIOScheduler()
    scheduler.add_job(update_stock_prices, 'interval', seconds=1, id="update_stock_prices", replace_existing=True)
    scheduler.start()
    print("Stock price update scheduler started successfully")

    # Keep the main coroutine alive.
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())
