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
---
```


### 🏛️ Database Schema and Normalization

The raw `Analytics_Test_Data.json` (nested document structure) was meticulously normalized into a production-grade relational schema across **7 tables**, ensuring referential integrity and preventing redundancy.

| Table Name | Role | Relationship | Rationale |
|-------------|------|--------------|------------|
| vendors | Master Data | 1:M with invoices | Stores unique vendor details (name, tax ID). |
| customers | Master Data | 1:M with invoices | Stores unique customer details. |
| invoices | Transaction Core | 1:1 with documents, 1:M with line_items | Consolidates invoice and summary blocks. |
| line_items | Transaction Detail | M:1 with invoices | Stores itemized lines for category analysis (Sachkonto). |
| payment_details | Supplemental Data | 1:1 with invoices | Stores due dates and bank information for cash flow forecasting. |
| documents | File Metadata | 1:1 with invoices | Stores original file metadata and file status. |
| validated_data | Audit Trail | 1:1 with documents | Stores human validation and audit timestamps. |

---

## 💻 Backend API Endpoints (Node.js / Prisma)

All endpoints are built using Express/TypeScript and Prisma ORM to execute queries against the normalized PostgreSQL schema.

| Endpoint | Method | Description | Key Tables Used |
|-----------|--------|-------------|----------------|
| `/stats` | GET | Returns aggregated metrics (Spend YTD, Total Invoices, etc.) | invoices, documents |
| `/invoice-trends` | GET | Provides monthly count and value trend | invoices |
| `/vendors/top10` | GET | Returns top 10 vendors by total spend | invoices, vendors |
| `/category-spend` | GET | Calculates total spend by category (Sachkonto/BUSchluessel) | line_items |
| `/cash-outflow` | GET | Forecasts cash obligations (due dates) | invoices, payment_details |
| `/invoices` | GET | Paginated, searchable invoice list | invoices, vendors, payment_details |
| `/chat-with-data` | POST | AI endpoint: NL query → SQL → results | all tables |

---

## 🤖 AI Integration: Chat with Data Workflow

The **Chat with Data** feature enables non-technical users to query data using natural language.

**Workflow:**
1. **Frontend (Next.js)** sends the user’s question to `/chat-with-data`.
2. **Backend (Node.js/TypeScript)**:
   - Constructs a system prompt describing the database schema and syntax conventions.
   - Sends this prompt and the user query to **Groq**.
3. **Groq LLM** generates an optimized PostgreSQL `SELECT` statement.
4. **Backend** safely executes the query using `prisma.$queryRawUnsafe()`.
5. **Frontend** receives both SQL and results, rendering them in a responsive table.

---

## 🌟 Bonus & Improvements Implemented

- **Production-Grade UI:** Built with TailwindCSS and shadcn/ui for a clean, modern, and fully responsive design.  
- **Dynamic Status Calculation:** Invoice status (Overdue, Due, Processed) is dynamically computed server-side using payment due dates.  
- **Robust Data Seeding:** `prisma/seed.ts` handles nested JSON, nulls, and schema-aware type conversions.  
- **Detailed Analytics Mapping:** Charts accurately represent category distribution using Sachkonto/BUSchluessel.

---

## 👤 Personal Space

### Deployment URLs
- **Frontend (Vercel):** [Your Vercel URL here]  
- **Database (Supabase):** [Your Database Host here]

### Screen Shots
- **DashBoard View**
<img width="1280" height="696" alt="image" src="https://github.com/user-attachments/assets/7e3edf57-9560-41a6-b56a-a27cd48b36b4" />
<img width="1600" height="923" alt="image" src="https://github.com/user-attachments/assets/f57dcd34-c601-4ad1-9f8d-6f414400e16e" />

- **AI Chat View**
  <img width="1280" height="698" alt="image" src="https://github.com/user-attachments/assets/bf658732-81a0-4b30-9ed7-6fb30b24de83" />




### Challenge Insight
*The most challenging part was migrating the deeply nested JSON data into a normalized relational schema while preserving all extracted fields. Leveraging Prisma’s raw SQL capabilities with dynamic quoting was crucial for efficient aggregate query implementation.*

### Future Improvements
- Add persistent **chat history** in Supabase  
- Implement **user authentication and role-based access**  
- Enhance data visualization with **drill-down charts**  
- Introduce **query caching** for frequent analytics requests  

---

🧩 *End of README*

 
