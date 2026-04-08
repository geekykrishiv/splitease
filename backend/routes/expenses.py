from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user
from services.classifier import classify_expense
from routes.ws import manager

router = APIRouter(tags=["Expenses"])


@router.get("/api/groups/{group_id}/expenses")
def list_expenses(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.group_id == group_id)
        .order_by(models.Expense.date.desc())
        .all()
    )

    result = []
    for exp in expenses:
        splits = [
            {
                "user_id": s.user_id,
                "user_name": s.user.name,
                "amount_owed": round(s.amount_owed, 2),
            }
            for s in exp.splits
        ]
        result.append({
            "id": exp.id,
            "title": exp.title,
            "amount": exp.amount,
            "category": exp.category,
            "paid_by": exp.paid_by,
            "payer_name": exp.payer.name,
            "split_type": exp.split_type,
            "date": exp.date.isoformat(),
            "notes": exp.notes or "",
            "splits": splits,
        })

    return result


@router.post("/api/groups/{group_id}/expenses")
async def create_expense(
    group_id: int,
    req: schemas.CreateExpenseRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # AI classification
    category = classify_expense(req.title)

    # Parse date
    from datetime import datetime
    expense_date = datetime.utcnow()
    if req.date:
        try:
            expense_date = datetime.fromisoformat(req.date.replace("Z", "+00:00"))
        except ValueError:
            try:
                expense_date = datetime.strptime(req.date, "%Y-%m-%d")
            except ValueError:
                pass

    expense = models.Expense(
        group_id=group_id,
        title=req.title,
        amount=req.amount,
        category=category,
        paid_by=req.paid_by,
        split_type=req.split_type,
        date=expense_date,
        notes=req.notes,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Create splits based on split type
    member_ids = [m.user_id for m in group.members]

    if req.split_type == "equal":
        # If specific splits are provided with user_ids, use those instead of all group members
        if req.splits and len(req.splits) > 0:
            member_ids = [s.user_id for s in req.splits]
            
        per_person = round(req.amount / len(member_ids), 2)
        # Adjust last person for rounding
        for i, uid in enumerate(member_ids):
            amount_owed = per_person
            if i == len(member_ids) - 1:
                amount_owed = round(req.amount - per_person * (len(member_ids) - 1), 2)
            split = models.Split(
                expense_id=expense.id, user_id=uid, amount_owed=amount_owed
            )
            db.add(split)

    elif req.split_type == "exact":
        for sd in req.splits:
            split = models.Split(
                expense_id=expense.id, user_id=sd.user_id, amount_owed=sd.amount
            )
            db.add(split)

    elif req.split_type == "percentage":
        # Validate percentages sum to 100
        total_pct = sum(sd.percentage for sd in req.splits)
        if abs(total_pct - 100) > 0.01:
            raise HTTPException(
                status_code=400,
                detail=f"Percentages must total 100% (currently {total_pct:.1f}%)",
            )
        for sd in req.splits:
            amount_owed = round(req.amount * sd.percentage / 100, 2)
            split = models.Split(
                expense_id=expense.id, user_id=sd.user_id, amount_owed=amount_owed
            )
            db.add(split)

    db.commit()

    # Broadcast via WebSocket
    await manager.broadcast(group_id, {
        "type": "expense_added",
        "expense_id": expense.id,
        "title": expense.title,
        "amount": expense.amount,
        "category": category,
    })

    return {
        "id": expense.id,
        "title": expense.title,
        "amount": expense.amount,
        "category": category,
        "paid_by": expense.paid_by,
        "split_type": expense.split_type,
        "date": expense.date.isoformat(),
    }


@router.delete("/api/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    group_id = expense.group_id
    db.delete(expense)
    db.commit()

    await manager.broadcast(group_id, {
        "type": "expense_deleted",
        "expense_id": expense_id,
    })

    return {"message": "Expense deleted"}
