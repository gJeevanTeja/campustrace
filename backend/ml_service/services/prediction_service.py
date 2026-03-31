import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "item_classifier.pkl")

model = None


def get_model():
    global model
    if model is None:
        model = joblib.load(MODEL_PATH)
    return model


def predict_category(text: str):
    clf = get_model()
    return clf.predict([text])[0]