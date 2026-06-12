# InsightPulse - AI-Powered Mental Health Assessment Platform

## Overview

InsightPulse is a full-stack AI-powered mental health assessment platform designed to help users understand and monitor their mental well-being using the DASS-21 (Depression, Anxiety, Stress Scale) framework.

The platform combines psychological assessment, machine learning prediction, data visualization, and an AI-powered mental health companion to provide users with actionable insights into their emotional health.

---

## Features

### User Authentication

* Secure JWT-based authentication
* User registration and login
* Role-based access control (User/Admin)
* Protected frontend and backend routes

### DASS-21 Assessment System

* Complete 21-question DASS-21 assessment
* Automatic score calculation
* Depression, Anxiety, and Stress severity classification
* Evidence-based severity interpretation

### Machine Learning Prediction

* Random Forest models trained on real anonymized student data
* Separate models for:

  * Depression prediction
  * Anxiety prediction
  * Stress prediction
* Predicts severity levels from user responses

### Assessment Analytics

* Assessment history tracking
* Interactive charts and visualizations
* Mental health trend monitoring
* Risk progression analysis over time

### AI Mental Health Companion

* Gemini-powered conversational assistant
* Mental health guidance and coping suggestions
* Context-aware conversation history
* Rate limiting for API protection

### Admin Dashboard

* Admin-only access panel
* User management
* Assessment monitoring
* Platform analytics

### Database Integration

* MongoDB storage
* User profiles
* Assessment records
* Chat history persistence

---

## Tech Stack

### Frontend

* React
* Vite
* TypeScript
* React Router
* Axios
* Recharts
* CSS

### Backend

* FastAPI
* Python
* Pydantic
* JWT Authentication
* Motor (MongoDB Async Driver)

### Database

* MongoDB

### Machine Learning

* Scikit-Learn
* Random Forest Classifier
* NumPy
* Pickle Model Serialization

### AI Integration

* Google Gemini API

---

## Project Structure

InsightPulse/

├── app/ # React Frontend

│ ├── src/

│ ├── components/

│ ├── pages/

│ ├── services/

│ └── context/

│

├── backend/

│ ├── app/

│ │ ├── routers/

│ │ ├── services/

│ │ ├── schemas/

│ │ ├── core/

│ │ └── models/

│

├── ml_models/

│ ├── depression.pkl

│ ├── anxiety.pkl

│ └── stress.pkl

│

└── README.md

---

## Installation

### Clone Repository

git clone https://github.com/your-username/InsightPulse.git

cd InsightPulse

### Backend Setup

cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

### Configure Environment Variables

Create a `.env` file inside the backend directory:

MONGODB_URI=your_mongodb_connection

DB_NAME=insightpulse

JWT_SECRET=your_secret_key

JWT_ALGORITHM=HS256

JWT_EXPIRATION_HOURS=24

GEMINI_API_KEY=your_gemini_api_key

FRONTEND_URL=http://localhost:3000

### Run Backend

uvicorn app.main:app --reload

### Frontend Setup

cd app

npm install

npm run dev

---

## Machine Learning Models

The platform uses three independently trained Random Forest models:

| Model            | Purpose                      |
| ---------------- | ---------------------------- |
| Depression Model | Predicts depression severity |
| Anxiety Model    | Predicts anxiety severity    |
| Stress Model     | Predicts stress severity     |

The models are loaded at application startup and provide real-time predictions from DASS-21 responses.

---

## Future Improvements

* Personalized recommendations engine
* PDF report export
* Email-based assessment summaries
* Crisis detection and escalation workflow
* Mobile application
* Multi-language support

---

## Disclaimer

InsightPulse is intended for educational and self-assessment purposes only.

It is not a substitute for professional psychological diagnosis, treatment, or mental health care. Users experiencing severe distress should seek support from qualified mental health professionals.

---

## Author

P. Ajay Kumar

B.Tech CSCE, KIIT University

AI | Machine Learning | Full Stack Development
