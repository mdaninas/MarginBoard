from __future__ import annotations

from pydantic import BaseModel, Field


class AssociationRule(BaseModel):
    antecedents: list[str] = Field(description="Stock codes on the left-hand side of the rule.")
    antecedent_labels: list[str] = Field(description="Human-readable product names for the antecedents.")
    consequents: list[str]
    consequent_labels: list[str]
    support: float = Field(description="Fraction of all baskets that contain both antecedents and consequents.")
    confidence: float = Field(description="P(consequents | antecedents). Conditional probability of the implication.")
    lift: float = Field(description="confidence / P(consequents). >1 means positively associated, <1 means anti-correlated.")
    antecedent_support: float
    consequent_support: float


class BasketSummary(BaseModel):
    transactions_analyzed: int
    unique_items_considered: int = Field(
        description="Number of distinct SKUs included in the analysis (the long tail is pruned to keep Apriori tractable)."
    )
    rules_found: int
    min_support: float
    min_confidence: float
    note: str
