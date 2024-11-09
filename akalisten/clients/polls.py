import os
from collections.abc import Sequence
from contextlib import AbstractAsyncContextManager
from types import TracebackType
from typing import Optional

import httpx

from akalisten.api_types.polls import Poll, PollOption, PollVote
from akalisten.polls import PollVotes


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
        return [Poll(**poll) for poll in response.json()["polls"]]

    async def get_poll(self, poll_id: int) -> Poll:
        response = await self.client.get(self.base_url + f"poll/{poll_id}")
        return Poll(**response.json())

    async def get_poll_options(self, poll_id: int) -> Sequence[PollOption]:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/options")
        return [PollOption(**option) for option in response.json()["options"]]

    async def get_poll_votes(self, poll_id: int) -> Sequence[PollVote]:
        response = await self.client.get(self.base_url + f"poll/{poll_id}/votes")
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
