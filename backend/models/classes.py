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
    name: str
    integration: List[Integration]
    stocks: List[Stock]

    # created user id???





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
