from fastapi import FastAPI

app = FastAPI(title="Classification Engine (skeleton)")


@app.get("/")
def read_root():
    return {"status": "ok", "service": "classification-engine"}


@app.post('/classify')
def classify(payload: dict):
    # Placeholder: qui si chiamerà OpenAI o logica locale
    return {"result": "not_implemented", "confidence": 0.0}
