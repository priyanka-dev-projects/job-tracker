# 🚀 Job Tracker Application

A full-stack job tracking system that helps users manage job applications, analyze resumes, and match them with job descriptions using intelligent scoring.

---

## ✨ Features

* 📄 Upload and parse resumes (PDF/DOCX)
* 📊 Dashboard with application insights
* 📌 Track job applications (Kanban board)
* 🤖 Resume vs Job Description matching
* 📉 Skill gap analysis
* 🔐 User authentication (JWT-based)

---

## 🏗️ Tech Stack

### Backend

* FastAPI
* MongoDB (Motor - async)
* Scikit-learn (TF-IDF for matching)

### Frontend

* React
* React Query
* Tailwind CSS

### DevOps & Tools

* Docker & Docker Compose
* MinIO (file storage)
* Postman (API testing)

---

## 📂 Project Structure

```
job-tracker/
│
├── backend/
│   ├── api-gateway/
│   ├── resume-parser/
│   ├── job-matcher/
│
├── frontend/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```
git clone https://github.com/YOUR_USERNAME/job-tracker.git
cd job-tracker
```

---

### 2. Create environment file

Create a `.env` file in the root:

```
MONGO_URI=mongodb://jat_user:jat_pass@mongo:27017
JWT_SECRET=your_secret_key
MINIO_URL=http://minio:9000
```

---

### 3. Run using Docker

```
docker-compose up --build
```

---

### 4. Access the application

* Frontend: http://localhost:3000
* API Docs (Swagger): http://localhost:8000/docs

---

## 📊 Key Features Explained

### 🔍 Resume Matching

* Compares resume skills with job description
* Generates match score
* Identifies missing skills

### 📉 Skill Gap Analysis

* Shows missing skills across job descriptions
* Helps improve resume for better matches

### 📌 Application Tracker

* Kanban-style tracking:

  * Wishlist → Applied → Screening → Interview → Offer → Rejected

---


## 🚧 Future Improvements

* Semantic matching using embeddings
* AI-based resume suggestions
* Job description auto-fetch from URL
* Advanced analytics dashboard

---

## 👩‍💻 Author

Priyanka Kudchi

---
