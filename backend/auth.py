
from pwdlib import PasswordHash

from fastapi import HTTPException, Request, Depends
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        request.session.clear()
        raise HTTPException(
            status_code=401,
            detail="Invalid or inactive session"
        )

    return user
