import os
from collections.abc import Sequence
from typing import Literal

from akalisten.clients._utils import BaseAPI
from akalisten.models.setlists import Setlist


class SetlistAPI(BaseAPI):
    def __init__(self) -> None:
        super().__init__(
            base_url="https://cloud.akablas.de/ocs/v2.php/apps/orchestrascoresmanager",
            httpx_kwargs={
                "auth": (os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"]),
                "headers": {"OCS-APIRequest": "true", "Accept": "application/json"},
            },
        )

    async def get_setlists(
        self, query_filter: Literal["all", "future", "past"] = "past"
    ) -> Sequence[Setlist]:
        async with self.json_content("setlists", {"filter": query_filter}) as json:
            return [Setlist(**setlist) for setlist in json["ocs"]["data"]]
