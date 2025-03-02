import os
import supabase
from models.classes import Market, Stock, StockMarket, StockPrice,  Comment, ExploreMarket, DashboardMarket
from datetime import datetime, timedelta
from fastapi import HTTPException
from constants.constants import DEFAULT_STOCK_PRICE, INITIAL_CURRENCY
import numpy as np
from collections import defaultdict
import random
from typing import List

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PRIVATE_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)


#====================================================#
# CREATE STOCK MARKET
#====================================================#
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
            supabase_client.table("stocks").insert({
                "market_id": market_id,
                "ticker": stock.ticker,
                "names": stock.names,
                "price": DEFAULT_STOCK_PRICE  # Default price as specified
            }).execute()

    except Exception as e:
        supabase_client.table("markets").delete().eq("id", market_id).execute()
        raise e


#====================================================#
# GET ALL MARKETS
#====================================================#
def get_all_markets(user_id: str):
    markets = supabase_client.rpc(
        "get_all_markets_with_status",
        {"p_user_id": user_id}
    ).execute().data

    return markets

#====================================================#
# GET JOINED MARKETS
#====================================================#
def get_joined_markets(user_id: str):
    markets = supabase_client.rpc(
        "get_user_joined_markets",
        {"p_user_id": user_id}
    ).execute().data
    return markets

#====================================================#
# USER JOINS A MARKET - need to get currency (not const)
#====================================================#
def user_join(user_id: str, market_id: str):
    supabase_client.table("joined_markets").insert({
        "user_id": user_id,
        "market_id": market_id,
        "free_currency": INITIAL_CURRENCY
    }).execute()


#====================================================#
# GET FULL STOCK MARKET
#====================================================#
def get_stock_market(user_id: str, market_id: str):
    result = supabase_client.rpc(
        "get_stock_market_details",
        {"p_user_id": user_id, "p_market_id": market_id}
    ).execute().data
    return result

#====================================================#
# BUY STOCK
#====================================================#
def buy_stock(user_id: str, stock_id: str, shares: int):

    stock_data = supabase_client.table("stocks").select("price, market_id").eq("id", stock_id).execute()

    if not stock_data:
        raise HTTPException(status_code=404, detail="Stock not found")

    stock_price = float(stock_data[0]["price"])
    market_id = stock_data[0]["market_id"]


    total_cost = stock_price * shares


    market_data = supabase_client.table("joined_markets").select("free_currency").eq("user_id", user_id).eq("market_id", market_id).execute().data
    if not market_data:
        raise HTTPException(status_code=400, detail="User has not joined this market")


    free_currency = float(market_data[0]["free_currency"])
    new_free_currency = free_currency - total_cost
    supabase_client.table("joined_markets").update({"free_currency": new_free_currency}).eq("user_id", user_id).eq("market_id", market_id).execute()

    user_stock_data = supabase_client.table("profiles_stocks").select("id, shares").eq("profile_id", user_id).eq("stock_id", stock_id).execute().data

    if user_stock_data:
        existing_shares = float(user_stock_data[0]["shares"])
        new_shares = existing_shares + shares
        supabase_client.table("profiles_stocks").update({"shares": new_shares}).eq("id", user_stock_data[0]["id"]).execute()
    else:
        supabase_client.table("profiles_stocks").insert({
            "profile_id": user_id,
            "shares": shares,
            "stock_id": stock_id,
            "market_id": market_id
        }).execute()

#====================================================#
# SELL STOCK
#====================================================#
def sell_stock(user_id: str, stock_id: str, shares: int):

    stock_data = supabase_client.table("stocks").select("price, market_id").eq("id", stock_id).execute()

    if not stock_data:
        raise HTTPException(status_code=404, detail="Stock not found")

    stock_price = float(stock_data[0]["price"])
    market_id = stock_data[0]["market_id"]

    user_stock_data = supabase_client.table("profiles_stocks").select("id, shares").eq("profile_id", user_id).eq("stock_id", stock_id).execute().data

    if not user_stock_data:
        raise HTTPException(status_code=400, detail="You don't own any shares of this stock")

    existing_shares = float(user_stock_data[0]["shares"])

    total_sale = stock_price * shares

    market_data = supabase_client.table("joined_markets").select("free_currency").eq("user_id", user_id).eq("market_id", market_id).execute().data
    if not market_data:
        raise HTTPException(status_code=400, detail="User has not joined this market")

    free_currency = float(market_data[0]["free_currency"])
    new_free_currency = free_currency + total_sale
    supabase_client.table("joined_markets").update({"free_currency": new_free_currency}).eq("user_id", user_id).eq("market_id", market_id).execute()


    new_shares = existing_shares - shares
    if new_shares > 0:
        supabase_client.table("profiles_stocks").update({"shares": new_shares}).eq("id", user_stock_data[0]["id"]).execute()
    else:
        supabase_client.table("profiles_stocks").delete().eq("id", user_stock_data[0]["id"]).execute()

    return {"success": True, "message": f"Successfully sold {shares} shares", "new_balance": new_free_currency}


#====================================================#
# POST NEW COMMENT
#====================================================#
def post_comment(user_id: str, market_id: str, message: str):

    comment_response = supabase_client.table("comments").insert({
        "user_id": user_id,
        "market_id": market_id,
        "message": message,
    }).execute()

    if not comment_response.data or len(comment_response.data) == 0:
        raise HTTPException(status_code=400, detail="Failed to post chat")

    return comment_response.data[0]
