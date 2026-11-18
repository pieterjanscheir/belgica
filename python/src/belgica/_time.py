"""Days, validity periods and coverage: how records relate to time"""

import re
from collections.abc import Callable, Iterable, Mapping, Sequence
from datetime import UTC, date, datetime, timedelta
from typing import TypeAlias, TypeVar, cast

Day: TypeAlias = date | str
"""A day: a `date` (a `datetime` is read as its calendar day) or a 'YYYY-MM-DD' string"""

# A record: a TypedDict, with a `validFrom` and a `validTo` or not
R = TypeVar('R', bound=Mapping[str, object])

_DAY = re.compile(r'^(\d{4})-(\d{2})-(\d{2})(?:$|T)')


def to_day(day: Day) -> str:
    """A day as YYYY-MM-DD. A string must start with a valid YYYY-MM-DD day (a time after it is
    ignored): days are compared as strings, so '2013-1-15' would silently fall in the wrong
    period. Raises `ValueError` otherwise."""
    if isinstance(day, datetime):
        return day.date().isoformat()
    if isinstance(day, date):
        return day.isoformat()
    match = _DAY.match(day)
    try:
        if match is None:
            raise ValueError
        date(*(int(part) for part in match.groups()))
    except ValueError:
        raise ValueError(f"Expected a day as YYYY-MM-DD, got '{day}'") from None
    return day[:10]


def _last_sunday_at_1_utc(year: int, month: int) -> datetime:
    """01:00 UTC on the last Sunday of a month, when EU summer time starts or ends"""
    first_of_next = datetime(year + month // 12, month % 12 + 1, 1, 1, tzinfo=UTC)
    last_day = first_of_next - timedelta(days=1)
    # weekday(): Monday is 0, Sunday 6
    return last_day - timedelta(days=(last_day.weekday() + 1) % 7)


def today(now: datetime | None = None) -> str:
    """Today in Belgium as YYYY-MM-DD, whatever the machine's time zone: the day the lookups
    default to. Belgian legal time is UTC+1, and UTC+2 from 01:00 UTC on the last Sunday of March
    to 01:00 UTC on the last Sunday of October (EU Directive 2000/84/EC), computed here rather
    than with zoneinfo, which needs the tzdata package on Windows. `now` must be aware."""
    now = datetime.now(UTC) if now is None else now.astimezone(UTC)
    summer = _last_sunday_at_1_utc(now.year, 3) <= now < _last_sunday_at_1_utc(now.year, 10)
    return (now + timedelta(hours=2 if summer else 1)).date().isoformat()


def _day(record: Mapping[str, object], key: str) -> str | None:
    return cast(str | None, record.get(key))


def applies_on(record: Mapping[str, object], day: str) -> bool:
    """Whether a record applies on a day (YYYY-MM-DD), by its `validFrom` and `validTo`"""
    valid_from = _day(record, 'validFrom')
    valid_to = _day(record, 'validTo')
    return (valid_from is None or valid_from <= day) and (valid_to is None or day <= valid_to)


def versions_by(items: Iterable[R], key_of: Callable[[R], str | None]) -> dict[str, list[R]]:
    """Every version of the records that share a key, oldest first"""
    found: dict[str, list[R]] = {}
    for item in items:
        key = key_of(item)
        if key is not None:
            found.setdefault(key, []).append(item)
    for versions in found.values():
        versions.sort(key=lambda record: _day(record, 'validFrom') or '')
    return found


def versions_by_id(items: Iterable[R]) -> dict[str, list[R]]:
    return versions_by(items, lambda item: cast(str, item['id']))


def current_version(versions: Sequence[R], day: str) -> R | None:
    """A record's version as of a day: the one that applies; for a record that has ended, its last
    version; for one that hasn't started, its first"""
    for version in reversed(versions):
        if (_day(version, 'validFrom') or '') <= day:
            return version
    return versions[0] if versions else None


def lookup_day(on: Day | None, coverage_from: str, dataset: str) -> str:
    """The day to look up, checked against the first day a dataset describes: before it, the data
    can't say, and a guess would look like an answer"""
    day = today() if on is None else to_day(on)
    if day < coverage_from:
        raise ValueError(
            f'The {dataset} data describes {coverage_from} onwards; {day} is before that'
        )
    return day


def pick_version(
    versions: Sequence[R] | None, on: Day | None, coverage_from: str, dataset: str
) -> R | None:
    """With `on`, the version that applies on that day, if any. Without, today's version: a known
    id always finds a record, and the same one the lists give today."""
    if on is not None:
        day = lookup_day(on, coverage_from, dataset)
        return next((record for record in versions or () if applies_on(record, day)), None)
    return current_version(versions, today()) if versions else None


def applying_on(records: Iterable[R], on: Day | None, coverage_from: str, dataset: str) -> list[R]:
    """The records that apply on the day asked for, today by default"""
    day = lookup_day(on, coverage_from, dataset)
    return [record for record in records if applies_on(record, day)]
