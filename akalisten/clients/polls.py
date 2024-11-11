import os
from collections.abc import Iterator, Sequence
from contextlib import AbstractAsyncContextManager, contextmanager
from types import TracebackType
from typing import Optional

import httpx

from akalisten.api_types.polls import Poll, PollOption, PollVote
from akalisten.polls import PollVotes


@contextmanager
def _response_handler(response: httpx.Response) -> Iterator[None]:
    response.raise_for_status()
    try:
        yield None
    except Exception as exc:
        raise RuntimeError(
            f"Failed to parse API response `{response.content!r}` with status "
            f"`{response.status_code}`."
        ) from exc


class PollAPI(AbstractAsyncContextManager):
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            auth=(os.environ["USERNAME"], os.environ["PASSWORD"]), timeout=10
        )
        self.base_url = "https://cloud.akablas.de/index.php/apps/polls/api/v1.0/"

    async def __aenter__(self) -> "PollAPI":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        await self.client.aclose()

    async def get_polls(self) -> Sequence[Poll]:
        response = await self.client.get(self.base_url + "polls")
        with _response_handler(response):
            return [Poll(**poll) for poll in response.json()["polls"]]

    async def get_poll(self, poll_id: int) -> Poll:
        response = await self.client.get(self.base_url + f"poll/{poll_id}")
        with _response_handler(response):
            return Poll(**response.json())

    async def get_poll_options(self, poll_id: int) -> Sequence[PollOption]:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/options")
        with _response_handler(response):
            return [PollOption(**option) for option in response.json()["options"]]

    async def get_poll_votes(self, poll_id: int) -> Sequence[PollVote]:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/votes")
        with _response_handler(response):
            return [PollVote(**vote) for vote in response.json()["votes"]]

    async def aggregate_poll_votes(self, poll_id: int) -> PollVotes:
        votes = await self.get_poll_votes(poll_id)
        options = await self.get_poll_options(poll_id)
        poll_votes = PollVotes(poll_id=poll_id)

        for option in options:
            poll_votes.add_option(option)
        for vote in votes:
            poll_votes.add_vote(vote)

        return poll_votes
