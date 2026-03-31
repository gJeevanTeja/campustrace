import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


data = {
    "text": [
        "black backpack found near library",
        "iphone lost in classroom",
        "wallet found in canteen",
        "id card lost in parking",
        "laptop charger found",
        "water bottle lost"
    ],
    "category": [
        "Bags",
        "Electronics",
        "Accessories",
        "Documents",
        "Electronics",
        "Accessories"
    ]
}

df = pd.DataFrame(data)

X = df["text"]
y = df["category"]

model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("clf", LogisticRegression())
])

model.fit(X, y)

joblib.dump(model, "models/item_classifier.pkl")

print("✅ Model saved successfully")