import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PatientCreate(BaseModel):
    label: str


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str
    created_at: datetime
