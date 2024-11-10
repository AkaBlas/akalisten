import asyncio
import datetime as dtm
import logging
import os
import zoneinfo
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path

from dotenv import load_dotenv
from jinja2 import Environment, FileSystemLoader
from pydantic import BaseModel

from akalisten.api_types.polls import Poll
from akalisten.clients.polls import PollAPI
from akalisten.polls import PollVotes

load_dotenv(override=True)


ROOT = Path(__file__).parent
LOGS = ROOT / "logs"
LOGS.mkdir(exist_ok=True)

handler = TimedRotatingFileHandler(
    filename=LOGS / "akalisten.log", when="midnight", interval=1, backupCount=30, encoding="utf-8"
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.WARNING,
    handlers=[handler],
)


async def get_poll_data() -> tuple[dict[int, Poll], dict[int, PollVotes]]:
    class TestData(BaseModel):
        polls: dict[int, Poll]
        poll_votes: dict[int, PollVotes]

    if os.getenv("DUMMY_DATA") is not None:
        test_data = TestData.model_validate_json(
            Path("dummy_data.json").read_text(encoding="utf-8")
        )
    else:
        test_data = TestData(polls={}, poll_votes={})

        async with PollAPI() as client:
            for poll in await client.get_polls():
                if not poll.is_mucken_liste:
                    continue
                votes = await client.aggregate_poll_votes(poll.id)
                test_data.poll_votes[poll.id] = votes
                test_data.polls[poll.id] = poll

        # Path("dummy_data.json").write_text(test_data.model_dump_json(indent=2), encoding="utf-8")

    return test_data.polls, test_data.poll_votes


async def main() -> None:
    polls, poll_votes = await get_poll_data()

    environment = Environment(
        loader=FileSystemLoader(ROOT / Path("akalisten/templates")),
        lstrip_blocks=True,
        trim_blocks=True,
    )
    timezone = zoneinfo.ZoneInfo("Europe/Berlin")
    (ROOT / "index.html").write_text(
        environment.get_template("hinrich.j2").render(
            polls=polls, poll_votes=poll_votes, now=dtm.datetime.now(timezone)
        ),
        encoding="utf-8",
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        logging.exception(exc)
