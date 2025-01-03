from collections.abc import Iterator
from contextlib import contextmanager

import httpx


@contextmanager
def response_handler(response: httpx.Response) -> Iterator[None]:
    """Context manager to handle API responses. Wrap this around the code that handles the
    API response. This does two things:

    1. Raises an exception if the response status code is not a success code.
    2. Wraps the code that parses the response in a try-except block to catch parsing errors. If
       the parsing fails, it raises a `RuntimeError` with the response content and status code.
    """
    response.raise_for_status()
    try:
        yield None
    except Exception as exc:
        raise RuntimeError(
            f"Failed to parse API response `{response.content!r}` with status "
            f"`{response.status_code}`."
        ) from exc
