import os
from contextlib import AbstractAsyncContextManager
from types import TracebackType

import httpx


class WordPressAPI(AbstractAsyncContextManager):
    def __init__(self) -> None:
        self.client = httpx.AsyncClient(
            auth=(os.environ["WP_USERNAME"], os.environ["WP_PASSWORD"]), timeout=10
        )
        self.base_url = "https://akablas.de/"

    async def __aenter__(self) -> "WordPressAPI":
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self.client.aclose()

    async def edit_page(self, page_id: int, content: str) -> None:
        response = await self.client.post(
            self.base_url + f"wp-json/wp/v2/pages/{page_id}", json={"content": content}
        )
        response.raise_for_status()
