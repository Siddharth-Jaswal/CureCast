import pickle
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------

ARTIFACT_PATH = Path(__file__).parent / "../curecast_catboost_optimized.pkl"
DISEASE_CSV_PATH = Path(__file__).parent / "../disease_list_with_counts.csv"


# ------------------------------------------------------------------
# Loaders
# ------------------------------------------------------------------

def load_artifact(path: Path):
    with open(path, "rb") as f:
        artifact = pickle.load(f)

    model = artifact.get("model")
    label_encoder = artifact["label_encoder"]
    symptoms = artifact.get("symptoms") or artifact.get("features") or []
    return model, label_encoder, symptoms

SEVERITY_OVERRIDES = {
    "heart attack": "Severe",
    "stroke": "Severe",
    "cancer": "Severe",
    "kidney failure": "Severe",
    "pneumonia": "Severe",
    "covid-19": "Severe",
    "diabetes": "Moderate",
    "hypertension": "Moderate",
    "asthma": "Moderate",
    "arthritis": "Moderate",
    "depression": "Moderate",
    "heart failure": "Severe",
}

SPECIALIST_KEYWORDS = {
    "heart": "Cardiologist",
    "cardio": "Cardiologist",
    "stroke": "Neurologist",
    "brain": "Neurologist",
    "lung": "Pulmonologist",
    "respiratory": "Pulmonologist",
    "asthma": "Pulmonologist",
    "pneumonia": "Pulmonologist",
    "kidney": "Nephrologist",
    "renal": "Nephrologist",
    "liver": "Hepatologist",
    "diabetes": "Endocrinologist",
    "thyroid": "Endocrinologist",
    "mental": "Psychiatrist",
    "depression": "Psychiatrist",
    "bone": "Orthopedic Surgeon",
    "fracture": "Orthopedic Surgeon",
    "skin": "Dermatologist",
    "dermatitis": "Dermatologist",
    "eye": "Ophthalmologist",
    "ear": "ENT Specialist",
    "sinus": "ENT Specialist",
}

def infer_specialist(disease: str) -> str:
    name = disease.lower()
    for keyword, specialist in SPECIALIST_KEYWORDS.items():
        if keyword in name:
            return specialist
    return "General Physician"

def load_disease_catalog(path: Path):
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    df["Disease_norm"] = df["Disease"].str.lower()
    df["Severity"] = df["Disease_norm"].map(SEVERITY_OVERRIDES).fillna("Mild")
    df["Specialist"] = df["Disease_norm"].map(lambda x: infer_specialist(x))
    return df[["Disease", "Disease_norm", "Sample_Count", "Severity", "Specialist"]]

# ------------------------------------------------------------------
# App Initialization
# ------------------------------------------------------------------

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

MODEL, LABEL_ENCODER, SYMPTOMS = load_artifact(ARTIFACT_PATH)
DISEASE_CATALOG = load_disease_catalog(DISEASE_CSV_PATH)

print(f"BACKEND LOG: Loaded {len(SYMPTOMS)} symptoms from artifact.")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def build_feature_frame(selected: List[str]) -> pd.DataFrame:
    vector = pd.DataFrame(
        data=0,
        index=[0],
        columns=SYMPTOMS,
        dtype=np.float32,
    )
    active = [sym for sym in selected if sym in SYMPTOMS]
    if active:
        vector.loc[0, active] = 1.0
    return vector

# ------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------

@app.route("/")
def read_root():
    return jsonify({"message": "CureCast API is running."})

@app.route("/symptoms", methods=['GET'])
def get_symptoms():
    print(f"BACKEND LOG: /symptoms endpoint called, sending {len(SYMPTOMS)} symptoms.")
    return jsonify(SYMPTOMS)

@app.route("/diseases", methods=['GET'])
def get_diseases():
    return jsonify(DISEASE_CATALOG.to_dict(orient="records"))

@app.route("/predict", methods=['POST'])
def predict():
    data = request.get_json()
    symptoms = data.get('symptoms', [])

    if not symptoms:
        return jsonify([])

    features = build_feature_frame(symptoms)
    proba = MODEL.predict_proba(features)[0]
    classes = LABEL_ENCODER.inverse_transform(np.arange(len(proba)))

    df = (
        pd.DataFrame({"Disease": classes, "Probability": proba})
        .sort_values("Probability", ascending=False)
        .head(3) # Top 3 as requested
    )
    df["Percent"] = (df["Probability"] * 100)
    df["Disease_norm"] = df["Disease"].str.lower()
    merged = df.merge(
        DISEASE_CATALOG,
        on="Disease_norm",
        how="left",
        suffixes=("", "_catalog"),
    )
    merged = merged.drop(columns=["Disease_norm", "Disease_catalog"], errors="ignore")
    
    result = merged[
        ["Disease", "Percent", "Severity", "Specialist", "Sample_Count"]
    ].fillna({"Severity": "Unknown", "Specialist": "General Physician"})

    return jsonify(result.to_dict(orient="records"))

if __name__ == "__main__":
    app.run(debug=True)