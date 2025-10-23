from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io

# Import your extractors
from extractors.pdf_extractor import extract_pdf_text
from extractors.docx_extractor import extract_docx_text
from extractors.text_extractor import extract_text_file
from extractors.csv_extractor import extract_csv_text
from extractors.json_extractor import extract_json_text

import google.generativeai as genai

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GOOGLE_API_KEY = "AIzaSyBrZTKyP1y9XSYs6CacYhL1CpoKjZVLDbs"
genai.configure(api_key=GOOGLE_API_KEY)

# --- Helper: Ask Gemini ---
def query_gemini(question: str, context: str):
    prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text


# --- Upload Endpoint ---
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        content_type = file.content_type.lower()

        if content_type == "application/pdf":
            text = extract_pdf_text(file_bytes)

        elif (
            content_type
            == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ):
            text = extract_docx_text(file_bytes)

        elif content_type.startswith("text/") or file.filename.endswith(".txt"):
            text = extract_text_file(file_bytes)

        elif file.filename.endswith(".csv"):
            text = extract_csv_text(file_bytes)

        elif file.filename.endswith(".json"):
            text = extract_json_text(file_bytes)

        else:
            return JSONResponse(
                status_code=400,
                content={"error": f"Unsupported file type: {file.content_type}"},
            )

        return {"text": text[:8000]}  # Limit long context

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# --- Ask Endpoint ---
@app.post("/ask")
async def ask_question(question: str = Form(...), context: str = Form(...)):
    try:
        answer = query_gemini(question, context)
        return {"answer": answer}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
