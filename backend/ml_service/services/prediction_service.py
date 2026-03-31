import joblib

model = joblib.load("models/item_classifier.pkl")

def predict_category(title, description):
    text = f"{title} {description}"
    return model.predict([text])[0]