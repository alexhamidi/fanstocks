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

class DisplayMarket(BaseModel):
    stocks: List[Stock]
    market_id: str
    status: str
    market_name: str


class StockPrice(BaseModel):
    price: float
    timestamp: datetime

class StockPrices(BaseModel):
    prices: List[StockPrice]

class SimpleStock(BaseModel):
    stock_id: str
    ticker: str
    shares: int

class StockMarket(BaseModel):
    market_name: str
    market_id: str
    stocks: List[SimpleStock]
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
