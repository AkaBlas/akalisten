"""This module contains pydantic models used to represent and process data retrieved from
the different APIs.

The modules in raw_api_data are exact representations of the data returned by the APIs (as far
as that's possible based on the sometimes scarce documentation). The models in this module
are higher-level abstractions/wrappers that are used to process the data and make it easier to work
with in the Jinja2 templates.
"""
