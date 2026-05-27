# ADR-0002 — Deterministic simulated stock per SKU

- **Status:** Accepted
- **Date:** 2026-05-26
- **Supersedes:** n/a

## Context

The Online Retail II dataset has no `current_stock` column. The Inventory
Risk page needs *some* stock level per SKU so the "products at risk"
metric and reorder recommendations are meaningful. I cannot pretend this
is real inventory.

I want the simulated stock to:

1. Be **reproducible** — the same SKU should get the same simulated stock
   between runs so screenshots and demos are stable.
2. Produce a **realistic mix** of under-stocked, well-stocked, and
   over-stocked SKUs so the risk page is interesting to look at.
3. Be **transparent** — anyone reading the methodology page should
   understand exactly how the number was generated.

## Decision

`simulated_stock = estimated_demand × coverage_ratio`

where:

```python
coverage_ratio(stock_code) = 0.3 + (sha256(stock_code)[0] / 255) * 1.7
```

That gives a coverage in `[0.3, 2.0]` derived deterministically from the
first byte of a hash of the stock code. Same code → same coverage → same
stock estimate.

`estimated_demand` is `mean_daily_units_in_window × 30`, and
`safety_stock` is `std_daily_units_in_window × 1.65` (≈ 95% service level).

## Alternatives considered

- **Random uniform.** Reproducibility breaks unless I pin a seed and
  iterate in the same order — fragile.
- **Fixed coverage (e.g. 0.5 for everyone).** Boring on the dashboard,
  defeats the purpose of having a "risk mix".
- **Coverage derived from product popularity.** Tempting (popular items
  understocked, niche items overstocked) but starts to look like a real
  model — and the methodology should not pretend to be one.
- **Skip the page entirely until real stock data is available.** Removes
  a chunk of the product story without adding much honesty: the page
  clearly labels everything as simulated.

## Consequences

- The page works without external data, screenshots are stable, and the
  methodology page can describe the exact formula in one paragraph.
- The risk distribution is artificial. Reviewers should understand the
  page is demonstrating the *shape* of an inventory-risk product, not a
  prediction.
- If a future version integrates a real inventory feed, the coverage
  formula should be removed entirely — not "fall back to simulated when
  real data is missing", which would be a quiet way to leak fake numbers
  into a real workflow.
