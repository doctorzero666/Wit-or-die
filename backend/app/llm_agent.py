from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

try:
    from spoon_ai.chat import ChatBot
    SPOON_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency guard
    SPOON_AVAILABLE = False

    class ChatBot:  # type: ignore
        def __init__(self, **_kwargs: Any) -> None:
            return None

try:
    from spoon_ai.agents.toolcall import ToolCallAgent
    from spoon_ai.tools import ToolManager
    TOOLCALL_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency guard
    TOOLCALL_AVAILABLE = False

    class ToolCallAgent:  # type: ignore
        pass

    class ToolManager:  # type: ignore
        def __init__(self, _tools: list) -> None:
            return None


@dataclass
class LlmQuestion:
    id: str
    prompt: str
    answer: str
    difficulty: int
    topic: str


@dataclass
class JudgeResult:
    correct: bool
    confidence: float
    reason: str
    normalized_answer: str


SYSTEM_PROMPT = """
You are an educational game agent. Always respond with strict JSON only.
Never include markdown, explanations, or additional text.
"""


if TOOLCALL_AVAILABLE:
    class ArenaLlmAgent(ToolCallAgent):
        name: str = "arena_llm_agent"
        description: str = "Generate and judge spelling questions for the arena."
        system_prompt: str = SYSTEM_PROMPT
        available_tools: ToolManager = ToolManager([])
else:
    class ArenaLlmAgent:  # type: ignore
        name: str = "arena_llm_agent"
        description: str = "Generate and judge spelling questions for the arena."
        system_prompt: str = SYSTEM_PROMPT

        def __init__(self, llm: ChatBot) -> None:
            self.llm = llm

        async def run(self, prompt: str) -> str:
            return await self.llm.ask(
                messages=[{"role": "user", "content": prompt}],
                system_msg=self.system_prompt,
            )


_AGENT: Optional[ArenaLlmAgent] = None


def _get_agent() -> Optional[ArenaLlmAgent]:
    global _AGENT
    if _AGENT is not None:
        return _AGENT

    if not SPOON_AVAILABLE:
        return None

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    model_name = os.getenv("SPOON_LLM_MODEL", "gpt-4o-mini")
    _AGENT = ArenaLlmAgent(
        llm=ChatBot(
            llm_provider="openai",
            model_name=model_name,
        )
    )
    return _AGENT


def _extract_json(text: str) -> Dict[str, Any]:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in response.")
    payload = text[start : end + 1]
    return json.loads(payload)


async def generate_question(
    player_id: str,
    difficulty: int,
    topic: str = "basic_vocab",
) -> Optional[LlmQuestion]:
    agent = _get_agent()
    if agent is None:
        return None

    prompt = f"""
Generate a single English spelling question for a Chinese learner.
Return JSON with keys: id, prompt, answer, difficulty, topic.
Constraints:
- prompt must be Chinese like "拼写: 生存"
- answer must be a single English word
- difficulty is integer 1-5
- topic is a short token
Player: {player_id}
Difficulty: {difficulty}
Topic: {topic}
"""
    response = await agent.run(prompt)
    data = _extract_json(response)
    return LlmQuestion(
        id=str(data.get("id") or f"q_{uuid.uuid4().hex[:8]}"),
        prompt=str(data.get("prompt") or "拼写: 生存"),
        answer=str(data.get("answer") or "survival"),
        difficulty=int(data.get("difficulty") or difficulty),
        topic=str(data.get("topic") or topic),
    )


async def judge_answer(
    question: LlmQuestion,
    user_answer: str,
) -> Optional[JudgeResult]:
    agent = _get_agent()
    if agent is None:
        return None

    prompt = f"""
You are judging a spelling answer.
Return JSON with keys: correct, confidence, reason, normalized_answer.
QuestionPrompt: {question.prompt}
ExpectedAnswer: {question.answer}
UserAnswer: {user_answer}
Rules:
- correct is true only if spelling matches or is a very minor typo
- confidence is 0-1
- normalized_answer is lowercased answer
"""
    response = await agent.run(prompt)
    data = _extract_json(response)
    return JudgeResult(
        correct=bool(data.get("correct")),
        confidence=float(data.get("confidence") or 0),
        reason=str(data.get("reason") or ""),
        normalized_answer=str(data.get("normalized_answer") or user_answer.lower()),
    )


async def generate_report(wrong_words: List[str], score: Optional[int]) -> str:
    agent = _get_agent()
    if agent is None:
        mistakes = "、".join(wrong_words) if wrong_words else "暂无"
        return (
            "同学，你做得已经很不错了，先给自己一点肯定。\n"
            f"这次答题里出错的词有：{mistakes}。\n"
            "建议你先把这些词做成卡片，每天少量多次复习，"
            "再用拼写+造句的方式巩固。\n"
            "学习是长跑，不是短刺。请记得照顾自己，热爱生命，"
            "不要被内卷压垮。"
        )

    wrong_list = ", ".join(wrong_words) if wrong_words else "none"
    score_text = str(score) if score is not None else "unknown"
    prompt = f"""
You are a senior student (学姐). You are empathetic and gentle.
You once suffered severe depression due to peer pressure and chose to end your life.
Now you speak to the user with care: encourage them first, then list their mistakes,
give improvement directions and effective study methods, and finally remind them
to love life and avoid toxic competition.

Return JSON with a single key: text.
Keep the text within 100 Chinese characters.
User score: {score_text}
Wrong words: {wrong_list}
"""
    response = await agent.run(prompt)
    data = _extract_json(response)
    return str(data.get("text") or "")
