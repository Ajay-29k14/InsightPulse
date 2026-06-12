import os
import pickle
import numpy as np
from typing import List, Dict, Optional

# Severity labels matching DASS-21
SEVERITY_LABELS = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"]

# Mock model path
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml_models")


class MLService:
    _depression_model = None
    _anxiety_model = None
    _stress_model = None
    
    @classmethod
    def load_models(cls):
        """Load pre-trained scikit-learn models. Falls back to rule-based scoring."""
        try:
            dep_path = os.path.join(MODELS_DIR, "depression.pkl")
            anx_path = os.path.join(MODELS_DIR, "anxiety.pkl")
            str_path = os.path.join(MODELS_DIR, "stress.pkl")
            
            
            if os.path.exists(dep_path):
                with open(dep_path, "rb") as f:
                    cls._depression_model = pickle.load(f)
            if os.path.exists(anx_path):
                with open(anx_path, "rb") as f:
                    cls._anxiety_model = pickle.load(f)
            if os.path.exists(str_path):
                with open(str_path, "rb") as f:
                    cls._stress_model = pickle.load(f)
            
            if cls._depression_model is not None:
                print("ML models loaded successfully")
            else:
                print("No ML models found, using rule-based scoring")
        except Exception as e:
                print(f"Error loading ML models: {e}. Using rule-based scoring.")
    
    @classmethod
    def predict_depression(cls, answers: List[int]) -> str:
        if cls._depression_model is not None:
            try:
                X = np.array(answers).reshape(1, -1)
                pred = cls._depression_model.predict(X)[0]
                return SEVERITY_LABELS[pred] if 0 <= pred < len(SEVERITY_LABELS) else "Unknown"
            except Exception:
                pass
        # Fallback: rule-based
        depression_questions = [3, 5, 10, 13, 16, 17, 21]
        score = sum(answers[q - 1] for q in depression_questions) * 2
        return cls._score_to_severity(score, "depression")
    
    @classmethod
    def predict_anxiety(cls, answers: List[int]) -> str:
        if cls._anxiety_model is not None:
            try:
                X = np.array(answers).reshape(1, -1)
                pred = cls._anxiety_model.predict(X)[0]
                return SEVERITY_LABELS[pred] if 0 <= pred < len(SEVERITY_LABELS) else "Unknown"
            except Exception:
                pass
        # Fallback: rule-based
        anxiety_questions = [2, 4, 7, 9, 15, 19, 20]
        score = sum(answers[q - 1] for q in anxiety_questions) * 2
        return cls._score_to_severity(score, "anxiety")
    
    @classmethod
    def predict_stress(cls, answers: List[int]) -> str:
        if cls._stress_model is not None:
            try:
                X = np.array(answers).reshape(1, -1)
                pred = cls._stress_model.predict(X)[0]
                return SEVERITY_LABELS[pred] if 0 <= pred < len(SEVERITY_LABELS) else "Unknown"
            except Exception:
                pass
        # Fallback: rule-based
        stress_questions = [1, 6, 8, 11, 12, 14, 18]
        score = sum(answers[q - 1] for q in stress_questions) * 2
        return cls._score_to_severity(score, "stress")
    
    @classmethod
    def predict_all(cls, answers: List[int]) -> Dict[str, str]:
        return {
            "depression": cls.predict_depression(answers),
            "anxiety": cls.predict_anxiety(answers),
            "stress": cls.predict_stress(answers)
        }
    
    @staticmethod
    def _score_to_severity(score: int, scale: str) -> str:
        if scale == "depression":
            if score <= 9: return "Normal"
            elif score <= 13: return "Mild"
            elif score <= 20: return "Moderate"
            elif score <= 27: return "Severe"
            else: return "Extremely Severe"
        elif scale == "anxiety":
            if score <= 7: return "Normal"
            elif score <= 9: return "Mild"
            elif score <= 14: return "Moderate"
            elif score <= 19: return "Severe"
            else: return "Extremely Severe"
        elif scale == "stress":
            if score <= 14: return "Normal"
            elif score <= 18: return "Mild"
            elif score <= 25: return "Moderate"
            elif score <= 33: return "Severe"
            else: return "Extremely Severe"
        return "Unknown"


# Load models on module import
MLService.load_models()
