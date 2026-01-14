import datetime as dtm
import zoneinfo
from typing import Annotated

from pydantic import AwareDatetime, BeforeValidator

TZ_INFO = zoneinfo.ZoneInfo("Europe/Berlin")


def strftime(obj: dtm.datetime | dtm.date | dtm.time, str_format: str = "%d.%m.%Y %H:%M") -> str:
    """Format a datetime object to a string using the specified format and TZ_INFO timezone."""
    if not isinstance(obj, dtm.datetime):
        return obj.strftime(str_format)
    return obj.astimezone(TZ_INFO).strftime(str_format)


def date_str_to_aware_datetime(date_str: str) -> dtm.datetime:
    """Convert a date string in the format 'YYYY-MM-DD' to an aware datetime object in
    TZ_INFO timezone."""
    return dtm.datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=TZ_INFO)


AwareDate = Annotated[
    AwareDatetime,
    BeforeValidator(lambda v: date_str_to_aware_datetime(v) if isinstance(v, str) else v),
]
