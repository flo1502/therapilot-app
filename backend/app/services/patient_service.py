import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.patient import Patient


class PatientService:
    async def create(self, db: AsyncSession, *, tenant_id: str, label: str) -> Patient:
        patient = Patient(tenant_id=tenant_id, label=label)
        db.add(patient)
        await db.commit()
        await db.refresh(patient)
        return patient

    async def get(self, db: AsyncSession, *, tenant_id: str, patient_id: uuid.UUID) -> Patient | None:
        stmt = select(Patient).where(Patient.id == patient_id, Patient.tenant_id == tenant_id)
        return (await db.execute(stmt)).scalar_one_or_none()
