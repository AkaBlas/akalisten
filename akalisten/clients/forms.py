import asyncio
import os
from collections.abc import Sequence
from typing import Literal

from akalisten.clients._utils import BaseAPI
from akalisten.models.forms import FormInfo
from akalisten.models.raw_api_models.forms import CondensedForm, FullForm


class FormsAPI(BaseAPI):
    def __init__(self) -> None:
        super().__init__(
            base_url="https://cloud.akablas.de/ocs/v2.php/apps/forms/api/v3/forms",
            httpx_kwargs={
                "auth": (os.environ["NC_USERNAME"], os.environ["NC_PASSWORD"]),
                "headers": {"OCS-APIRequest": "true", "Accept": "application/json"},
            },
        )

    async def get_forms(self, form_type: Literal["owned", "shared"]) -> Sequence[CondensedForm]:
        async with self.json_content("", params={"type": form_type}) as json:
            return [CondensedForm(**data) for data in json["ocs"]["data"]]

    async def get_form(self, form_id: int) -> FullForm:
        async with self.json_content(str(form_id)) as json:
            return FullForm(**json["ocs"]["data"])

    async def get_all_forms(self) -> Sequence[FormInfo]:
        async with asyncio.TaskGroup() as group:
            shared_task = group.create_task(self.get_forms("shared"))
            owned_task = group.create_task(self.get_forms("owned"))

            all_forms = [
                group.create_task(self.get_form(form.id))
                for form in list(await shared_task) + list(await owned_task)
            ]

        return [FormInfo(form=form) for form in await asyncio.gather(*all_forms)]
