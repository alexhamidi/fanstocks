import httpx
import os
from dotenv import load_dotenv
from typing import List
from models.classes import Community

# Load environment variables from .env file
load_dotenv()

# Constants
TWITCH_SEARCH_URL = "https://api.twitch.tv/helix/search/channels"
TWITCH_CLIENT_ID = os.getenv("TWITCH_CLIENT_ID")
TWITCH_TOKEN = os.getenv("TWITCH_TOKEN")


# Function to get channels matching a search term
async def get_channels(term: str) -> List[Community]:
    headers = {
        "Client-ID": TWITCH_CLIENT_ID,
        "Authorization": f"Bearer {TWITCH_TOKEN}",
        "User-Agent": "python:twitch-client:v1.0 (by /u/ahamidi)"
    }

    params = {
        "query": term,
        "first": 3  # Limit the number of results
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(TWITCH_SEARCH_URL, headers=headers, params=params)

    if response.status_code == 200:
        channels = response.json()["data"]
        return [Community(
            name=channel["display_name"],
            id=channel["id"],
            followers=channel["game_id"],
            description=channel["title"]
        ) for channel in channels]
    else:
        response.raise_for_status()
