import asyncio
import os
from collections.abc import Sequence

from akalisten.clients._utils import BaseAPI
from akalisten.models.general import User
from akalisten.models.raw_api_models.circles import Circle, CircleMember, MemberStatus, UserType
from akalisten.models.register import RegisterCircle, Registers


class CirclesAPI(BaseAPI):
    def __init__(self) -> None:
        super().__init__(
            base_url="https://cloud.akablas.de/ocs/v2.php/apps/circles/",
            httpx_kwargs={
                "auth": (os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"]),
                "headers": {"OCS-APIRequest": "true"},
            },
        )

    def build_url(self, endpoint: str, params: dict[str, str] | None = None) -> str:
        return super().build_url(endpoint=endpoint, params=(params or {}) | {"format": "json"})

    async def get_circles(self) -> Sequence[Circle]:
        async with self.json_content("circles") as json:
            return [Circle(**data) for data in json["ocs"]["data"]]

    async def get_circle_details(self, circle_id: str) -> Circle:
        async with self.json_content(f"circles/{circle_id}") as json:
            return Circle(**json["ocs"]["data"])

    async def get_circle_members(self, circle_id: str) -> Sequence[CircleMember]:
        async with self.json_content(f"circles/{circle_id}/members") as json:
            return [CircleMember(**data) for data in json["ocs"]["data"]]

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
