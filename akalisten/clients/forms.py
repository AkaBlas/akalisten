import asyncio
import os
from collections.abc import Sequence
from contextlib import AbstractAsyncContextManager
from types import TracebackType
from typing import Literal, Self
from urllib.parse import urlencode

import httpx

from akalisten.clients._utils import response_handler
from akalisten.models.forms import FormInfo
from akalisten.models.raw_api_models.forms import CondensedForm, FullForm


class FormsAPI(AbstractAsyncContextManager):
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            auth=(os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"]),
            timeout=10,
            headers={"OCS-APIRequest": "true", "Accept": "application/json"},
        )
        self.base_url = "https://cloud.akablas.de/ocs/v2.php/apps/forms/api/v3/forms"

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self.client.aclose()

    def _build_url(
        self, endpoint: str | None = None, parameters: dict[str, str] | None = None
    ) -> str:
        url = self.base_url
        if endpoint:
            url += f"/{endpoint}"
        if parameters:
            url += f"?{urlencode(parameters)}"
        return url

    async def get_forms(self, form_type: Literal["owned", "shared"]) -> Sequence[CondensedForm]:
        response = await self.client.get(self._build_url(parameters={"type": form_type}))
        with response_handler(response):
            return [CondensedForm(**data) for data in response.json()["ocs"]["data"]]

    async def get_form(self, form_id: int) -> FullForm:
        response = await self.client.get(self._build_url(endpoint=str(form_id)))
        with response_handler(response):
            return FullForm(**response.json()["ocs"]["data"])

    async def get_all_forms(self) -> Sequence[FormInfo]:
        async with asyncio.TaskGroup() as group:
            shared_task = group.create_task(self.get_forms("shared"))
            owned_task = group.create_task(self.get_forms("owned"))

            all_forms = [
                group.create_task(self.get_form(form.id))
                for form in list(await shared_task) + list(await owned_task)
            ]

        return [FormInfo(form=form) for form in await asyncio.gather(*all_forms)]
