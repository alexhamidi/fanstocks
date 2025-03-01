import os
import supabase
import random
from datetime import datetime, timedelta
from fastapi import HTTPException
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from time import sleep

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PRIVATE_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# Function to update stock prices every minute
def update_stock_prices():
    try:
        # Get all stocks from the database
        response = supabase_client.table('stocks').select('*').execute()
        stocks = response.data

        if not stocks:
            print("No stocks found in database")
            return

        # Current timestamp
        current_time = datetime.now()

        print(f"Updating prices for {len(stocks)} stocks at {current_time}")

        for stock in stocks:
            # Get the last price for this stock
            last_price_response = supabase_client.table('stock_prices') \
                .select('*') \
                .eq('stock_id', stock['id']) \
                .order('timestamp', desc=True) \
                .limit(1) \
                .execute()

            # If there's no previous price, use the stock's base price
            if last_price_response.data and len(last_price_response.data) > 0:
                last_price = last_price_response.data[0]['price']
            else:
                last_price = stock['price']

            # Simulate a small price change
            price_change = random.uniform(-2, 2)  # Price changes between -2 and +2
            current_price = max(0, last_price + price_change)  # Ensure price doesn't go negative

            new_price = round(current_price, 2)

            # Insert the new price into stock_prices table
            print(f"Adding new price {new_price} for stock {stock['id']}")

            price_insert = supabase_client.table('stock_prices').insert({
                'stock_id': stock['id'],
                'price': new_price,
                'timestamp': current_time.isoformat()
            }).execute()

            # Check if insertion was successful
            if hasattr(price_insert, 'error') and price_insert.error:
                print(f"Error inserting price: {price_insert.error}")

            # Update the current price in the stocks table
            stock_update = supabase_client.table('stocks') \
                .update({'price': new_price}) \
                .eq('id', stock['id']) \
                .execute()

            # Check if update was successful
            if hasattr(stock_update, 'error') and stock_update.error:
                print(f"Error updating stock: {stock_update.error}")

        print("Price update completed successfully")

    except Exception as e:
        print(f"Error updating stock prices: {str(e)}")
        # Log the error but don't raise it to prevent the scheduler from stopping

# Initialize the scheduler
scheduler = BackgroundScheduler()

# Function to start the scheduler
def start_price_update_scheduler():
    try:
        # Make sure we don't have duplicate jobs
        if scheduler.get_job("update_stock_prices"):
            scheduler.remove_job("update_stock_prices")

        scheduler.add_job(
            update_stock_prices,
            IntervalTrigger(seconds=10),
            id="update_stock_prices",
            replace_existing=True
        )

        # Start the scheduler if it's not already running
        if not scheduler.running:
            scheduler.start()

        print("Stock price update scheduler started successfully")

        # Run update once immediately
        update_stock_prices()

    except Exception as e:
        print(f"Error starting scheduler: {str(e)}")

# Function to stop the scheduler
def stop_price_update_scheduler():
    try:
        if scheduler.running:
            scheduler.shutdown()
            print("Stock price update scheduler stopped")
        else:
            print("Scheduler was not running")
    except Exception as e:
        print(f"Error stopping scheduler: {str(e)}")

if __name__ == "__main__":
    # Uncomment this line to start the scheduler
    start_price_update_scheduler()

    # Keep the script running
    try:
        # This will keep the script running indefinitely
        while True:
            sleep(1)
            pass
    except KeyboardInterrupt:
        # Handle Ctrl+C to stop the scheduler gracefully
        stop_price_update_scheduler()
        print("Script terminated by user")
