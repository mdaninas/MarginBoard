# ADR-0001 — Why GradientBoostingRegressor for revenue forecast

- **Status:** Accepted
- **Date:** 2026-05-26
- **Supersedes:** n/a

## Context

I need a 30-day daily revenue forecast served from a FastAPI endpoint. The
training data is the Online Retail II dataset — roughly 24 months of daily
revenue, with pronounced weekly seasonality and a long tail of zero-revenue
days (weekends, holidays).

Constraints I care about:

1. **Explainability.** I need to defend the model to a portfolio reviewer
   without hand-waving. The model has to be inspectable.
2. **Stability.** Hyperparameter sensitivity on 24 months of data should be
   low. Anything that needs heavy tuning is the wrong tool.
3. **Deployment cost.** No extra dependencies beyond the scikit-learn stack
   already in the backend. No Stan, no Prophet, no Conda.

## Decision

Use `sklearn.ensemble.GradientBoostingRegressor` with calendar + lag
features. Parameters:

```
n_estimators=300, learning_rate=0.05, max_depth=3, random_state=42
```

Features: day-of-week, month, week-of-year, is-weekend, lag-1, lag-7,
rolling-7 / 14 / 30 day means.

Validation: `TimeSeriesSplit(n_splits=5)`, report mean ± std for MAE / MAPE.

## Alternatives considered

- **Naive baselines** (last-value, mean, seasonal-naive). Included in the
  comparison notebook as a floor. Seasonal-naive surprisingly competitive,
  which is why I kept it in the methodology narrative.
- **SARIMA(1,1,1)(1,1,1,7).** Reasonable on weekly-seasonal daily series, but
  brings `statsmodels` into the runtime path and is slower to refit. Kept in
  the notebook for comparison.
- **LightGBM.** A close substitute for gradient boosting; in early
  experiments the MAE difference was within noise. The extra binary
  dependency and runtime overhead weren't worth it for the v1 scope.
- **Prophet.** Built for the trend-plus-seasonality decomposition pattern,
  but this dataset has weak trend and very strong calendar effects.
  Heavier dependency, more tuning, and harder to explain to a non-DS reviewer.

## Consequences

- The model is easy to retrain on a single machine in under a minute. The
  artifact (~3 MB joblib) is small enough to ship with each container build.
- Iterative inference accumulates error along the 30-day horizon. The
  notebook documents this; in production I'd consider direct multi-step
  (one model per horizon) if accuracy mattered more.
- Confidence intervals are not produced. Bootstrapping residuals is a
  follow-up (tracked in the roadmap).
- The decision should be revisited if the data grows past ~5 years or the
  series becomes multi-product. At that point a hierarchical approach or
  a temporal-fusion-transformer-style model could pay back its complexity.
