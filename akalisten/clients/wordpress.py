import os

from akalisten.clients._utils import BaseAPI


class WordPressAPI(BaseAPI):
    def __init__(self) -> None:
        super().__init__(
            base_url="https://akablas.de/wp-json/wp/v2/",
            httpx_kwargs={"auth": (os.environ["WP_USERNAME"], os.environ["WP_PASSWORD"])},
        )

    async def edit_page(self, page_id: int, content: str) -> None:
        await self.request(
            method="POST", endpoint=f"pages/{page_id}", httpx_kwargs={"json": {"content": content}}
        )
