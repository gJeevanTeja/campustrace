import requests
import os
from decouple import config


ML_SERVICE_URL = config("ML_SERVICE_URL")


def predict_category_from_ml(text):
    try:
        response = requests.post(
            ML_SERVICE_URL,
            json={"text": text},
            timeout=10
        )

        if response.status_code == 200:
            return response.json().get("prediction")
    except Exception as e:
        print("ML service error:", e)

    return None