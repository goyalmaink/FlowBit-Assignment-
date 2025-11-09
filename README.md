# Flowbit Private Limited - Full Stack Developer Internship Assignment
**Project Title: Transactional Analytics & AI Data Chat**
**Submitted by: Mayank Goel**

## 🚀 Overview
This repository contains a **production-grade full-stack web application** designed for the Flowbit Full Stack Developer Internship assignment. The solution delivers two fully integrated services: a **responsive Analytics Dashboard** built with Next.js and a powerful **"Chat with Data" Interface** powered by Groq and a normalized PostgreSQL database.

The project emphasizes robust data modeling, efficient backend API design, a pixel-perfect frontend, and secure AI integration to deliver a comprehensive transactional analytics platform.

### Core Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Monorepo** | Node.js / TypeScript | Project Structure and Type Safety |
| **Frontend** | Next.js (App Router), React, TailwindCSS, shadcn/ui, Recharts | Interactive Dashboard and User Interface |
| **Backend/API** | Node.js (Express), Prisma ORM | REST API endpoints for data aggregation |
| **Database** | PostgreSQL (Supabase) | Centralized, Normalized Storage |
| **AI Layer** | Groq (Direct Integration) | Natural Language to SQL generation |

---

## 🛠️ Setup and Installation

Follow these steps to set up the project locally. Services must be configured separately for deployment (e.g., Vercel for Next.js, Supabase for DB).

### Prerequisites
* **Node.js (v18+)** and `npm`
* **PostgreSQL Database instance** (Supabase highly recommended)
* **Groq API Key** (required for the Chat with Data feature)

### 1. Repository Clone & Installation
```bash
# Clone the repository
git clone [YOUR_REPOSITORY_URL]
cd [project-root]

# Install dependencies (assuming npm workspaces / monorepo setup)
npm install

# --- Database Configuration (PostgreSQL) ---
# NOTE: Use the NON-POOLING/DIRECT connection string for local development
DATABASE_URL="postgresql://[user]:[password]@[host].supabase.co:5432/[database]"
# DIRECT_URL is required by Prisma but often the same as DATABASE_URL locally
DIRECT_URL="postgresql://[user]:[password]@[host].supabase.co:5432/[database]"

# --- AI Configuration ---
# Your Groq API Key for the Chat with Data feature
GROQ_API_KEY="sk_..."

# --- Frontend Configuration ---
NEXT_PUBLIC_API_BASE=http://localhost:8000 # Change to Vercel URL upon deployment

# Apply the schema to the PostgreSQL database
npx prisma db push

# Run the seeding script to ingest data from Analytics_Test_Data.json
# NOTE: Ensure Analytics_Test_Data.json is present in the prisma/ directory
npx ts-node prisma/seed.ts

# Start the Backend (API Server)
npm run dev 
# (This typically runs on http://localhost:8000)

# Start the Frontend (Next.js)
# (Navigate to your frontend start script/folder and run)
npm run dev
