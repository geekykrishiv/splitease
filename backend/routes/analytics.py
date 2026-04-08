from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from auth import get_current_user
from services.analytics_engine import AnalyticsEngine
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/api/groups/{group_id}/analytics", tags=["Analytics"])


def _build_expense_dicts(group_id: int, db: Session) -> list:
    """Convert ORM expenses to plain dicts for analytics engine."""
    expenses = (
        db.query(models.Expense)
        .filter(models.Expense.group_id == group_id)
        .order_by(models.Expense.date)
        .all()
    )
    return [
        {
            "id": exp.id,
            "title": exp.title,
            "amount": exp.amount,
            "category": exp.category,
            "paid_by": exp.paid_by,
            "payer_name": exp.payer.name,
            "date": exp.date,
            "split_type": exp.split_type,
        }
        for exp in expenses
    ]


@router.get("/summary")
def analytics_summary(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = _build_expense_dicts(group_id, db)
    engine = AnalyticsEngine(data)

    return {
        "total_expenses": round(sum(e["amount"] for e in data), 2),
        "expense_count": len(data),
        "category_breakdown": engine.category_breakdown(),
        "member_contributions": engine.member_contributions(),
        "monthly_trends": engine.monthly_trends(),
    }


@router.get("/regression")
def analytics_regression(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = _build_expense_dicts(group_id, db)
    engine = AnalyticsEngine(data)

    return {
        "slr": engine.simple_linear_regression(),
        "mlr": engine.multiple_linear_regression(),
    }


@router.get("/correlation")
def analytics_correlation(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = _build_expense_dicts(group_id, db)
    engine = AnalyticsEngine(data)

    return {
        "correlation": engine.correlation_analysis(),
        "partial_correlation": engine.partial_correlation(),
    }


@router.get("/mle")
def analytics_mle(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = _build_expense_dicts(group_id, db)
    engine = AnalyticsEngine(data)
    return engine.mle_analysis() or {"message": "Not enough data for MLE analysis"}


@router.get("/ttest")
def analytics_ttest(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = _build_expense_dicts(group_id, db)
    engine = AnalyticsEngine(data)
    return engine.t_test_analysis() or {"message": "Not enough data for t-test"}


@router.get("/sampling")
def analytics_sampling(
    group_id: int,
    category: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    member: Optional[int] = Query(None),
    min_amount: Optional[float] = Query(None),
    max_amount: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = _build_expense_dicts(group_id, db)
    engine = AnalyticsEngine(data)

    sd = None
    ed = None
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
        except ValueError:
            pass
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date)
        except ValueError:
            pass

    filtered = engine.sample_expenses(
        category=category,
        start_date=sd,
        end_date=ed,
        member=member,
        min_amount=min_amount,
        max_amount=max_amount,
    )

    return {
        "total_count": len(data),
        "filtered_count": len(filtered),
        "expenses": [
            {
                "id": e.get("id"),
                "title": e["title"] if isinstance(e, dict) else e.title,
                "amount": e["amount"] if isinstance(e, dict) else e.amount,
                "category": e["category"] if isinstance(e, dict) else e.category,
                "payer_name": e.get("payer_name", ""),
                "date": (
                    e["date"].isoformat()
                    if isinstance(e, dict) and isinstance(e["date"], datetime)
                    else str(e["date"])
                ),
            }
            for e in filtered
        ],
    }


@router.get("/categories")
def analytics_categories(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = _build_expense_dicts(group_id, db)
    engine = AnalyticsEngine(data)
    return {"categories": engine.get_unique_categories()}
