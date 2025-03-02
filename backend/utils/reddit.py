import httpx
import os
from dotenv import load_dotenv
from typing import List
from models.classes import Community

# Load environment variables from .env file
load_dotenv()

# Constants
SUBREDDIT_SEARCH_URL = "https://oauth.reddit.com/subreddits/search"
REDDIT_TOKEN = os.getenv("REDDIT_TOKEN")


# Function to get subreddits matching a search term
async def get_subreddits(term: str) -> List[Community]:
    headers = {
        "Authorization": f"Bearer {REDDIT_TOKEN}",
        "User-Agent": "python:reddit-client:v1.0 (by /u/ahamidi)"
    }

    params = {
        "q": term,
        "limit": 3
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(SUBREDDIT_SEARCH_URL, headers=headers, params=params)

    if response.status_code == 200:
        subreddits = response.json()["data"]["children"]
        return [Community(
            name=sub["data"]['display_name'],
            id=sub["data"]['display_name'],
            followers=sub["data"]["subscribers"],
            description=sub["data"]["public_description"]
        ) for sub in subreddits]
    else:
        response.raise_for_status()


