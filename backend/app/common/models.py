from pydantic import BaseModel
from typing import Literal, Union, Optional


class TextNode(BaseModel):
    type: Literal["TEXT_NODE"]
    text: str
    isVisible: bool


class ElementNode(BaseModel):
    type: Literal["ELEMENT_NODE"]
    tagName: str
    attributes: dict[str, str]
    xpath: str
    children: list[str]
    isVisible: bool
    isTopElement: bool | None = None
    isInteractive: bool | None = None
    isInViewport: bool | None = None
    highlightIndex: int | None = None


class PageDom(BaseModel):
    rootId: str
    map: dict[str, Union[TextNode, ElementNode]]


class AgentRequest(BaseModel):
    dom: PageDom
    prompt: str
    history: str | None = None
    screenshot: str | None = None
    agentMode: str | None = None
    jobApplicationData: dict | None = None
    email: str


class AgentResponse(BaseModel):
    highlightIndex: int
    action: str
    value: str | None = None
    history: str


class HistoryStep(BaseModel):
    step_number: int
    action: str
    value: Optional[str] = None
    summary: str
    screenshot: Optional[str] = None


class EnrichRequest(BaseModel):
    prompt: str
    agentMode: str | None = None


class EnrichResponse(BaseModel):
    prompt: str


class StripeRequest(BaseModel):
    email: str
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None
    return_url: Optional[str] = None
