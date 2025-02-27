


from fastapi import Response

def update_cookies(response: Response, session):


    response.set_cookie(
        key="access_token",
        value=session.access_token,
        httponly=True,
        secure=False,  # Set to False in development if not using HTTPS
        samesite="lax",
        max_age=3600,  # 1 hour
    )

    response.set_cookie(
        key="refresh_token",
        value=session.refresh_token,
        httponly=True,
        secure=False,  # Set to False in development if not using HTTPS
        samesite="lax",
        max_age=7 * 24 * 3600,  # 7 days
    )
