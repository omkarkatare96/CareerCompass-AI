from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import json
import re
import requests
import time
from typing import Dict, Optional, List

# ------------------ Load Environment ------------------

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
)

# ------------------ FastAPI App ------------------

app = FastAPI()

# Enable CORS for frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Request Models ------------------

class DiscoverRequest(BaseModel):
    pressure_fear: str
    life_preference: str
    team_role: str
    failure_response: str
    energy_drain: str
    risk_tolerance: str
    custom_inputs: Optional[Dict[str, str]] = {}


class StreamAnalysisRequest(BaseModel):
    selected_stream: str
    answers: Dict[str, str]  # q1, q2, q3, q4


class RoadmapRequest(BaseModel):
    discover_result: dict
    goals: str


# ------------------ Health Routes ------------------

@app.get("/")
async def root():
    return {"message": "CareerCoach AI Backend Running"}


@app.get("/health")
async def health():
    return {"status": "OK"}


# ------------------ Helper Function ------------------

def call_gemini(prompt: str, retries: int = 1):
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    for attempt in range(retries + 1):
        try:
            response = requests.post(GEMINI_URL, json=payload)
            response.raise_for_status()
            response_json = response.json()

            if "candidates" not in response_json:
                raise Exception(f"Invalid Gemini response: {response_json}")

            text_output = response_json["candidates"][0]["content"]["parts"][0]["text"]

            # Remove markdown formatting
            cleaned = re.sub(r"```json|```", "", text_output).strip()

            # Attempt to parse JSON
            return json.loads(cleaned)

        except (json.JSONDecodeError, Exception) as e:
            if attempt < retries:
                time.sleep(1)  # Wait before retrying
                continue
            
            # If all retries fail, return an error structure or raw response
            return {"error": "Failed to parse AI response", "raw_response": cleaned if 'cleaned' in locals() else str(e)}


# ------------------ Discover AI Route ------------------

@app.post("/generate-discover")
async def generate_discover(data: DiscoverRequest):
    try:
        prompt = f"""
        You are a career psychology analyst.

        Based on these behavioral traits:
        - Reaction to Pressure/Fear: {data.pressure_fear}
        - Life/Work Preference: {data.life_preference}
        - Role in Teams: {data.team_role}
        - Response to Failure: {data.failure_response}
        - Energy Drain Source: {data.energy_drain}
        - Risk Tolerance: {data.risk_tolerance}
        
        Custom Inputs: {data.custom_inputs}

        Generate detailed behavioral career profiling including:
        1. Core Personality Insight
        2. Honest Reality Check
        3. Suitable Career Streams
        4. Suitable Career Roles
        5. Career Types to Avoid
        6. Skill Gaps
        7. Radar-style trait explanation

        Return STRICT JSON ONLY matching this structure:
        {{
            "core_personality_insight": "string",
            "honest_reality_check": "string",
            "suitable_career_streams": ["string", "string"],
            "suitable_career_roles": ["string", "string"],
            "career_types_to_avoid": ["string", "string"],
            "skill_gaps": ["string", "string"],
            "radar_trait_explanation": {{
                "trait_name": "description"
            }}
        }}
        """
        return call_gemini(prompt)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------ Stream Analysis Route ------------------

@app.post("/generate-stream-analysis")
async def generate_stream_analysis(data: StreamAnalysisRequest):
    try:
        prompt = f"""
        You are a career stream psychologist and behavioral evaluator.

        The student selected: {data.selected_stream}
        Behavioral answers: {json.dumps(data.answers)}

        Analyze:
        - Motivation source (passion / money / pressure / safety)
        - Patience
        - Risk tolerance
        - Emotional resilience
        - Pressure handling

        Calculate:
        - alignment_score (0–100)
        - fit_level (Strong Fit / Conditional Fit / High Risk of Regret)

        Generate dynamic analysis (NOT static template).

        Return STRICT JSON ONLY:

        {{
          "alignment_score": number,
          "fit_level": "string",
          "core_analysis": "string",
          "strengths": ["string"],
          "risk_factors": ["string"],
          "improvement_advice": ["string"],
          "final_verdict": "string"
        }}
        """
        return call_gemini(prompt)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ------------------ Roadmap AI Route ------------------

@app.post("/generate-roadmap")
async def generate_roadmap(data: RoadmapRequest):
    try:
        prompt = f"""
        You are a professional career planner.

        Based on:

        Discover Analysis:
        {data.discover_result}

        User Goals:
        {data.goals}

        Create a structured 3-year roadmap including:
        - Skill milestones
        - Certifications
        - Projects
        - Internship suggestions
        - Learning resources

        Return JSON only in structured format like:

        {{
          "year_1": [],
          "year_2": [],
          "year_3": []
        }}
        """
        return call_gemini(prompt)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
