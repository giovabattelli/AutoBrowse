from typing import List, Optional, Any, Dict
from langchain_core.messages import AIMessage, ToolMessage

from .models import HistoryStep
import json


def build_history_messages(history_steps: List[HistoryStep]) -> List[Any]:
    messages = []
    for step in history_steps:
        action_to_tool_mapping = {
            "click": "click_element",
            "input": "input_text",
            "key_press": "press_key",
            "scroll": "scroll_page",
            "navigate": "navigate",
            "finish": "finish_task",
            "upload": "upload_file",
        }

        tool_name = action_to_tool_mapping.get(step.action, "unknown")
        tool_arguments = {
            "description": step.summary,
        }

        if step.action == "input":
            tool_arguments["text"] = step.value if step.value is not None else ""
        elif step.action == "key_press":
            tool_arguments["key"] = step.value if step.value is not None else ""
        elif step.action == "scroll":
            tool_arguments["direction"] = (
                step.value if step.value is not None else "down"
            )
        elif step.action == "navigate":
            tool_arguments["url"] = step.value if step.value is not None else ""
        elif step.action == "finish":
            tool_arguments["response"] = step.value if step.value is not None else ""
        elif step.action == "upload":
            pass
            
        ai_message = AIMessage(
            content=f"Step {step.step_number}: {step.summary}",
            tool_calls=[
                {
                    "name": tool_name,
                    "args": tool_arguments,
                    "id": f"call_{step.step_number}",
                }
            ],
        )
        messages.append(ai_message)

        tool_content = f"Executed {step.action} action: {step.summary}"
        if step.screenshot:
            tool_message = ToolMessage(
                content=[
                    {"type": "text", "text": tool_content},
                    {"type": "image_url", "image_url": {"url": step.screenshot}},
                ],
                tool_call_id=f"call_{step.step_number}",
            )
        else:
            tool_message = ToolMessage(
                content=tool_content,
                tool_call_id=f"call_{step.step_number}",
            )
        messages.append(tool_message)

    return messages


def parse_history_from_request(history_data: Optional[str]) -> List[HistoryStep]:
    if not history_data:
        return []

    try:
        steps_data = (
            json.loads(history_data) if isinstance(history_data, str) else history_data
        )

        if isinstance(steps_data, list):
            return [HistoryStep(**step) for step in steps_data]
        else:
            steps = []
            for step_num, step_data in steps_data.items():
                steps.append(
                    HistoryStep(
                        step_number=int(step_num),
                        action=step_data.get("action", "unknown"),
                        value=step_data.get("value"),
                        summary=step_data.get("description", ""),
                        screenshot=step_data.get("screenshot"),
                    )
                )
            return sorted(steps, key=lambda x: x.step_number)
    except Exception:
        return []


def update_history(
    tool_calls: List[Dict[str, Any]],
    screenshot: Optional[str],
    history_steps: List[HistoryStep],
) -> tuple[Optional[int], str, Optional[str], str]:

    if tool_calls:
        tool_call = tool_calls[0]
        tool_name = tool_call["name"]
        tool_arguments = tool_call["args"]

        tool_to_action_mapping = {
            "click_element": "click",
            "input_text": "input",
            "press_key": "key_press",
            "scroll_page": "scroll",
            "navigate": "navigate",
            "finish_task": "finish",
            "upload_file": "upload",
        }

        action = tool_to_action_mapping.get(tool_name, "unknown")

        if tool_name == "click_element":
            highlight_index = tool_arguments.get("highlight_index", -1)
            value = None
        elif tool_name == "input_text":
            highlight_index = tool_arguments.get("highlight_index", -1)
            value = tool_arguments.get(
                "input_text_content", tool_arguments.get("text", "")
            )
        elif tool_name == "press_key":
            highlight_index = tool_arguments.get("highlight_index", -1)
            value = tool_arguments.get("keyboard_key", tool_arguments.get("key", ""))
        elif tool_name == "scroll_page":
            highlight_index = None
            value = tool_arguments.get("direction", "down")
        elif tool_name == "navigate":
            highlight_index = None
            value = tool_arguments.get("url", "")
        elif tool_name == "finish_task":
            highlight_index = None
            value = tool_arguments.get(
                "task_completion_response", tool_arguments.get("response", "")
            )
        elif tool_name == "upload_file":
            highlight_index = tool_arguments.get("highlight_index", -1)
            value = tool_arguments.get("file_name", "resume.pdf")
        else:
            highlight_index = None
            value = None

        description = tool_arguments.get(
            "action_description",
            tool_arguments.get("description", f"Performed {action} action"),
        )

    else:
        action = "finish"
        highlight_index = -1
        value = "Agent error: Failed to select a tool. Task incomplete"
        description = "System forced finish due to missing tool call"

    new_step = HistoryStep(
        step_number=len(history_steps) + 1,
        action=action,
        value=value,
        summary=description,
        screenshot=screenshot,
    )

    updated_history_steps = history_steps + [new_step]
    history_json = json.dumps([step.dict() for step in updated_history_steps])

    return (
        highlight_index if highlight_index is not None else -1,
        action,
        value,
        history_json,
    )
