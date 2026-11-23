
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pathlib import Path
from fastapi.responses import FileResponse

from backend.database import get_db
from backend.models import MotionEvent
from backend.auth import get_current_user


PROJECT_ROOT = Path(__file__).resolve().parent.parent

router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


@router.get("/")
def get_events(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    camera_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(MotionEvent)

    if camera_id is not None:
        query = query.filter(MotionEvent.camera_id == camera_id)

    total = query.count()

    events = (
        query
        .order_by(MotionEvent.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "events": [
            {
                "id": event.id,
                "camera_id": event.camera_id,
                "image_path": event.image_path,
                "description": event.description,
                "created_at": event.created_at
            }
            for event in events
        ]
    }


@router.get("/{event_id}")
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    event = db.query(MotionEvent).filter(
        MotionEvent.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return {
        "id": event.id,
        "camera_id": event.camera_id,
        "image_path": event.image_path,
        "description": event.description,
        "created_at": event.created_at
    }


@router.get("/{event_id}/image")
def get_event_image(
    event_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    event = db.query(MotionEvent).filter(
        MotionEvent.id == event_id
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    image_path = (
        PROJECT_ROOT / event.image_path
    ).resolve()

    # Prevent access outside the project directory
    if not image_path.is_relative_to(PROJECT_ROOT.resolve()):
        raise HTTPException(
            status_code=400,
            detail="Invalid image path"
        )

    if not image_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Event image not found"
        )

    return FileResponse(
        path=image_path,
        media_type="image/jpeg",
        filename=image_path.name
    )

