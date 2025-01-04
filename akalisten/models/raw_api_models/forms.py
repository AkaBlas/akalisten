"""Models for the polls API.
Documentation:
https://github.com/nextcloud/forms/blob/v4.3.4/docs/API_v3.md
"""

from enum import IntEnum, StrEnum
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field

from akalisten.clients._utils import OptionalDateTimeField, RequiredDateTimeField


class FormState(IntEnum):
    ACTIVE = 0
    CLOSED = 1
    ARCHIVED = 2


class ShareType(IntEnum):
    USER = 0
    GROUP = 1
    LINK = 3


class AccessObject(BaseModel):
    permitAllUsers: bool = False
    showToAllUsers: bool = False


class Permission(StrEnum):
    EDIT = "edit"
    RESULTS = "results"
    RESULTS_DELETE = "results_delete"
    SUBMIT = "submit"
    EMBED = "embed"


class Option(BaseModel):
    id: int
    questionId: int
    text: str


class ExtraSettings(BaseModel):
    allowOtherAnswer: bool | None = False
    shuffleOptions: bool | None = False
    optionsLimitMax: int | None = None
    optionsLimitMin: int | None = None
    validationType: str | None = None
    validationRegex: str | None = None
    allowedFileTypes: list[str] | None = None
    allowedFileExtensions: list[str] | None = None
    maxAllowedFilesCount: int | None = None
    maxFileSize: int | None = None


def _parse_extra_settings(value: object) -> object:
    if isinstance(value, list) and not value:
        return None
    return value


class Question(BaseModel):
    id: int
    formId: int
    order: int
    type: str
    isRequired: bool
    text: str
    name: str
    options: list[Option] = Field(default_factory=list)
    extraSettings: Annotated[ExtraSettings | None, BeforeValidator(_parse_extra_settings)] = None


class Share(BaseModel):
    id: int
    formId: int
    shareType: ShareType
    shareWith: str
    displayName: str


class Answer(BaseModel):
    id: int
    submissionId: int
    questionId: int
    text: str


class Submission(BaseModel):
    id: int
    formId: int
    userId: str
    timestamp: RequiredDateTimeField
    answers: list[Answer] = Field(default_factory=list)
    userDisplayName: str


class CondensedForm(BaseModel):
    id: int
    hash: str
    title: str
    expires: OptionalDateTimeField
    permissions: list[Permission]
    partial: bool | None = None
    state: FormState


class FullForm(CondensedForm):
    description: str
    ownerId: str
    submissionMessage: str | None = None
    created: RequiredDateTimeField
    access: AccessObject | None = None
    isAnonymous: bool
    submitMultiple: bool
    showExpiration: bool
    canSubmit: bool
    questions: list[Question] = Field(default_factory=list)
    shares: list[Share] = Field(default_factory=list)
    submissions: list[Submission] = Field(default_factory=list)
