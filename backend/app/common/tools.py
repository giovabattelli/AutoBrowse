from typing import Literal
from langchain_core.tools import tool


@tool
def click_element(highlight_index: int, description: str = "") -> str:
    """
    Click an interactive element using its highlightIndex. Use for buttons, links, checkboxes,
    or any clickable UI component that has a valid highlightIndex and is visibly interactive.
    Only use if the element is clearly meant to be clicked.
    """
    return f"Clicked element {highlight_index}: {description}"


@tool
def input_text(highlight_index: int, text: str, description: str = "") -> str:
    """
    Type text into a visible input field using its highlightIndex. Use for text boxes, forms,
    or contenteditable fields that accept typing. Only use for elements with a valid
    highlightIndex. Do not use for clicking or non-text fields.
    """
    return f"Typed '{text}' into element {highlight_index}: {description}"


@tool
def press_key(highlight_index: int, key: str, description: str = "") -> str:
    """
    Press a keyboard key (such as Enter, Tab, or Escape) on an element with the given
    highlightIndex. Use for submitting forms, moving between fields, or sending keyboard
    shortcuts. Only use if the element is focused and expects key input.
    """
    return f"Pressed '{key}' on element {highlight_index}: {description}"


@tool
def scroll_page(direction: Literal["up", "down"], description: str = "") -> str:
    """
    Scroll the page up or down to reveal more content. Use 'down' to see content below, or 'up'
    to return to previous content. Do not use highlightIndex for scrolling. Only use to navigate
    the visible portion of the page.
    """
    return f"Scrolled {direction}: {description}"


@tool
def navigate(url: str, description: str = "") -> str:
    """
    Navigate to a specific URL or web page. Use for going to external sites, different pages,
    or changing the current location. Provide the full URL including protocol (https://).
    """
    return f"Navigated to {url}: {description}"


@tool
def finish_task(response: str) -> str:
    """
    End the automation session and give a clear, final response. Use only when the user's goal
    is achieved, the requested information is found, or it is impossible to continue.
    Always explain the outcome in your response.
    """
    return f"Task completed: {response}"


@tool
def upload_file(highlight_index: int, description: str = "") -> str:
    """
    Upload the user's resume file to a file input element using its highlightIndex. 
    Use this when you encounter file upload fields for resumes/CVs in job applications.
    The resume file is already available in your context.
    """
    return f"Uploaded resume to element {highlight_index}: {description}"


TOOLS = [
    click_element,
    input_text,
    press_key,
    scroll_page,
    navigate,
    finish_task,
    upload_file,
]
