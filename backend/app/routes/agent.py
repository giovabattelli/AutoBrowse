from fastapi import APIRouter, Request, HTTPException
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from app.common.models import AgentRequest
from app.common.interactive_dom import build_interactive_dom
from app.common.prompts import SYSTEM_PROMPT, format_user_prompt, get_mode_prompt
from app.common.tools import TOOLS
from app.common.history_manager import (
    build_history_messages,
    parse_history_from_request,
    update_history,
)
from datetime import datetime, timezone
from app.database import OPENAI_MODEL_NAME

router = APIRouter()

llm = ChatOpenAI(model=OPENAI_MODEL_NAME, temperature=0.1)

FREE_RUN_LIMITS = 3


@router.post("/agent")
async def run_agent(req: Request, agent_request: AgentRequest):
    users_col = req.app.state.users_col
    user_doc = users_col.find_one({"email": agent_request.email})

    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_premium = user_doc.get("premium", 0) == 1
    agent_runs = user_doc.get("agent_runs", 0)
    
    is_new_session = not agent_request.history
    
    if is_new_session:
        if not is_premium and agent_runs >= FREE_RUN_LIMITS:
            raise HTTPException(
                status_code=403, 
                detail="Free users are limited to 3 agent runs. Please upgrade to premium for unlimited runs."
            )
        
        users_col.update_one(
            {"email": agent_request.email},
            {
                "$inc": {"agent_runs": 1},
                "$set": {"last_agent_run": datetime.now(timezone.utc)}
            }
        )
    
    system_prompt = SYSTEM_PROMPT
    mode_prompt = get_mode_prompt(agent_request.agentMode, agent_request.jobApplicationData)
    if mode_prompt:
        system_prompt = system_prompt + "\n" + mode_prompt
    
    messages = [SystemMessage(content=system_prompt)]

    llm_with_tools = llm.bind_tools(TOOLS)
    dom_text = build_interactive_dom(agent_request.dom)
    history_steps = parse_history_from_request(agent_request.history)
    messages.extend(build_history_messages(history_steps))

    user_content = [
        {
            "type": "text",
            "text": format_user_prompt(dom_text, agent_request.prompt),
        }
    ]

    if agent_request.screenshot:
        user_content.append(
            {"type": "image_url", "image_url": {"url": agent_request.screenshot}}
        )

    messages.append(HumanMessage(content=user_content))

    response = await llm_with_tools.ainvoke(messages)

    highlight_index, action, value, updated_history = update_history(
        response.tool_calls, agent_request.screenshot, history_steps
    )

    return {
        "highlightIndex": highlight_index,
        "action": action,
        "value": value,
        "history": updated_history,
    }


@router.get("/agent/status")
async def get_agent_status(email: str, req: Request):
    users_col = req.app.state.users_col
    
    user_doc = users_col.find_one({"email": email})
    if not user_doc:
        return {"agent_runs": 0, "is_premium": False, "runs_remaining": FREE_RUN_LIMITS}
    
    agent_runs = user_doc.get("agent_runs", 0)
    is_premium = user_doc.get("premium", 0) == 1
    
    runs_remaining = "unlimited" if is_premium else max(0, FREE_RUN_LIMITS - agent_runs)
    
    return {
        "agent_runs": agent_runs,
        "is_premium": is_premium,
        "runs_remaining": runs_remaining
    }
