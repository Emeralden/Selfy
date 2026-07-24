from enum import Enum
import uuid
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from SelfyAPI.models.character import Character

class InvestmentType(str, Enum):
    GOLD = "gold"
    FIXED_DEPOSIT = "fixed_deposit"
    STOCK = "stock"
    MUTUAL_FUND = "mutual_fund"
    CRYPTO = "crypto"

class AssetType(str, Enum):
    HOUSE = "house"
    VEHICLE = "vehicle"
    JEWELRY = "jewelry"
    ELECTRONICS = "electronics"

class DebtType(str, Enum):
    STUDENT_LOAN = "student_loan"
    CREDIT_CARD = "credit_card"
    FAMILY_LOAN = "family_loan"
    PERSONAL_LOAN = "personal_loan"

class Investment(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    character_id: uuid.UUID = Field(foreign_key="character.id", index=True)
    type: InvestmentType  # stock, crypto, mutual_fund, fd
    name: str
    purchase_price: int
    current_value: int
    purchased_at_age: int
    character: "Character" = Relationship(back_populates="investments")

class Asset(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    character_id: uuid.UUID = Field(foreign_key="character.id", index=True)
    type: AssetType  # house, car, jewelry
    name: str
    current_value: int
    character: "Character" = Relationship(back_populates="assets")

class Debt(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    character_id: uuid.UUID = Field(foreign_key="character.id", index=True)
    type: DebtType  # student_loan, credit_card, family_loan
    principal: int
    remaining_balance: int
    interest_rate: float
    character: "Character" = Relationship(back_populates="debts")
