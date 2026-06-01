from typing import Callable
from fitness_core.errors import DomainError
from tools._models import MethodResult, SkippedMethod

MethodOutput = tuple[float, dict | None]


def run_methods(
    requested: list[str],
    explicit: bool,
    compute_fn: Callable[[str], "MethodOutput | None"],
    unit: str,
    *,
    reason_fn: Callable[[str], str] | None = None,
    ndigits: int = 1,
) -> tuple[list[MethodResult], list[SkippedMethod]]:
    """Run each requested method through compute_fn, building per-method results.

    compute_fn(method) returns (value, detail) to include the method, or None to
    indicate its required inputs are missing. Under explicit=True a missing method
    raises DomainError; under explicit=False it is recorded in `skipped`. compute_fn
    may itself raise DomainError for an unknown method. Duplicate methods are ignored.
    """
    results: list[MethodResult] = []
    skipped: list[SkippedMethod] = []
    seen: set[str] = set()
    for m in requested:
        if m in seen:
            continue
        seen.add(m)
        out = compute_fn(m)
        if out is None:
            reason = reason_fn(m) if reason_fn else f"{m}: required inputs missing"
            if explicit:
                raise DomainError(reason)
            skipped.append(SkippedMethod(method=m, reason=reason))
            continue
        value, detail = out
        results.append(MethodResult(method=m, value=round(value, ndigits),
                                    unit=unit, detail=detail))
    return results, skipped
