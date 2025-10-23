from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
import google.generativeai as genai
import io
import os
import tempfile

# -------------------------------------------------
# Initialize FastAPI app
# -------------------------------------------------
app = FastAPI()

# Allow CORS for frontend (React app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Configure Google Gemini API
# -------------------------------------------------
# 🔑 Replace this with your actual Gemini API key
GEMINI_API_KEY = "AIzaSyBrZTKyP1y9XSYs6CacYhL1CpoKjZVLDbs"
genai.configure(api_key=GEMINI_API_KEY)


# -------------------------------------------------
# Endpoint: Upload PDF and extract text
# -------------------------------------------------
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Read PDF text
        reader = PdfReader(temp_file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""

        # Clean up temp file
        os.remove(temp_file_path)

        return {"text": text.strip()}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# -------------------------------------------------
# Endpoint: Ask question (uses Gemini model)
# -------------------------------------------------
@app.post("/ask")
async def ask_question(question: str = Form(...), context: str = Form(...)):
    try:
        # Load Gemini model
        model = genai.GenerativeModel("gemini-2.5-flash")  # You can also use "gemini-1.5-pro"

        # Create a thoughtful, structured prompt
        prompt = f"""
        You are a smart AI assistant. 
        The user uploaded a document. Use the provided document text to answer the question below.
        
        Document content:
        \"\"\"{context}\"\"\"
        
        Question: {question}

        Provide a clear, concise, and helpful answer using reasoning — not just copying text.
        """

        # Generate response from Gemini
        response = model.generate_content(prompt)

        # Return answer
        return {"answer": response.text.strip()}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
