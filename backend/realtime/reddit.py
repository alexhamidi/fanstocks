import aiohttp
import os
import asyncio
import logging
from datetime import datetime
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from textblob import TextBlob
from supabase import acreate_client
from typing import Dict, List, Set, Tuple, Any

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Constants and configuration
REDDIT_TOKEN = os.getenv("REDDIT_TOKEN")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PRIVATE_KEY")
UPDATE_INTERVAL = 10  # seconds
POSTS_LIMIT = 10  # Number of posts to fetch per subreddit

# Initialize global variables
supabase_client = None
seen_post_ids: Set[str] = set()

# Data structures to cache database information
markets_cache: List[Dict] = []
integrations_cache: List[Dict] = []
stocks_cache: List[Dict] = []
market_subreddits: Dict[str, List[str]] = {}  # market_id -> [subreddit1, subreddit2, ...]
stock_market_map: Dict[str, str] = {}  # stock_id -> market_id
stock_names_map: Dict[str, List[str]] = {}  # stock_id -> [name1, name2, ...]


async def init_client():
    """Initialize the Supabase client"""
    global supabase_client
    supabase_client = await acreate_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized")


async def fetch_db_data():
    """Fetch all necessary data from the database and update caches"""
    global markets_cache, integrations_cache, stocks_cache, market_subreddits, stock_market_map, stock_names_map

    try:
        # Fetch markets
        markets_response = await supabase_client.table('markets').select('*').execute()
        markets_cache = markets_response.data

        # Fetch integrations (focusing only on Reddit)
        integrations_response = await supabase_client.table('integrations').select('*').eq('service', 'reddit').execute()
        integrations_cache = integrations_response.data

        # Fetch stocks with their names
        stocks_response = await supabase_client.table('stocks').select('*').execute()
        stocks_cache = stocks_response.data

        # Map market IDs to their corresponding subreddits
        market_subreddits = {}
        for integration in integrations_cache:
            market_id = integration.get('market_id')
            community_id = integration.get('community_id')

            if market_id and community_id:
                if market_id not in market_subreddits:
                    market_subreddits[market_id] = []
                market_subreddits[market_id].append(community_id)

        # Map stocks to their markets and names
        stock_market_map = {}
        stock_names_map = {}
        for stock in stocks_cache:
            stock_id = stock.get('id')
            market_id = stock.get('market_id')
            names = stock.get('names', [])

            if stock_id and market_id:
                stock_market_map[stock_id] = market_id
                stock_names_map[stock_id] = names

        logger.info(f"Database data refreshed: {len(markets_cache)} markets, {len(integrations_cache)} Reddit integrations, {len(stocks_cache)} stocks")

    except Exception as e:
        logger.error(f"Error fetching database data: {str(e)}")


def extract_words(text: str) -> Set[str]:
    """Extract individual words from text for analysis"""
    if not text:
        return set()
    return set(text.lower().split())


def get_sentiment(text: str) -> float:
    """Calculate sentiment score for text using TextBlob"""
    if not text.strip():
        return 0.0
    blob = TextBlob(text)
    return blob.sentiment.polarity


async def fetch_posts(session: aiohttp.ClientSession, subreddit: str) -> Dict:
    """Fetch recent posts from a subreddit"""
    url = f"https://oauth.reddit.com/r/{subreddit}/new"
    headers = {
        "Authorization": f"Bearer {REDDIT_TOKEN}",
        "User-Agent": "python:market-sentiment-analyzer:v1.0"
    }
    params = {"limit": POSTS_LIMIT}

    try:
        async with session.get(url, headers=headers, params=params) as response:
            if response.status != 200:
                logger.warning(f"Error fetching posts from r/{subreddit}, status code: {response.status}")
                return {}

            return await response.json()
    except Exception as e:
        logger.error(f"Exception when fetching posts from r/{subreddit}: {str(e)}")
        return {}


async def analyze_post(post_data: Dict, subreddit: str) -> Dict[str, float]:
    """Analyze a single Reddit post for stock sentiment"""
    post_id = post_data.get("id")
    title = post_data.get("title", "")
    body = post_data.get("selftext", "")
    full_text = f"{title} {body}"

    # Skip if we've seen this post before or if it's empty
    if post_id in seen_post_ids or not full_text.strip():
        return {}

    seen_post_ids.add(post_id)

    # Extract words from the post
    post_words = extract_words(full_text)

    # Calculate sentiment for all stocks that have relevant terms in the post
    stock_sentiments = {}

    for stock_id, names in stock_names_map.items():
        # Skip stocks that don't have any names defined
        if not names:
            continue

        # Check if any of the stock's names appear in the post
        matches = [name.lower() for name in names if name.lower() in full_text.lower()]

        if matches:
            # Calculate sentiment score for this stock based on the post
            sentiment = get_sentiment(full_text)

            # Log the match
            logger.info(f"Post in r/{subreddit} mentions stock {stock_id} ({', '.join(matches)}): sentiment = {sentiment:.2f}")

            stock_sentiments[stock_id] = sentiment

    return stock_sentiments


