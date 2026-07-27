# Seam (formerly HealthOS) 🩺

> **Seamless health record sharing for patients and healthcare providers.**

Seam is a unified Personal Health Record (PHR) and Clinical Consultation ecosystem integrated with India's **Ayushman Bharat Digital Mission (ABDM)** sandbox specifications.

---

## 🌟 Key Features

### 1. 📱 Patient Personal Health Record (PHR) App
* **Decentralized ABHA Identity**: Seamless login via Ayushman Bharat Health Account (ABHA) numbers.
* **Unified Health Timeline**: Consolidates consultations, lab reports, diagnostics, and prescriptions into a single feed.
* **Real-time Digital Consent**: Instant alerts when a doctor requests record access. Patients approve or decline access with one tap.
* **Print & Export**: Built-in print overrides that transform digital records into clean, physical clinical summaries on standard A4 paper.
* **Digital ABHA QR**: Built-in scanner badge for quick hospital check-ins.

### 2. 🏥 Doctor Clinical Portal
* **Verified HPR Authentication**: Clinicians log in using Healthcare Professional Registry (HPR) credentials.
* **Patient Search & Consent Trigger**: Doctors search patients by ABHA ID and initiate real-time digital consent requests.
* **Streamlined Consultation Engine**: Write ICD-11 coded diagnoses, prescribe structured medication schedules, order lab investigations, and set follow-ups.
* **FHIR R4 Interoperability**: Formats consultations into **HL7 FHIR R4 Bundles** ready for national network indexing.

### 3. ✨ AI Copilot (Gemini 2.5 Flash)
* **Prescription Explainer**: Patients can tap *"Explain with AI"* on any medical card to translate complex dosages (e.g. *"Metformin 500mg BD after meals"*) and medical jargon into plain English guidelines.
* **Lab Metric Summaries**: Translates lab parameters (WBC, CRP, HbA1c) into easy-to-understand health insights.

---

## 🏗 System Architecture

```
                  ┌───────────────────────────────┐
                  │    Seam Client (Browser/App)  │
                  │  (Patient PHR & Doctor Portal)│
                  └───────────────┬───────────────┘
                                  │ (HTTPS)
                                  ▼
                  ┌───────────────────────────────┐
                  │     Next.js API Gateway       │
                  │   (API Proxy & RSA-OAEP PII   │
                  │       Encryption Layer)       │
                  └───────┬───────────────┬───────┘
                          │               │
               (HTTPS)    │               │    (HTTPS)
        ┌─────────────────┘               └─────────────────┐
        ▼                                                   ▼
┌───────────────────────────────┐             ┌───────────────────────┐
│         ABDM Gateway          │             │     Google Gemini     │
│  (Session tokens, Consent,    │             │   2.5 Flash API Route │
│   FHIR R4 Health Records)     │             │                       │
└───────────────────────────────┘             └───────────────────────┘
```

---

## 🛠 Tech Stack

* **Frontend**: Next.js (TypeScript, App Router), Vanilla CSS.
* **Backend**: Next.js API Routes (Proxy for RSA encryption & ABDM gateway tokens).
* **Database & Storage**: PostgreSQL (Supabase / Neon), Redis (Upstash) for rate-limiting.
* **AI Integration**: Google Gemini 2.5 Flash via `@google/genai`.
* **Standards & Protocols**: HL7 FHIR R4, ABDM Gateway V3 (M1: ABHA, M2: HIP, M3: HIU).

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ installed

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/seam.git

# Navigate into project directory
cd seam

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License
MIT License. Created by Dhruv Kedia.


Built with Next.js 15, deployed on Vercel.

## Getting Started