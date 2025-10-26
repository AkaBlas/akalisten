"""Models for the polls API.
OCS endpoints:
https://github.com/nextcloud/circles/blob/v30.0.4/appinfo/routes.php
See also https://github.com/nextcloud/circles/issues/1818

NOTE: Everything is reverse-engineered from the API responses.
"""

from enum import IntEnum, StrEnum

from pydantic import BaseModel

from akalisten.clients._utils import OptionalDateTimeField, RequiredDateTimeField

# ==============================
# Enums
# ==============================


class UserType(IntEnum):
    SINGLE = 0
    USER = 1
    GROUP = 2
    MAIL = 4
    CONTACT = 8
    CIRCLE = 16
    APP = 10000


class MemberLevel(IntEnum):
    NONE = 0
    MEMBER = 1
    MODERATOR = 4
    ADMIN = 8
    OWNER = 9


class MemberStatus(StrEnum):
    INVITED = "Invited"
    REQUEST = "Requesting"
    MEMBER = "Member"
    BLOCKED = "Blocked"


class CircleSource(IntEnum):
    NEXTCLOUD_ACCOUNT = 1
    NEXTCLOUD_GROUP = 2
    EMAIL_ADDRESS = 4
    CONTACT = 8
    CIRCLE = 16
    NEXTCLOUD_APP = 10000
    CIRCLES_APP = 10001
    ADMIN_COMMAND_LINE = 10002
    THIRD_PARTY_APP = 11000
    COLLECTIVES_APP = 11010


# ==============================
# Models
# ==============================


class Inheritance(BaseModel):
    circleConfig: int
    circleId: str
    inheritanceDepth: int
    inheritanceFirst: str
    inheritanceLast: str
    inheritancePath: list[str]
    level: MemberLevel
    singleId: str


class InheritedBy(BaseModel):
    displayName: str
    id: str
    inheritance: Inheritance
    instance: str
    userId: str
    userType: UserType


class BasedOn(BaseModel):
    config: int
    creation: OptionalDateTimeField
    description: str
    displayName: str
    id: str
    initiator: dict | None = None
    name: str
    population: int
    sanitizedName: str
    source: CircleSource
    url: str


class InvitedBy(BaseModel):
    basedOn: BasedOn
    displayName: str
    id: str
    instance: str
    userId: str
    userType: UserType


class Notes(BaseModel):
    invitedBy: InvitedBy


class Member(BaseModel):
    basedOn: BasedOn | None = None
    circleId: str
    contactId: str
    contactMeta: str
    displayName: str
    displayUpdate: RequiredDateTimeField
    id: str
    inheritedBy: InheritedBy | None = None
    instance: str
    invitedBy: InvitedBy
    joined: RequiredDateTimeField
    level: MemberLevel
    local: bool
    notes: Notes
    singleId: str
    status: MemberStatus
    userId: str
    userType: UserType


class Settings(BaseModel):
    population: int
    populationInherited: int


class Circle(BaseModel):
    config: int
    creation: RequiredDateTimeField
    description: str
    displayName: str
    id: str
    initiator: Member
    name: str
    owner: Member
    population: int
    sanitizedName: str
    settings: Settings
    source: CircleSource
    url: str


class CircleMember(BaseModel):
    basedOn: BasedOn
    circle: Circle | None = None
    circleId: str
    contactId: str
    displayName: str
    displayUpdate: RequiredDateTimeField
    id: str
    instance: str
    invitedBy: InvitedBy
    joined: RequiredDateTimeField
    level: MemberLevel
    local: bool
    notes: Notes
    singleId: str
    status: MemberStatus
    userId: str
    userType: UserType
