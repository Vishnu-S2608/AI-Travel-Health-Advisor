# app.py
import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai

app = FastAPI(title="AI Travel Health Advisor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

# ---------- Data Models ----------
class RequestPayload(BaseModel):
    temp: float
    symptoms: List[str] = []
    other: Optional[str] = ""
    city: str
    date: str


# ---------- Weather Functions ----------
def geocode_city(city: str):
    """Use Open-Meteo’s free geocoding API (no key required)"""
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1"
    r = httpx.get(url, timeout=10.0)
    r.raise_for_status()
    data = r.json()
    if not data.get("results"):
        raise ValueError("Location not found")
    loc = data["results"][0]
    return loc["latitude"], loc["longitude"], loc["name"], loc["country"]


def fetch_daily_forecast(lat: float, lon: float):
    """Fetch 7-day forecast using Open-Meteo"""
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&daily=temperature_2m_min,temperature_2m_max,weathercode&timezone=auto"
    )
    r = httpx.get(url, timeout=10.0)
    r.raise_for_status()
    return r.json()


def find_forecast_for_date(data, target_date_str):
    target = datetime.fromisoformat(target_date_str).date()
    daily = data.get("daily", {})
    dates = daily.get("time", [])
    temps_min = daily.get("temperature_2m_min", [])
    temps_max = daily.get("temperature_2m_max", [])

    if target.isoformat() in dates:
        i = dates.index(target.isoformat())
        return {
            "min": temps_min[i],
            "max": temps_max[i],
            "description": f"Weather code: {daily['weathercode'][i]}",
        }

    # fallback to first day if not found
    return {
        "min": temps_min[0],
        "max": temps_max[0],
        "description": f"Weather code: {daily['weathercode'][0]}",
    }


# ---------- Gemini Reasoning ----------
def generate_ai_reasoning_with_langchain(prompt_vars: dict) -> str:
    if not GEMINI_KEY:
        return "Gemini API key not configured."

    try:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")  # ✅ works in Colab too

        prompt = f"""
You are a medical-travel advisor AI. Analyze the user’s body temperature, symptoms, and the live weather forecast for their chosen travel destination. 
Using your reasoning, decide if it is advisable for them to travel, explain why, and list any precautions.

Respond with:
- A clear decision (e.g., "You should not travel", "You can travel with precautions", or "Safe to travel").
- The reasoning (based on health + forecast).
- Practical precautions (like staying hydrated, wearing warm clothes, etc.).
- A short disclaimer about consulting a doctor if symptoms persist.

User health data:
- Body temperature: {prompt_vars['temp']}°C
- Symptoms: {prompt_vars['symptoms']}
- Other notes: {prompt_vars['other']}

Destination info:
- City: {prompt_vars['city']}
- Travel date: {prompt_vars['date']}
- Forecast: {prompt_vars['forecast_min']}°C–{prompt_vars['forecast_max']}°C, {prompt_vars['forecast_desc']}

Write your advice in a friendly and empathetic tone.
"""

        response = model.generate_content(prompt)
        return response.text or "No response generated from AI."

    except Exception as e:
        return f"AI error: {e}"  


# ---------- Main API ----------
@app.post("/assess")
async def assess(payload: RequestPayload):
    try:
        lat, lon, name, country = geocode_city(payload.city)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not geocode city: {e}")

    try:
        data = fetch_daily_forecast(lat, lon)
        forecast = find_forecast_for_date(data, payload.date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather fetch failed: {e}")

    # ===============================================
    # 🔹 Prepare data for the graph (±3 days)
    # ===============================================
    daily = data.get("daily", {})
    dates = daily.get("time", [])
    temps_avg = [
        round((tmin + tmax) / 2, 1)
        for tmin, tmax in zip(daily.get("temperature_2m_min", []), daily.get("temperature_2m_max", []))
    ]

    target_date = datetime.fromisoformat(payload.date).date()
    forecastGraph = []

    for i, d in enumerate(dates):
        date_obj = datetime.fromisoformat(d).date()
        delta = (date_obj - target_date).days
        # Keep only ±3 days
        if -3 <= delta <= 3:
            forecastGraph.append({
                "date": d,
                "temp": temps_avg[i]
            })

    # ===============================================
    # 🔹 Build prompt for Gemini
    # ===============================================
    prompt_vars = {
        "temp": payload.temp,
        "symptoms": ", ".join(payload.symptoms) if payload.symptoms else "none",
        "other": payload.other or "none",
        "city": payload.city,
        "date": payload.date,
        "forecast_min": forecast["min"],
        "forecast_max": forecast["max"],
        "forecast_desc": forecast["description"],
    }

    suggestion = generate_ai_reasoning_with_langchain(prompt_vars)

    # ===============================================
    # 🔹 Final response
    # ===============================================
    return {
        "recommendation": suggestion,
        "city": f"{name}, {country}" if name and country else payload.city,
        "date": payload.date,
        "forecast": forecast,
        "forecastGraph": forecastGraph,  # ✅ Added this line
    }