async def process_subreddit_posts(posts_data: Dict, subreddit: str) -> Dict[str, float]:
    """Process all posts from a subreddit and aggregate sentiment scores by stock"""
    if not posts_data or 'data' not in posts_data or 'children' not in posts_data['data']:
        logger.warning(f"Invalid data format from r/{subreddit}")
        return {}

    all_stock_sentiments = {}
    post_count = 0

    for post in posts_data['data']['children']:
        if 'data' not in post:
            continue

        post_stock_sentiments = await analyze_post(post['data'], subreddit)

        # Merge sentiment scores
        for stock_id, sentiment in post_stock_sentiments.items():
            if stock_id not in all_stock_sentiments:
                all_stock_sentiments[stock_id] = []
            all_stock_sentiments[stock_id].append(sentiment)

        post_count += 1

    # Average the sentiment scores for each stock
    averaged_sentiments = {}
    for stock_id, sentiments in all_stock_sentiments.items():
        if sentiments:
            averaged_sentiments[stock_id] = sum(sentiments) / len(sentiments)

    logger.info(f"Processed {post_count} posts from r/{subreddit}, found sentiments for {len(averaged_sentiments)} stocks")
    return averaged_sentiments


async def update_stock_parameters(stock_sentiments: Dict[str, float]):
    """Update stock parameters in the database based on sentiment analysis"""
    if not stock_sentiments:
        return

    try:
        # Batch the updates for efficiency
        tasks = []

        for stock_id, sentiment in stock_sentiments.items():
            # Scale sentiment to appropriate parameter adjustments
            mu_adjustment = sentiment * 0.001  # Adjust scale as needed
            sigma_adjustment = abs(sentiment) * 0.005  # Higher volatility for strong sentiments

            # First check if the stock already has parameters
            params_response = await supabase_client.table('stocks_params').select('*').eq('stock_id', stock_id).execute()

            if params_response.data:
                # Update existing parameters
                param_update = {
                    "mu_term": mu_adjustment,
                    "sigma_term": sigma_adjustment,
                }
                tasks.append(
                    supabase_client.table("stocks_params")
                    .update(param_update)
                    .eq("stock_id", stock_id)
                    .execute()
                )
            else:
                # Create new parameters
                param_insert = {
                    "stock_id": stock_id,
                    "mu_term": mu_adjustment,
                    "sigma_term": sigma_adjustment
                }
                tasks.append(
                    supabase_client.table("stocks_params")
                    .insert(param_insert)
                    .execute()
                )

        # Execute all updates concurrently
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Check for exceptions
            for result in results:
                if isinstance(result, Exception):
                    logger.error(f"Error in database update: {str(result)}")

            logger.info(f"Updated parameters for {len(tasks)} stocks based on sentiment analysis")

    except Exception as e:
        logger.error(f"Error updating stock parameters: {str(e)}")


async def process_all_subreddits():
    """Process all subreddits for all markets"""
    # Refresh database data
    await fetch_db_data()

    # Collect all unique subreddits
    all_subreddits = set()
    for subreddits in market_subreddits.values():
        all_subreddits.update(subreddits)

    if not all_subreddits:
        logger.warning("No subreddits found for any markets")
        return

    # Fetch and process posts from all subreddits
    async with aiohttp.ClientSession() as session:
        # Fetch posts concurrently
        fetch_tasks = {subreddit: fetch_posts(session, subreddit) for subreddit in all_subreddits}
        posts_by_subreddit = {}

        for subreddit, task in fetch_tasks.items():
            try:
                posts_by_subreddit[subreddit] = await task
            except Exception as e:
                logger.error(f"Failed to fetch posts for r/{subreddit}: {str(e)}")
                posts_by_subreddit[subreddit] = {}

        # Process posts and calculate sentiments
        process_tasks = {subreddit: process_subreddit_posts(posts, subreddit)
                         for subreddit, posts in posts_by_subreddit.items()}

        sentiments_by_subreddit = {}
        for subreddit, task in process_tasks.items():
            try:
                sentiments_by_subreddit[subreddit] = await task
            except Exception as e:
                logger.error(f"Failed to process posts for r/{subreddit}: {str(e)}")
                sentiments_by_subreddit[subreddit] = {}

    # Aggregate sentiments across subreddits for each stock
    all_stock_sentiments = {}

    # For each market, aggregate sentiments from its subreddits
    for market_id, subreddits in market_subreddits.items():
        for subreddit in subreddits:
            if subreddit not in sentiments_by_subreddit:
                continue

            # Get sentiments for this subreddit
            subreddit_sentiments = sentiments_by_subreddit[subreddit]

            # For each stock in this subreddit's sentiments
            for stock_id, sentiment in subreddit_sentiments.items():
                # Make sure this stock belongs to the current market
                if stock_id in stock_market_map and stock_market_map[stock_id] == market_id:
                    if stock_id not in all_stock_sentiments:
                        all_stock_sentiments[stock_id] = []
                    all_stock_sentiments[stock_id].append(sentiment)

    # Average sentiments for each stock
    final_stock_sentiments = {}
    for stock_id, sentiments in all_stock_sentiments.items():
        if sentiments:
            final_stock_sentiments[stock_id] = sum(sentiments) / len(sentiments)

    # Update stock parameters based on sentiment analysis
    await update_stock_parameters(final_stock_sentiments)

    # Log summary
    logger.info(f"Completed sentiment analysis cycle: processed {len(all_subreddits)} subreddits, "
                f"calculated sentiments for {len(final_stock_sentiments)} stocks")


async def main():
    """Main function to run the application"""
    try:
        # Initialize Supabase client
        await init_client()

        # Initial fetch of database data
        await fetch_db_data()

        # Set up scheduler
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            process_all_subreddits,
            'interval',
            seconds=UPDATE_INTERVAL,
            id="process_subreddits",
            replace_existing=True
        )
        scheduler.start()

        logger.info(f"Reddit sentiment analyzer started successfully. "
                   f"Updating every {UPDATE_INTERVAL} seconds.")

        # Keep the main coroutine alive
        while True:
            await asyncio.sleep(1)

    except Exception as e:
        logger.error(f"Error in main function: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
