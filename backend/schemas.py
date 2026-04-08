from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# ── Auth ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar_color: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ── Group ─────────────────────────────────────────────
class CreateGroupRequest(BaseModel):
    name: str
    type: str = "custom"
    member_ids: List[int] = []


class MemberBalance(BaseModel):
    user_id: int
    name: str
    email: str
    avatar_color: str
    balance: float


class GroupListItem(BaseModel):
    id: int
    name: str
    type: str
    created_at: datetime
    member_count: int
    total_expenses: float
    your_balance: float

    class Config:
        from_attributes = True


class GroupDetailResponse(BaseModel):
    id: int
    name: str
    type: str
    created_at: datetime
    members: List[MemberBalance]
    simplified_debts: list


# ── Expense ───────────────────────────────────────────
class SplitDetail(BaseModel):
    user_id: int
    amount: float = 0
    percentage: float = 0


class CreateExpenseRequest(BaseModel):
    title: str
    amount: float
    paid_by: int
    split_type: str = "equal"
    splits: List[SplitDetail] = []
    date: Optional[str] = None
    notes: str = ""


class SplitResponse(BaseModel):
    user_id: int
    user_name: str
    amount_owed: float


class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    paid_by: int
    payer_name: str
    split_type: str
    date: datetime
    notes: str
    splits: List[SplitResponse]

    class Config:
        from_attributes = True


# ── Settlement ────────────────────────────────────────
class CreateSettlementRequest(BaseModel):
    payer_id: int
    payee_id: int
    amount: float


class SettlementResponse(BaseModel):
    id: int
    payer_id: int
    payee_id: int
    payer_name: str
    payee_name: str
    amount: float
    date: datetime

    class Config:
        from_attributes = True


# ── Analytics ─────────────────────────────────────────
class SamplingRequest(BaseModel):
    category: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
