#=======================================================================#
# IMPORTS
#=======================================================================#
from utils import reddit, twitch, auth, supabase
from models.classes import Credentials, ProfileData
import os
from typing import Dict
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, status
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
        print(f"Token header: {header}")

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
        print(user_data)
        user, session = supabase.login_user(user_data)
        print("user obtained succesfully")
        auth.update_cookies(response, session)
        print("cookies updated succesfully")

        profile_data: ProfileData = supabase.get_user(user.id)
        print(profile_data)

        return {"status": 200, "message": "Login successful", "data": {"profile": profile_data}}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/register")
async def register(user_data: Credentials, response: Response):
    try:
        user, session = supabase.register_user(user_data)

        auth.update_cookies(response, session)
        profile_data = supabase.get_user(user.id)
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
        session = supabase.session_refresh(refresh_token)
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
        profile_data = supabase.get_user(user_id)
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
        return {"status": 200, "data": subreddits}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/twitch/channel_search")
async def channel_search(term: str = Query(...), payload: Dict = Depends(verify_token)):
    try:
        channels = await twitch.get_channels(term)
        return {"status": 200, "data": channels}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")



#=======================================================================#
# MARKETS
#=======================================================================#

@app.post("/api/market/create") # user creates a market. update user's adminned
def create_market():
    pass


@app.post("/api/market/add") # user adds a market to their account
def add_market_to_user():
    pass


@app.get("/api/market") # get all markets associated with a given account
def get_markets():
    pass


#=======================================================================#
# STOCKS
#=======================================================================#

@app.post("/api/stock/update_position") # user updates their position in a stock
def update_stock_position():
    pass


@app.get("/api/stock") # get all stocks associated with a given account
def get_stocks():
    pass




#=======================================================================#
# RUN THE APPLICATION
#=======================================================================#

if __name__ == "__main__":
    uvicorn.run("app:app", host="localhost", port=8000, reload=True)
