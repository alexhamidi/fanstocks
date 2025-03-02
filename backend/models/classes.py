from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from typing import Literal


class Community(BaseModel):
    name: str
    id: str
    followers: int
    description: str




class Stock(BaseModel):
    ticker: str
    names: List[str]



IntegrationService = Literal["reddit", "twitch"]


class Integration(BaseModel):
    service: IntegrationService
    community: Community



class Market(BaseModel):
    market_name: str
    integrations: List[Integration]
    stocks: List[Stock]

class ExploreMarket(BaseModel):
    market_id: str
    market_name: str
    status: Literal["joined", "owned", "none"]

class DashboardMarket(BaseModel):
    market_id: str
    market_name: str
    free_currency: float



class StockPrice(BaseModel):
    price: float
    timestamp: datetime

class Comment(BaseModel):
    created_at: datetime
    user_email: str
    chat_id: str
    message: str

class Stock(BaseModel):
    stock_id: str
    ticker: str
    comments: List[Comment]
    prices: List[StockPrice]
    shares: int

class StockMarket(BaseModel):
    market_name: str
    market_id: str
    stocks: List[Stock]
    free_currency: float



#=======================================================================#
# AUTH MODELS
#=======================================================================#
class Credentials(BaseModel):
    email: str
    password: str

class ProfileData(BaseModel):
    id: str
    email: str
    created_at: datetime
    avatar_url: Optional[str] = None

class ProfileUpdate(BaseModel):
    avatar_url: Optional[str] = None
