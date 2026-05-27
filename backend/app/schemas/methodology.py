from __future__ import annotations

from pydantic import BaseModel


class MethodologySection(BaseModel):
    title: str
    body: list[str]


class MethodologyResponse(BaseModel):
    dataset: MethodologySection
    data_cleaning: MethodologySection
    revenue: MethodologySection
    forecasting: MethodologySection
    inventory: MethodologySection
    transactions: MethodologySection
    limitations: MethodologySection
