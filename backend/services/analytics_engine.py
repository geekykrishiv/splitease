import numpy as np
from scipy import stats
from scipy.stats import norm, poisson, expon
from collections import defaultdict
from datetime import datetime


class AnalyticsEngine:
    """Statistical analytics engine for expense data."""

    def __init__(self, expenses: list):
        """
        Args:
            expenses: list of dicts with keys:
                amount, category, paid_by, date (datetime), payer_name
        """
        self.expenses = expenses

    # ── Category Breakdown (Pie Chart) ─────────────────
    def category_breakdown(self) -> list:
        categories = defaultdict(float)
        for exp in self.expenses:
            categories[exp["category"]] += exp["amount"]
        total = sum(categories.values()) or 1
        return sorted(
            [
                {
                    "category": cat,
                    "amount": round(amt, 2),
                    "percentage": round(amt / total * 100, 1),
                }
                for cat, amt in categories.items()
            ],
            key=lambda x: -x["amount"],
        )

    # ── Member Contributions (Bar Chart) ───────────────
    def member_contributions(self) -> list:
        contributions = defaultdict(lambda: {"amount": 0, "name": ""})
        for exp in self.expenses:
            uid = exp["paid_by"]
            contributions[uid]["amount"] += exp["amount"]
            contributions[uid]["name"] = exp.get("payer_name", f"User {uid}")
        return [
            {"user_id": uid, "name": d["name"], "amount": round(d["amount"], 2)}
            for uid, d in contributions.items()
        ]

    # ── Monthly Trends (Line Chart) ────────────────────
    def monthly_trends(self) -> list:
        monthly = defaultdict(float)
        for exp in self.expenses:
            month_key = exp["date"].strftime("%Y-%m")
            monthly[month_key] += exp["amount"]
        return [
            {"month": month, "amount": round(amt, 2)}
            for month, amt in sorted(monthly.items())
        ]

    # ── Sampling / Filtering ───────────────────────────
    def sample_expenses(
        self, category=None, start_date=None, end_date=None,
        member=None, min_amount=None, max_amount=None,
    ) -> list:
        filtered = self.expenses
        if category:
            filtered = [e for e in filtered if e["category"] == category]
        if start_date:
            filtered = [e for e in filtered if e["date"] >= start_date]
        if end_date:
            filtered = [e for e in filtered if e["date"] <= end_date]
        if member is not None:
            filtered = [e for e in filtered if e["paid_by"] == member]
        if min_amount is not None:
            filtered = [e for e in filtered if e["amount"] >= min_amount]
        if max_amount is not None:
            filtered = [e for e in filtered if e["amount"] <= max_amount]
        return filtered

    def get_unique_categories(self) -> list:
        return sorted(set(e["category"] for e in self.expenses))

    # ── Simple Linear Regression ───────────────────────
    def simple_linear_regression(self) -> dict | None:
        monthly = self.monthly_trends()
        if len(monthly) < 3:
            return None

        x = np.arange(len(monthly))
        y = np.array([m["amount"] for m in monthly])

        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

        return {
            "slope": round(float(slope), 2),
            "intercept": round(float(intercept), 2),
            "r_value": round(float(r_value), 4),
            "r_squared": round(float(r_value ** 2), 4),
            "p_value": round(float(p_value), 6),
            "std_err": round(float(std_err), 4),
            "months": [m["month"] for m in monthly],
            "actual": [m["amount"] for m in monthly],
            "predicted": [round(float(intercept + slope * i), 2) for i in x],
            "next_month_prediction": round(float(intercept + slope * len(monthly)), 2),
        }

    # ── Multiple Linear Regression ─────────────────────
    def multiple_linear_regression(self) -> dict | None:
        monthly_cats = defaultdict(lambda: defaultdict(float))
        all_categories = set()
        for exp in self.expenses:
            month_key = exp["date"].strftime("%Y-%m")
            monthly_cats[month_key][exp["category"]] += exp["amount"]
            all_categories.add(exp["category"])

        if len(monthly_cats) < 3 or len(all_categories) < 2:
            return None

        categories = sorted(all_categories)
        months = sorted(monthly_cats.keys())

        X = []
        y = []
        for month in months:
            row = [monthly_cats[month].get(cat, 0) for cat in categories]
            X.append(row)
            y.append(sum(monthly_cats[month].values()))

        X = np.array(X, dtype=float)
        y = np.array(y, dtype=float)

        X_aug = np.column_stack([np.ones(len(X)), X])

        try:
            coefficients, _, _, _ = np.linalg.lstsq(X_aug, y, rcond=None)
            y_pred = X_aug @ coefficients
            ss_res = np.sum((y - y_pred) ** 2)
            ss_tot = np.sum((y - np.mean(y)) ** 2)
            r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

            return {
                "categories": categories,
                "coefficients": {
                    cat: round(float(c), 4)
                    for cat, c in zip(categories, coefficients[1:])
                },
                "intercept": round(float(coefficients[0]), 4),
                "r_squared": round(float(r_squared), 4),
                "formula": "Expense = {:.2f}".format(coefficients[0])
                + "".join(
                    " + {:.2f}×{}".format(c, cat)
                    for cat, c in zip(categories, coefficients[1:])
                ),
                "months": months,
                "actual": [round(float(v), 2) for v in y],
                "predicted": [round(float(v), 2) for v in y_pred],
            }
        except Exception:
            return None

    # ── Correlation Analysis ───────────────────────────
    def correlation_analysis(self) -> dict | None:
        monthly_cats = defaultdict(lambda: defaultdict(float))
        all_categories = set()
        for exp in self.expenses:
            month_key = exp["date"].strftime("%Y-%m")
            monthly_cats[month_key][exp["category"]] += exp["amount"]
            all_categories.add(exp["category"])

        if len(monthly_cats) < 3 or len(all_categories) < 2:
            return None

        categories = sorted(all_categories)
        months = sorted(monthly_cats.keys())

        data = {}
        for cat in categories:
            data[cat] = [monthly_cats[month].get(cat, 0) for month in months]

        matrix = {}
        for cat1 in categories:
            matrix[cat1] = {}
            for cat2 in categories:
                try:
                    r, p = stats.pearsonr(data[cat1], data[cat2])
                    matrix[cat1][cat2] = {
                        "r": round(float(r), 4),
                        "p": round(float(p), 6),
                    }
                except Exception:
                    matrix[cat1][cat2] = {"r": 0, "p": 1}

        return {"categories": categories, "matrix": matrix}

    # ── Partial Correlation ────────────────────────────
    def partial_correlation(self) -> dict | None:
        monthly_cats = defaultdict(lambda: defaultdict(float))
        all_categories = set()
        for exp in self.expenses:
            month_key = exp["date"].strftime("%Y-%m")
            monthly_cats[month_key][exp["category"]] += exp["amount"]
            all_categories.add(exp["category"])

        categories = sorted(all_categories)
        months = sorted(monthly_cats.keys())

        if len(months) < 4 or len(categories) < 3:
            return None

        data_matrix = np.array(
            [[monthly_cats[m].get(c, 0) for c in categories] for m in months]
        )

        try:
            cov = np.cov(data_matrix.T)
            precision = np.linalg.inv(cov)
            d = np.sqrt(np.diag(precision))
            partial = -precision / np.outer(d, d)
            np.fill_diagonal(partial, 1)

            result = {}
            for i, c1 in enumerate(categories):
                result[c1] = {}
                for j, c2 in enumerate(categories):
                    result[c1][c2] = round(float(partial[i, j]), 4)

            return {"categories": categories, "matrix": result}
        except Exception:
            return None

    # ── Maximum Likelihood Estimation ──────────────────
    def mle_analysis(self) -> dict | None:
        if len(self.expenses) < 5:
            return None

        amounts = [e["amount"] for e in self.expenses]

        # Normal distribution MLE
        mu, sigma = norm.fit(amounts)

        # Exponential: time between expenses
        dates = sorted([e["date"] for e in self.expenses])
        time_diffs = []
        for i in range(1, len(dates)):
            diff = (dates[i] - dates[i - 1]).total_seconds() / 3600
            if diff > 0:
                time_diffs.append(diff)

        exp_lambda = (
            1 / np.mean(time_diffs) if time_diffs and np.mean(time_diffs) > 0 else 0
        )

        # Poisson: transactions per day
        daily_counts = defaultdict(int)
        for exp in self.expenses:
            day_key = exp["date"].strftime("%Y-%m-%d")
            daily_counts[day_key] += 1
        counts = list(daily_counts.values())
        poisson_lambda = float(np.mean(counts)) if counts else 0

        return {
            "normal": {
                "mu": round(float(mu), 2),
                "sigma": round(float(sigma), 2),
                "description": f"Expenses follow N(μ=₹{round(mu, 2)}, σ=₹{round(sigma, 2)})",
            },
            "exponential": {
                "lambda": round(float(exp_lambda), 6),
                "mean_hours": round(
                    float(1 / exp_lambda if exp_lambda > 0 else 0), 2
                ),
                "description": "Avg {:.1f} hours between expenses".format(
                    1 / exp_lambda if exp_lambda > 0 else 0
                ),
            },
            "poisson": {
                "lambda": round(float(poisson_lambda), 2),
                "description": f"Avg {round(poisson_lambda, 1)} transactions/day",
            },
            "amount_histogram": _histogram(amounts, 10),
        }

    # ── T-Test Analysis ────────────────────────────────
    def t_test_analysis(self) -> dict | None:
        results = {}

        # ── Paired T-Test: first half vs second half months ──
        monthly = defaultdict(float)
        for exp in self.expenses:
            month_key = exp["date"].strftime("%Y-%m")
            monthly[month_key] += exp["amount"]

        months = sorted(monthly.keys())
        if len(months) >= 4:
            mid = len(months) // 2
            first_half = [monthly[m] for m in months[:mid]]
            second_half = [monthly[m] for m in months[mid : mid + len(first_half)]]

            if len(first_half) == len(second_half) and len(first_half) >= 2:
                t_stat, p_value = stats.ttest_rel(first_half, second_half)
                results["paired"] = {
                    "t_statistic": round(float(t_stat), 4),
                    "p_value": round(float(p_value), 6),
                    "significant": bool(p_value < 0.05),
                    "first_period": {
                        "months": months[:mid],
                        "values": [round(v, 2) for v in first_half],
                        "mean": round(float(np.mean(first_half)), 2),
                    },
                    "second_period": {
                        "months": months[mid : mid + len(first_half)],
                        "values": [round(v, 2) for v in second_half],
                        "mean": round(float(np.mean(second_half)), 2),
                    },
                    "description": "First half vs second half of months",
                }

        # ── Independent T-Test: top two categories ──
        categories = defaultdict(list)
        for exp in self.expenses:
            categories[exp["category"]].append(exp["amount"])

        cats_by_count = sorted(categories.keys(), key=lambda c: -len(categories[c]))
        if len(cats_by_count) >= 2:
            cat1, cat2 = cats_by_count[0], cats_by_count[1]
            if len(categories[cat1]) >= 2 and len(categories[cat2]) >= 2:
                t_stat, p_value = stats.ttest_ind(categories[cat1], categories[cat2])
                results["independent"] = {
                    "t_statistic": round(float(t_stat), 4),
                    "p_value": round(float(p_value), 6),
                    "significant": bool(p_value < 0.05),
                    "group1": {
                        "category": cat1,
                        "mean": round(float(np.mean(categories[cat1])), 2),
                        "n": len(categories[cat1]),
                    },
                    "group2": {
                        "category": cat2,
                        "mean": round(float(np.mean(categories[cat2])), 2),
                        "n": len(categories[cat2]),
                    },
                    "description": f"Comparing {cat1} vs {cat2} expense amounts",
                }

        return results if results else None


def _histogram(values: list, bins: int = 10) -> list:
    """Create histogram data for chart rendering."""
    if not values:
        return []
    counts, edges = np.histogram(values, bins=bins)
    return [
        {
            "bin": f"₹{round(float(edges[i]))}-{round(float(edges[i + 1]))}",
            "count": int(counts[i]),
            "min": round(float(edges[i]), 2),
            "max": round(float(edges[i + 1]), 2),
        }
        for i in range(len(counts))
    ]
