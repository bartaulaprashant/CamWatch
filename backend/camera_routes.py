
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Camera, User
from backend.auth import get_current_user


router = APIRouter(prefix="/cameras", tags=["Cameras"])


class CameraCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    device_index: int = Field(default=0, ge=0)


class CameraUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    is_enabled: bool | None = None


def camera_response(camera):
    return {
        "id": camera.id,
        "name": camera.name,
        "device_index": camera.device_index,
        "is_enabled": camera.is_enabled,
        "created_at": camera.created_at
    }


@router.get("/")
def list_cameras(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    cameras = db.query(Camera).all()
    return [camera_response(camera) for camera in cameras]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_camera(
    data: CameraCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    existing = db.query(Camera).filter(
        Camera.device_index == data.device_index
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A camera with this device index already exists"
        )

    camera = Camera(
        name=data.name,
        device_index=data.device_index
    )

    db.add(camera)
    db.commit()
    db.refresh(camera)

    return camera_response(camera)


@router.get("/{camera_id}")
def get_camera(
    camera_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    camera = db.query(Camera).filter(
        Camera.id == camera_id
    ).first()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    return camera_response(camera)


@router.patch("/{camera_id}")
def update_camera(
    camera_id: int,
    data: CameraUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    camera = db.query(Camera).filter(
        Camera.id == camera_id
    ).first()

    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No update fields provided"
        )

    for field, value in updates.items():
        setattr(camera, field, value)

    db.commit()
    db.refresh(camera)

    return camera_response(camera)
