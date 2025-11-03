

🌤️ AI Travel Health Advisor

An intelligent web app that provides personalized health-based travel recommendations using your body temperature, symptoms, destination, and date of travel.
It uses Gemini AI for reasoning and Open-Meteo API for real-time weather forecasts.

🧠 Features

🧍 Analyzes your body temperature and symptoms

🌦 Fetches real-time weather for your chosen destination

🤖 Uses Google Gemini AI to give health-based travel advice

💬 Suggests practical precautions and a friendly recommendation

🌍 Simple and responsive frontend built with HTML, CSS, and JavaScript


🧰 Tech Stack

Frontend: HTML, CSS, JavaScript
Backend: Python (FastAPI)
AI Model: Gemini 1.5 Flash
Weather API: Open-Meteo


setup_instructions:
  - step: 1️⃣ Clone the Repository
    description: |
      Clone the GitHub repository to your local machine and navigate to the backend directory.
    commands:
      - git clone https://github.com/your-username/AI-Travel-Health-Advisor.git
      - cd AI-Travel-Health-Advisor/backend

  - step: 2️⃣ Create and Activate a Virtual Environment
    description: |
      Create a Python virtual environment to isolate dependencies.
    windows:
      - python -m venv venv
      - venv\Scripts\activate
    mac_linux:
      - python3 -m venv venv
      - source venv/bin/activate

  - step: 3️⃣ Install Dependencies
    description: |
      Install all required Python packages using pip.
    commands:
      - pip install -r requirements.txt
    note: |
      If requirements.txt is missing, install manually:
      pip install fastapi uvicorn httpx python-dotenv langchain langchain-google-genai
      pip freeze > requirements.txt

  - step: 4️⃣ Add Gemini API Key
    description: |
      Create a .env file in the backend folder and paste your Gemini API key.
    file: .env
    content: |
      GEMINI_API_KEY=your_gemini_api_key_here
    tip: |
      Get your free Gemini API key from:
      https://aistudio.google.com/app/apikey

  - step: 5️⃣ Run the Backend Server
    description: |
      Start the FastAPI backend using Uvicorn.
    command: python -m uvicorn app:app --reload --port 8000
    expected_output: |
      INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)

  - step: 6️⃣ Run the Frontend
    description: |
      Open the index.html file in the frontend folder using a web browser.
    instructions:
      - Ensure the backend is running.
      - Open frontend/index.html in your browser.
      - The frontend connects automatically to http://127.0.0.1:8000/assess

  - step: 7️⃣ Test Using Postman (Optional)
    endpoint:
      url: http://127.0.0.1:8000/assess
      method: POST
    example_request_body: |
      {
        "temp": 37.5,
        "symptoms": ["cough", "fatigue"],
        "other": "Mild headache",
        "city": "Ooty",
        "date": "2025-11-04"
      }
    example_response: |
      {
        "recommendation": "You can travel with precautions...",
        "city": "Ooty, India",
        "date": "2025-11-04",
        "forecast": {
          "min": 12.8,
          "max": 17.9,
          "description": "Weather code: 95"
        }
      }
