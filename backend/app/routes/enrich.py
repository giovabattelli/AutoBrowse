from fastapi import APIRouter
from langchain_openai import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from app.common.models import EnrichRequest, EnrichResponse
from app.common.prompts import ENRICH_SYSTEM_PROMPT, get_enrich_mode_context
from app.database import OPENAI_MODEL_NAME

router = APIRouter()

llm = ChatOpenAI(model=OPENAI_MODEL_NAME, temperature=0.4)


@router.post("/enrich", response_model=EnrichResponse)
async def enrich_prompt(request: EnrichRequest):
    system_prompt = ENRICH_SYSTEM_PROMPT
    mode_context = get_enrich_mode_context(request.agentMode)
    if mode_context:
        system_prompt = system_prompt + "\n" + mode_context
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=request.prompt),
    ]

    response = await llm.ainvoke(messages)
    print(response.content)
    return EnrichResponse(prompt=response.content)
