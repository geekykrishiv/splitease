"""CSV Export endpoint — spreadsheet-style multi-user balance columns."""
import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user

router = APIRouter(tags=["Export"])


@router.get("/api/groups/{group_id}/export/csv")
def export_group_csv(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Group not found")

    # Get all members in order
    members = []
    for gm in group.members:
        members.append(gm.user)

    member_ids = [m.id for m in members]
    member_names = [m.name for m in members]

    # Get all expenses for the group, ordered by date
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.group_id == group_id)
        .order_by(models.Expense.date)
        .all()
    )

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header: Date, Description, Category, Cost, Currency, User1, User2, ...
    header = ["Date", "Description", "Category", "Cost", "Currency"] + member_names
    writer.writerow(header)

    for exp in expenses:
        # Build per-user balance map
        # Splits tell us how much each user owes
        split_map = {}
        for s in exp.splits:
            split_map[s.user_id] = s.amount_owed

        row = [
            exp.date.strftime("%Y-%m-%d"),
            exp.title,
            exp.category,
            round(exp.amount, 2),
            "INR",
        ]

        for uid in member_ids:
            owed = split_map.get(uid, 0)
            if uid == exp.paid_by:
                # Payer gets back what others owe: paid_amount - own_share
                balance = round(exp.amount - owed, 2)
            else:
                # Non-payer owes their share (negative)
                balance = round(-owed, 2)
            row.append(balance)

        writer.writerow(row)

    # Generate safe filename
    safe_name = "".join(c if c.isalnum() or c in " _-" else "_" for c in group.name)
    safe_name = safe_name.strip().replace(" ", "_").lower()
    filename = f"{safe_name}_detailed_splitwise_export.csv"

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
