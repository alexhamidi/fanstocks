import os
import supabase
from models.classes import Credentials, ProfileData
from datetime import datetime
from fastapi import HTTPException

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PRIVATE_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)



def login_user(user_data: Credentials):
    # First, check if the email exists in the profiles table
    try:
        profile_response = supabase_client.table("profiles").select("email").eq("email", user_data.email).execute()

        if not profile_response.data:
            raise HTTPException(status_code=404, detail="Email not found")


        auth_response = supabase_client.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })

    except Exception as e:
        print(str(e))
        status_code = 401 if "Invalid login credentials" in str(e) \
        else 404 if "Email not found" in str(e) else 500

        raise HTTPException(status_code=status_code, detail=str(e))

    return auth_response.user, auth_response.session


def register_user(user_data: Credentials):
    # print("here")
    # Register the user
    try:
        auth_response = supabase_client.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password
        })
    except Exception as e:
        print(str(e))
        if "User already registered" in str(e):
            raise HTTPException(409, "User exists")
        raise HTTPException(status_code=500, detail=str(e))


    user = auth_response.user

    profile_data = ProfileData(
        id=user.id,
        email=user.email,
        created_at=datetime.now().isoformat(),
        avatar_url=None
    )


    try:
        supabase_client.table("profiles").insert(profile_data.model_dump()).execute()
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))

    return auth_response.user, auth_response.session


def get_user(user_id: str):
    # Get user details from auth
    try:

        profile_response = supabase_client.table("profiles").select().eq("id", user_id).single().execute()

    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))



    profile_data = profile_response.data

    return profile_data

def session_refresh(refresh_token):
    try:
        refresh_response = supabase_client.auth.refresh_session(refresh_token)
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=501, detail=str(e))

    return refresh_response.session
