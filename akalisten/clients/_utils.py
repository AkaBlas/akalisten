import datetime as dtm
from abc import ABC
from collections.abc import AsyncIterator
from contextlib import AbstractAsyncContextManager, asynccontextmanager
from types import TracebackType
from typing import Annotated, Any, Self
from urllib.parse import urlencode

import httpx
import httpx_retries
from pydantic import BeforeValidator


def _parse_datetime(value: str | int) -> str | int | None:
    if value in [0, "0"]:
        return None
    return value


OptionalDateTimeField = Annotated[dtm.datetime | None, BeforeValidator(_parse_datetime)]
RequiredDateTimeField = Annotated[dtm.datetime, BeforeValidator(_parse_datetime)]


class BaseAPI(AbstractAsyncContextManager, ABC):
    """Simple base class for API clients using the `httpx` library."""

    def __init__(self, base_url: str, httpx_kwargs: dict[str, Any] | None = None) -> None:
        self._client = httpx.AsyncClient(
            timeout=30,
            transport=httpx_retries.RetryTransport(retry=httpx_retries.Retry(total=5)),
            **(httpx_kwargs or {}),
        )
        self._base_url: str = base_url

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        await self._client.aclose()

    def build_url(self, endpoint: str, params: dict[str, str] | None = None) -> str:
        url = self._base_url
        if endpoint:
            url += f"/{endpoint}"
        if params:
            url += f"?{urlencode(params)}"
        return url

    async def request(
        self,
        method: str,
        endpoint: str,
        params: dict[str, str] | None = None,
        httpx_kwargs: dict[str, Any] | None = None,
    ) -> httpx.Response:
        response = await self._client.request(
            method, self.build_url(endpoint, params), **(httpx_kwargs or {})
        )
        response.raise_for_status()
        return response

    async def get(
        self,
        endpoint: str,
        params: dict[str, str] | None = None,
        httpx_kwargs: dict[str, Any] | None = None,
    ) -> httpx.Response:
        return await self.request("GET", endpoint, params, httpx_kwargs)

    @asynccontextmanager
    async def json_content(
        self,
        endpoint: str,
        params: dict[str, str] | None = None,
        httpx_kwargs: dict[str, Any] | None = None,
    ) -> AsyncIterator[Any]:
        """Context manager to handle API responses. Wrap this around the code that handles the
        API response. This does two things:

        1. Raises an exception if the response status code is not a success code.
        2. Wraps the code that parses the response in a try-except block to catch parsing errors.
           If the parsing fails, it raises a `RuntimeError` with the response content and status
           code.

        Example:
            .. code-block:: python

                async with self.json_content("endpoint") as json:
                    assert json["expected_key"] == "expected_value"

        Returns:
            The JSON content of the API response.
        """
        response = await self.get(endpoint, params, httpx_kwargs)
        try:
            yield response.json()
        except Exception as exc:
            raise RuntimeError(
                f"Failed to parse API response `{response.content!r}` with status "
                f"`{response.status_code}`."
            ) from exc
