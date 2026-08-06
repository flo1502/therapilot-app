import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_patient_service
from app.core.security import Principal, get_current_principal
from app.db.database import get_db
from app.schemas.patient import PatientCreate, PatientOut
from app.services.patient_service import PatientService

router = APIRouter()


@router.post("/patients", response_model=PatientOut)
async def create_patient(
    body: PatientCreate,
    db: AsyncSession = Depends(get_db),
    patient_service: PatientService = Depends(get_patient_service),
    principal: Principal = Depends(get_current_principal),
) -> PatientOut:
    patient = await patient_service.create(db, tenant_id=principal.tenant_id, label=body.label)
    return PatientOut.model_validate(patient)


@router.get("/patients/{patient_id}", response_model=PatientOut)
async def get_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    patient_service: PatientService = Depends(get_patient_service),
    principal: Principal = Depends(get_current_principal),
) -> PatientOut:
    patient = await patient_service.get(db, tenant_id=principal.tenant_id, patient_id=patient_id)
    if patient is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return PatientOut.model_validate(patient)
