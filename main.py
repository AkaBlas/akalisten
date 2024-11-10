import asyncio
import datetime as dtm
import logging
import os
import zoneinfo
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from dotenv import load_dotenv
from jinja2 import FileSystemLoader
from pydantic import BaseModel

from akalisten.api_types.polls import Poll
from akalisten.clients.polls import PollAPI
from akalisten.jinja2 import RelImportEnvironment
from akalisten.polls import PollVotes

load_dotenv(override=True)


ROOT = Path(__file__).parent
DUMMY_DATA = ROOT / "dummy_data.json"
LOGS = ROOT / "logs"
LOGS.mkdir(exist_ok=True)

DEBUG_MODE = os.getenv("DEBUG") is not None

handler = TimedRotatingFileHandler(
    filename=LOGS / "akalisten.log", when="midnight", interval=1, backupCount=30, encoding="utf-8"
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.WARNING,
    handlers=[handler] if not DEBUG_MODE else [logging.StreamHandler()],
)


async def get_poll_data() -> tuple[dict[int, Poll], dict[int, PollVotes]]:
    class TempData(BaseModel):
        polls: dict[int, Poll]
        poll_votes: dict[int, PollVotes]

    if DEBUG_MODE and DUMMY_DATA.exists():
        tmp_data = TempData.model_validate_json(DUMMY_DATA.read_text(encoding="utf-8"))
    else:
        tmp_data = TempData(polls={}, poll_votes={})

        async with PollAPI() as client:
            for poll in await client.get_polls():
                if not poll.is_mucken_liste:
                    continue
                votes = await client.aggregate_poll_votes(poll.id)
                tmp_data.poll_votes[poll.id] = votes
                tmp_data.polls[poll.id] = poll

        if DEBUG_MODE:
            DUMMY_DATA.write_text(tmp_data.model_dump_json(indent=2), encoding="utf-8")

    return tmp_data.polls, tmp_data.poll_votes


async def main() -> None:
    polls, poll_votes = await get_poll_data()

    environment = RelImportEnvironment(
        loader=FileSystemLoader(ROOT / Path("akalisten/templates")),
        lstrip_blocks=True,
        trim_blocks=True,
    )
    timezone = zoneinfo.ZoneInfo("Europe/Berlin")
    (ROOT / "index.html").write_text(
        environment.get_template("hinrich/index.j2").render(
            polls=polls, poll_votes=poll_votes, now=dtm.datetime.now(timezone)
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        logging.exception(exc)
