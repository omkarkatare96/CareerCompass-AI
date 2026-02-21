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

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY not found in environment variables")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

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

def call_openrouter(prompt: str, retries: int = 1):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "google/gemini-2.0-flash-001", # Using a standard flash model ID
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    for attempt in range(retries + 1):
        try:
            response = requests.post(OPENROUTER_URL, headers=headers, json=payload)
            response.raise_for_status()
            response_json = response.json()

            if "choices" not in response_json or not response_json["choices"]:
                raise Exception(f"Invalid OpenRouter response: {response_json}")

            text_output = response_json["choices"][0]["message"]["content"]

            # Try to find JSON block in markdown code blocks first
            code_block_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text_output, re.DOTALL)
            if code_block_match:
                cleaned = code_block_match.group(1)
                return json.loads(cleaned)

            # Fallback: Extract JSON object using regex (non-greedy to avoid trailing text issues if possible, but strict json usually works)
            # Using greedy match for nested structures, but relying on valid JSON structure
            json_match = re.search(r"\{.*\}", text_output, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)
                return json.loads(cleaned)
            
            # Last resort: try cleaning
            cleaned = re.sub(r"```json|```", "", text_output).strip()
            return json.loads(cleaned)

        except (json.JSONDecodeError, Exception) as e:
            if attempt < retries:
                time.sleep(1)  # Wait before retrying
                continue
            
            # Propagate error so endpoints can catch it and return 500
            print(f"OpenRouter Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"OpenRouter Error Details: {getattr(e.response, 'text', 'No text in response')}")
            print(f"Raw Response: {text_output if 'text_output' in locals() else 'No response'}")
            raise e


# ------------------ Discover AI Route ------------------

@app.post("/generate-discover")
async def generate_discover(data: DiscoverRequest):
    try:
        # Combine system instruction and user data into a single prompt for gemini-pro
        prompt = f"""
        ROLE: You are an expert career psychologist and strategic life coach.
        
        USER PROFILE TO ANALYZE:
        - Reaction to Pressure/Fear: {data.pressure_fear}
        - Life/Work Preference: {data.life_preference}
        - Role in Teams: {data.team_role}
        - Response to Failure: {data.failure_response}
        - Energy Drain Source: {data.energy_drain}
        - Risk Tolerance: {data.risk_tolerance}
        
        Custom Inputs (if any): {data.custom_inputs}

        YOUR TASK:
        Generate a highly personalized, "brutally honest" behavioral career profile.
        Do NOT give generic advice. Use the specific combination of traits above to tailor every sentence.
        
        1. **Core Personality Insight**: A deep psychological analysis of who they are at work. Connect their risk tolerance with their energy drain.
        2. **Honest Reality Check**: A one-sentence "wake up call" about their current path vs. their nature.
        3. **Suitable Career Streams**: 3-4 specific career fields that match their lifestyle preference and pressure handling. For each stream include an estimated average salary range (INR per annum, Indian market).
        4. **Ideal Career Roles**: 4-5 specific job titles that fit their team role and energy levels. For each role include an estimated average starting salary (INR per annum, Indian market, fresher level).
        5. **Career Types to Avoid**: Jobs that would cause burnout given their specific energy drain.
        6. **Skill Gaps**: Soft or hard skills they likely lack based on their failure response and risk tolerance.
        7. **Radar Trait Explanation**: Brief explanation of why they scored high/low on traits.
        8. **Personality Axes**: Score the user on exactly these 6 psychological career axes from 0-100 based on their answers: Leadership, Creativity, Analytical, Social, Endurance, Risk-Taking.

        Return STRICT JSON ONLY. NO MARKDOWN. NO CODE BLOCKS. Just the raw JSON string.
        Ensure the structure matches exactly:
        {{
            "core_personality_insight": "string (detailed paragraph, ~100 words)",
            "honest_reality_check": "string (punchy, impact sentence)",
            "suitable_career_streams": [
                {{"name": "string", "avgSalaryRange": "string (e.g. Rs.6L - Rs.18L / yr)"}},
                {{"name": "string", "avgSalaryRange": "string"}}
            ],
            "ideal_career_roles": [
                {{"role": "string", "avgStartingSalary": "string (e.g. Rs.4.5L / yr)"}},
                {{"role": "string", "avgStartingSalary": "string"}}
            ],
            "career_types_to_avoid": ["string", "string", "string"],
            "skill_gaps": ["string", "string", "string"],
            "radar_trait_explanation": {{
                "trait_name": "description"
            }},
            "personality_axes": [
                {{"axis": "Leadership", "score": number}},
                {{"axis": "Creativity", "score": number}},
                {{"axis": "Analytical", "score": number}},
                {{"axis": "Social", "score": number}},
                {{"axis": "Endurance", "score": number}},
                {{"axis": "Risk-Taking", "score": number}}
            ]
        }}
        """
        return call_openrouter(prompt)

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
        return call_openrouter(prompt)

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
        return call_openrouter(prompt)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
