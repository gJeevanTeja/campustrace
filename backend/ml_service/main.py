from fastapi import FastAPI
from pydantic import BaseModel
from services.prediction_service import predict_category

app = FastAPI()


@app.get("/")
def home():
    return {"message": "ML service running successfully 🚀"}


class PredictInput(BaseModel):
    text: str


@app.post("/predict")
def predict(data: PredictInput):
    result = predict_category(data.text)
    return {"prediction": result}