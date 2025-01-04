import asyncio
import os
from collections.abc import Sequence
from contextlib import AbstractAsyncContextManager
from types import TracebackType
from typing import Self
from urllib.parse import urlencode

import httpx

from akalisten.clients._utils import response_handler
from akalisten.models.general import User
from akalisten.models.raw_api_models.circles import Circle, CircleMember, MemberStatus, UserType
from akalisten.models.register import RegisterCircle, Registers


class CirclesAPI(AbstractAsyncContextManager):
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            auth=(os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"]),
            timeout=10,
            headers={"OCS-APIRequest": "true"},
        )
        self.base_url = "https://cloud.akablas.de/ocs/v2.php/apps/circles/"

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self.client.aclose()

    def _build_url(self, endpoint: str, params: dict[str, str] | None = None) -> str:
        url = self.base_url + endpoint
        params = (params or {}) | {"format": "json"}
        if params:
            url += "?" + urlencode(params)
        return url

    async def get_circles(self) -> Sequence[Circle]:
        response = await self.client.get(self._build_url("circles"))
        with response_handler(response):
            return [Circle(**data) for data in response.json()["ocs"]["data"]]

    async def get_circle_details(self, circle_id: str) -> Circle:
        response = await self.client.get(self._build_url(f"circles/{circle_id}"))
        with response_handler(response):
            return Circle(**response.json()["ocs"]["data"])

    async def get_circle_members(self, circle_id: str) -> Sequence[CircleMember]:
        response = await self.client.get(self._build_url(f"circles/{circle_id}/members"))
        with response_handler(response):
            return [CircleMember(**data) for data in response.json()["ocs"]["data"]]

    async def aggregate_registers(self) -> Registers:
        circles = await self.get_circles()
        relevant_circles = {
            circle.id: circle for circle in circles if circle.name.startswith("Register ")
        }
        async with asyncio.TaskGroup() as group:
            members = {
                circle_id: group.create_task(self.get_circle_members(circle_id))
                for circle_id in relevant_circles
            }

        return Registers(
            registers=[
                RegisterCircle(
                    name=circle.name,
                    id=circle.id,
                    members={
                        User(name=member.basedOn.displayName, id=member.userId)
                        for member in members[circle.id].result()
                        if member.status == MemberStatus.MEMBER
                        and member.userType == UserType.USER
                    },
                )
                for circle in relevant_circles.values()
            ]
        )
