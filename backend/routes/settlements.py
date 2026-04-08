from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user
from routes.ws import manager

router = APIRouter(tags=["Settlements"])


@router.get("/api/groups/{group_id}/settlements")
def list_settlements(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    settlements = (
        db.query(models.Settlement)
        .filter(models.Settlement.group_id == group_id)
        .order_by(models.Settlement.date.desc())
        .all()
    )

    return [
        {
            "id": s.id,
            "payer_id": s.payer_id,
            "payee_id": s.payee_id,
            "payer_name": s.payer.name,
            "payee_name": s.payee.name,
            "amount": s.amount,
            "date": s.date.isoformat(),
        }
        for s in settlements
    ]


@router.post("/api/groups/{group_id}/settle")
async def settle_up(
    group_id: int,
    req: schemas.CreateSettlementRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    settlement = models.Settlement(
        group_id=group_id,
        payer_id=req.payer_id,
        payee_id=req.payee_id,
        amount=req.amount,
    )
    db.add(settlement)
    db.commit()
    db.refresh(settlement)

    payer = db.query(models.User).filter(models.User.id == req.payer_id).first()
    payee = db.query(models.User).filter(models.User.id == req.payee_id).first()

    await manager.broadcast(group_id, {
        "type": "settlement_added",
        "settlement_id": settlement.id,
        "payer_name": payer.name if payer else "",
        "payee_name": payee.name if payee else "",
        "amount": settlement.amount,
    })

    return {
        "id": settlement.id,
        "payer_id": settlement.payer_id,
        "payee_id": settlement.payee_id,
        "payer_name": payer.name if payer else "",
        "payee_name": payee.name if payee else "",
        "amount": settlement.amount,
        "date": settlement.date.isoformat(),
    }
