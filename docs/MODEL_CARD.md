# Model Card — MarginBoard v0.2

Two models are deployed in MarginBoard v0.2: a 30-day revenue forecaster
and a transaction anomaly scorer. Both are intentionally simple so they
can be inspected, justified, and replaced.

---

## 1. Forecast model

### Intended use
Provide a 30-day directional revenue projection for the entire business,
not for individual SKUs or customers. Output is a planning aid, not a
commitment.

### Algorithm
`sklearn.ensemble.GradientBoostingRegressor`
with `n_estimators=300`, `learning_rate=0.05`, `max_depth=3`,
`random_state=42`.

### Training data
Daily revenue series derived from the Online Retail II dataset
(Dec 2009 – Dec 2011). Reindexed to a continuous date range with missing
days filled as zero.

### Features
Day of week, month, week of year, weekend flag, lag-1, lag-7, rolling
7 / 14 / 30 day means. All features are exogenous to today's revenue.

### Validation
Chronological 80 / 20 split. The model is trained on the earlier 80%
and scored on the latest 20% using MAE and MAPE.

> The current validation is a single split — see the ROADMAP for
> `TimeSeriesSplit` cross-validation as a follow-up.

### Inference
30-day horizon, generated iteratively: each predicted day fills the
lag features of the next prediction.

### Known limitations
- No external regressors (holidays, promotions, weather, macro).
- Single time series; product-level patterns are averaged out.
- Iterative inference accumulates error along the horizon.
- The dataset ends in Dec 2011; the model cannot account for any
  structural change since then.

### Failure modes to expect
- Underestimates spikes driven by promotional events.
- Overestimates after multi-day zero-revenue gaps (treats them as new
  baseline).
- MAPE inflates when the validation window contains near-zero days
  (handled by masking those days in the metric).

---

## 2. Anomaly model

### Intended use
Surface transaction lines that look unusual relative to the historical
distribution, so an analyst can review them. This is **not** fraud
detection — the dataset contains no fraud labels.

### Algorithm
Hybrid:

1. **Rule layer.** Five transparent rules generate human-readable
   reason codes:
   - Negative quantity / return
   - Unusually high quantity (> p99 of |quantity|)
   - Extreme unit price (> p99 of unit_price)
   - Unusually high transaction value (> p99 of |value|)
   - Invoice cancellation pattern (invoice id starts with `C`)
2. **Model layer.** `IsolationForest(contamination=0.02, n_estimators=200,
   random_state=42)` trained on a 50K random subsample of
   `[abs_quantity, unit_price, abs_value]`. Scores are min-max normalized
   to `[0, 1]`.
3. **Fusion.** `final_score = clip(iso_score + 0.15 × rule_hits, 0, 1)`.
   Risk level: ≥ 0.85 High, ≥ 0.60 Medium, else Low.

### Training data
The same cleaned Online Retail II transactions used elsewhere in the app.
No labels.

### Validation
**None against ground truth, because there are no labels.** The current
thresholds are heuristic. See ROADMAP for a threshold-sensitivity
notebook that will document precision @ k assumptions.

### Known limitations
- Unsupervised: anything not in the historical distribution looks
  anomalous, including legitimate bulk B2B orders.
- 99th percentile thresholds are dataset-relative — re-scoring against
  a different period will shift the cut-offs.
- IsolationForest is trained on a subsample for performance; with 1M
  rows the score depends on the subsample (mitigated by `random_state`).
- The model cannot distinguish "unusual" from "wrong" or "fraudulent" —
  outputs are review aids only.

### Disclaimer surfaced in the product
> Transaction anomaly monitoring identifies unusual transaction patterns
> based on historical data. It does not confirm fraud and should be
> treated as a review aid only.

---

## Ethical considerations

- The dataset is anonymized to the customer-id level only; no PII.
- Anomaly flags should never be presented to customers as fraud
  accusations. The product disclaimer is enforced in UI copy and in the
  `/api/transactions/summary` response.
- Inventory recommendations are based on simulated stock and must not be
  used to drive real procurement decisions.
