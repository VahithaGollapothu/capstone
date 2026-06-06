from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# API Input validation
from pydantic import BaseModel



class FloorPlanRequest(BaseModel):
    dimensions: str
    rooms: int
    floors: int
    style: str
    budget: float
    include_penthouse: bool = False
   

class ColorPaletteRequest(BaseModel):
    theme: str = Field(..., example="Warm Neutrals")
    room_type: str = Field(..., example="Living Room")
    lighting: str = Field(..., example="Warm Ambient LED")

class ElevationRequest(BaseModel):
    floors: int = Field(default=2)
    style: str = Field(..., example="Minimalist")
    floorPlanData: Optional[Dict[str, Any]] = Field(default=None)

class ExteriorRequest(BaseModel):
    style: str = Field(..., example="Modern")

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None

# Project Saving Schema
class ProjectSaveRequest(BaseModel):
    title: str
    type: str  # "floorplan" | "elevation" | "color"
    data: Dict[str, Any]
    previewUrl: Optional[str] = None
