#=======================================================================#
# IMPORTS
#=======================================================================#
from utils import reddit, twitch, auth
from utils.db import users, markets

from models.classes import Credentials, ProfileData, Integration, Stock, Market, StockMarket, ExploreMarket, DashboardMarket
import os
from pydantic import BaseModel
from typing import Dict, List
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
from dotenv import load_dotenv
import jwt
from jwt.exceptions import InvalidTokenError

#=======================================================================#
# CONFIGURE THE APP AND CORS
#=======================================================================#

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")
JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is not set.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer()


#=======================================================================#
# SECURITY
#=======================================================================#

def verify_token(request: Request):

    token = request.cookies.get("access_token")
    if not token: # this prints
        print("MISSING TOKEN")
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        # Get token information without verification first for debugging
        header = jwt.get_unverified_header(token)

        # Decode the token with the correct settings
        # Important: Supabase uses HS256 algorithm with JWT secret
        # The 'aud' and 'iss' claims are set by Supabase
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            # You might need to specify audience and/or issuer
            options={
                "verify_aud": False,  # Skip audience verification initially
                "verify_iss": False,  # Skip issuer verification initially
            }
        )
        return payload
    except InvalidTokenError as e:
        print(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


#=======================================================================#
# AUTH ROUTES
#=======================================================================#
@app.post("/api/login")
async def login(user_data: Credentials, response: Response):
    try:
        user, session = users.login_user(user_data)
        auth.update_cookies(response, session)

        profile_data: ProfileData = users.get_user(user.id)

        return {"status": 200, "message": "Login successful", "data": {"profile": profile_data}}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/register")
async def register(user_data: Credentials, response: Response):
    try:
        user, session = users.register_user(user_data)

        auth.update_cookies(response, session)
        profile_data = users.get_user(user.id)

        return {"status": 200, "message": "Registration and login successful", "data": {"profile": profile_data}}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"status": "success", "message": "Logged out successfully"}


@app.post("/api/refresh-token")
async def refresh_token(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token not found")
    try:
        session = users.session_refresh(refresh_token)
        auth.update_cookies(response, session)
        return {"status": "success", "message": "Token refreshed successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/me")
async def get_current_user(payload: Dict = Depends(verify_token)):
    try:
        user_id = payload.get("sub")
        profile_data = users.get_user(user_id)
        return {"status": 200, "data": {"profile": profile_data}}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

#=======================================================================#
# COMMUNITY ROUTES
#=======================================================================#

@app.post("/api/reddit/subreddit_search")
async def subreddit_search(term: str = Query(...), payload: Dict = Depends(verify_token)):
    try:
        subreddits = await reddit.get_subreddits(term)
        return {"status": 200, "data": {"communities":subreddits}}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/twitch/channel_search")
async def channel_search(term: str = Query(...), payload: Dict = Depends(verify_token)):
    try:
        channels = await twitch.get_channels(term)
        return {"status": 200,"data": {"communities":channels}}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")



#=======================================================================#
# MARKETS
#=======================================================================#



#=======================================================================#
# CREATE MARKET
#=======================================================================#
@app.post("/api/markets/create")
def create_market(market_data: Market = Body(...), payload: Dict = Depends(verify_token)):
    user_id = payload.get("sub")

    try:
        markets.create(market_data, user_id)

        return {"status": 200}

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

#=======================================================================#
# GET MARKETS FOR EXPLORE
#=======================================================================#
@app.get("/api/markets")
def get_all(payload: Dict = Depends(verify_token)):

    user_id = payload.get("sub")

    try:

        markets_response = markets.get_all_markets(user_id)

        return {"status": 200, "data":{"markets":markets_response}}
    except Exception as e:
            print(e)
            raise HTTPException(status_code=500, detail="Internal server error")

#=======================================================================#
# GET JOINED MARKET
#=======================================================================#
@app.get("/api/markets/joined") # here
def get_joined(payload: Dict = Depends(verify_token)):

    user_id = payload.get("sub")

    try:

        markets_response = markets.get_joined_markets(user_id)

        return {"status": 200, "data":{"markets":markets_response}}
    except Exception as e:
            print(e)
            raise HTTPException(status_code=500, detail="Internal server error")


#=======================================================================#
# JOIN MARKET
#=======================================================================#
@app.post("/api/markets/join") # user adds a market to their account
def join_market(market_id: str = Query(...), payload: Dict = Depends(verify_token)):

    user_id = payload.get("sub")
    try:
        markets.user_join(user_id, market_id )
        return {"status": 200}
    except Exception as e:
            print(e)
            raise HTTPException(status_code=500, detail="Internal server error")

#=======================================================================#
# GET ENTIRE STOCKMARKET
#=======================================================================#
@app.get("/api/markets/stockmarket")
def get_market(market_id: str = Query(...), payload: Dict = Depends(verify_token)):

    user_id = payload.get("sub")
    try:
        market = markets.get_stock_market(user_id, market_id )
        return {"status": 200,"data":{"market":market}}
    except Exception as e:
            print(e)
            raise HTTPException(status_code=500, detail="Internal server error")


#=======================================================================#
# POST COMMENT
#=======================================================================#
@app.post("/api/markets/comment")
def post_new_comment(market_id: str = Query(...), message: str = Query(...), payload: Dict = Depends(verify_token)):

    user_id = payload.get("sub")
    try:
        markets.post_comment(user_id, market_id, message)
        return {"status": 200}
    except Exception as e:
            print(e)
            raise HTTPException(status_code=500, detail="Internal server error")


#=======================================================================#
# STOCKS
#=======================================================================#





@app.get("/api/stocks/buy")
def execute_buy_order(stock_id: str = Query(...), shares: float = Query(...), payload: Dict = Depends(verify_token)):
    user_id = payload.get("sub")
    try:

        markets.buy_stock(user_id, stock_id, shares)

        return {"status": 200}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")



@app.get("/api/stocks/sell")
def execute_sell_order(stock_id: str = Query(...), shares: float = Query(...), payload: Dict = Depends(verify_token)):
    user_id = payload.get("sub")
    try:

        markets.sell_stock(user_id, stock_id, shares)

        return {"status": 200}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")




#=======================================================================#
# RUN THE APPLICATION
#=======================================================================#

if __name__ == "__main__":
    uvicorn.run("app:app", host="localhost", port=8000, reload=True)
