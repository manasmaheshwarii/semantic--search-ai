from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PyPDF2 import PdfReader
import io
import google.generativeai as genai

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini setup
GOOGLE_API_KEY = "AIzaSyBrZTKyP1y9XSYs6CacYhL1CpoKjZVLDbs"
genai.configure(api_key=GOOGLE_API_KEY)

# In-memory chat storage
chat_history = []

def extract_pdf_text(pdf_file):
    reader = PdfReader(io.BytesIO(pdf_file))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def query_gemini(question, context):
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
    response = model.generate_content(prompt)
    return response.text


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        pdf_bytes = await file.read()
        text = extract_pdf_text(pdf_bytes)
        return {"text": text.strip()}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/ask")
async def ask_question(question: str = Form(...), context: str = Form(...)):
    try:
        answer = query_gemini(question, context)
        chat_history.append({"question": question, "answer": answer})
        return {"answer": answer}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/history")
async def get_history():
    return {"history": chat_history}


@app.delete("/history/clear")
async def clear_history():
    chat_history.clear()
    return {"message": "Chat history cleared"}
