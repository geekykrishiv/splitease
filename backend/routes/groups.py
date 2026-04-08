from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user
from services.debt_simplifier import simplify_debts, compute_balances

router = APIRouter(prefix="/api/groups", tags=["Groups"])


def _get_group_data(group: models.Group, current_user_id: int, db: Session):
    """Helper to build group response data."""
    member_ids = [m.user_id for m in group.members]

    # Build expense data for balance computation
    expenses_data = []
    for exp in group.expenses:
        expenses_data.append({
            "paid_by": exp.paid_by,
            "amount": exp.amount,
            "splits": [{"user_id": s.user_id, "amount_owed": s.amount_owed} for s in exp.splits],
        })

    settlements_data = [
        {"payer_id": s.payer_id, "payee_id": s.payee_id, "amount": s.amount}
        for s in group.settlements
    ]

    balances = compute_balances(expenses_data, settlements_data, member_ids)
    simplified = simplify_debts(balances)

    return balances, simplified


@router.get("/")
def list_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Get groups the current user is a member of
    memberships = (
        db.query(models.GroupMember)
        .filter(models.GroupMember.user_id == current_user.id)
        .all()
    )
    group_ids = [m.group_id for m in memberships]

    groups = db.query(models.Group).filter(models.Group.id.in_(group_ids)).all()

    result = []
    for group in groups:
        balances, _ = _get_group_data(group, current_user.id, db)
        total_expenses = sum(exp.amount for exp in group.expenses)
        your_balance = balances.get(current_user.id, 0)

        result.append({
            "id": group.id,
            "name": group.name,
            "type": group.type,
            "created_at": group.created_at.isoformat(),
            "member_count": len(group.members),
            "total_expenses": round(total_expenses, 2),
            "your_balance": your_balance,
        })

    return result


@router.post("/")
def create_group(
    req: schemas.CreateGroupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = models.Group(name=req.name, type=req.type)
    db.add(group)
    db.commit()
    db.refresh(group)

    # Add creator as member
    member_ids = set(req.member_ids)
    member_ids.add(current_user.id)

    for uid in member_ids:
        user = db.query(models.User).filter(models.User.id == uid).first()
        if user:
            member = models.GroupMember(group_id=group.id, user_id=uid)
            db.add(member)

    db.commit()
    db.refresh(group)

    return {"id": group.id, "name": group.name, "type": group.type}


@router.get("/{group_id}")
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    balances, simplified = _get_group_data(group, current_user.id, db)

    # Attach user names to simplified debts
    users_map = {}
    members_response = []
    for m in group.members:
        user = m.user
        users_map[user.id] = user
        members_response.append({
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "avatar_color": user.avatar_color,
            "balance": balances.get(user.id, 0),
        })

    for debt in simplified:
        from_user = users_map.get(debt["from_id"])
        to_user = users_map.get(debt["to_id"])
        debt["from_name"] = from_user.name if from_user else "Unknown"
        debt["to_name"] = to_user.name if to_user else "Unknown"

    return {
        "id": group.id,
        "name": group.name,
        "type": group.type,
        "created_at": group.created_at.isoformat(),
        "members": members_response,
        "simplified_debts": simplified,
    }


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    db.delete(group)
    db.commit()
    return {"message": "Group deleted"}
