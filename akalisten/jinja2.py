"""Custom Jinja2 extensions."""

from pathlib import Path

from jinja2 import Environment


class RelImportEnvironment(Environment):
    """Override join_path() to enable relative template paths."""

    def join_path(self, template: str, parent: str) -> str:
        """
        template: Path of the template to be loaded, as written in the "include" statement.
        parent: Path of the template that includes the template to be loaded.
        """
        return (Path(parent).parent / template).as_posix()
