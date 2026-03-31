from fastapi import FastAPI
from pydantic import BaseModel
from services.prediction_service import predict_category

app = FastAPI()

class ItemInput(BaseModel):
    title: str
    description: str

@app.get("/health")
def health():
    return {"status": "ML service running"}

@app.post("/predict-category")
def predict(data: ItemInput):
    result = predict_category(data.title, data.description)
    return {"prediction": result}