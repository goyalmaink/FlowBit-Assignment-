# FlowBit-Assignment-
Flowbit Private Limited - Full Stack Developer Internship Assignment

Project Title: Transactional Analytics & AI Data Chat

Submitted by: Mayank Goel

🚀 Overview

This repository contains a production-grade full-stack web application designed to meet the requirements of the Flowbit Full Stack Developer Internship assignment. The solution consists of two integrated services: a responsive Analytics Dashboard built with Next.js and a "Chat with Data" Interface powered by Groq and a normalized PostgreSQL database.

The project emphasizes robust data modeling, efficient backend API design, pixel-perfect frontend implementation, and secure AI integration.

Core Technology Stack

Layer

Technology

Purpose

Monorepo

Node.js / TypeScript

Project Structure and Type Safety

Frontend

Next.js (App Router), React, TailwindCSS, shadcn/ui, Recharts

Interactive Dashboard and User Interface

Backend/API

Node.js (Express), Prisma ORM

REST API endpoints for data aggregation

Database

PostgreSQL (Supabase)

Centralized, Normalized Storage

AI Layer

Groq (Direct Integration)

Natural Language to SQL generation

🛠️ Setup and Installation

Follow these steps to set up the project locally. Note that for deployment, services must be configured separately (Vercel for Next.js, Supabase for DB).

Prerequisites

Node.js (v18+) and npm

PostgreSQL Database instance (Supabase highly recommended)

Groq API Key (required for the Chat with Data feature)

1. Repository Clone & Installation

# Clone the repository
git clone [YOUR_REPOSITORY_URL]
cd [project-root]

# Install dependencies (assuming npm workspaces / monorepo setup)
npm install


2. Environment Configuration

Create a .env file in your root directory and populate it with the following variables:

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


3. Database Migration and Seeding

We use Prisma for schema management and TypeScript for seeding.

# Apply the schema to the PostgreSQL database
npx prisma db push

# Run the seeding script to ingest data from Analytics_Test_Data.json
# NOTE: Ensure Analytics_Test_Data.json is present in the prisma/ directory
npx ts-node prisma/seed.ts


4. Run the Application

# Start the Backend (API Server)
npm run dev 
# (This typically runs on http://localhost:8000)

# Start the Frontend (Next.js)
# (Navigate to your frontend start script/folder and run)
npm run dev


🏛️ Database Schema and Normalization

The raw Analytics_Test_Data.json (nested document structure) was meticulously normalized into a production-grade relational schema across 7 tables, ensuring referential integrity and preventing data redundancy for clean analytics.

Key Schema Decisions:

Table Name

Role

Relationship

Rationale

vendors

Master Data

1:M with invoices

Stores unique vendor details (name, tax ID).

customers

Master Data

1:M with invoices

Stores unique customer details.

invoices

Transaction Core

1:1 with documents, 1:M with line_items

Consolidates key header data (totalAmount, invoiceDate) from the raw invoice and summary blocks.

line_items

Transaction Detail

M:1 with invoices

Stores itemized lines, crucial for category analysis (Sachkonto).

payment_details

Supplemental Data

1:1 with invoices

Stores due dates and bank information for cash flow forecasting.

documents

File Metadata

1:1 with invoices

Stores original file metadata and file status.

validated_data

Audit Trail

1:1 with documents

Stores human validation and audit timestamps.

💻 Backend API Endpoints (Node.js/Prisma)

All endpoints are built using Express/TypeScript and the Prisma ORM to execute queries against the normalized PostgreSQL schema.

Endpoint

Method

Description

Key Tables Used

/stats

GET

Returns aggregated metrics for Overview Cards (Spend YTD, Total Invoices, Average Value).

invoices, documents

/invoice-trends

GET

Provides time-series data: monthly count and value trend.

invoices (Grouped by date)

/vendors/top10

GET

Ranks and returns the top 10 vendors by total spend.

invoices, vendors (Aggregated and Joined)

/category-spend

GET

Calculates total spend grouped by Sachkonto or BUSchluessel (Category Chart).

line_items

/cash-outflow

GET

Forecasts cash obligations based on payment due dates.

invoices, payment_details

/invoices

GET

Paginated, searchable, and sortable list of invoices for the table view.

invoices, vendors, payment_details

/chat-with-data

POST

AI Endpoint: Receives NL query, sends to Groq, executes generated SQL, and returns results.

All tables

🤖 AI Integration: Chat with Data Workflow

The "Chat with Data" feature is the most advanced component, enabling non-technical users to query data using natural language.

Frontend (Next.js): Sends the user's natural language question to the backend at /chat-with-data.

Backend (Node.js/TypeScript):

Receives the query.

Constructs a highly descriptive System Prompt detailing the normalized PostgreSQL schema (table names, column names, relationships) and the PostgreSQL syntax rules (e.g., camelCase in double quotes).

Sends the prompt to Groq.

LLM (Groq): Generates a precise, optimized PostgreSQL SELECT query based on the prompt and the user's question.

Backend (Node.js/Prisma): Receives the raw SQL string and safely executes it against the PostgreSQL database using prisma.$queryRawUnsafe().

Frontend (Next.js): Receives the generated SQL and the resulting dataset, displaying both the code and the data in a responsive table.

🌟 Bonus & Improvements Implemented

Production-Grade UI: The dashboard implements TailwindCSS and shadcn/ui for a clean, modern, and fully responsive design, matching the spirit of the Figma brief.

Dynamic Status Calculation: Invoice status (Overdue, Due, Processed) is calculated dynamically on the server based on the payment_details.dueDate and the current date, ensuring accuracy in the listInvoices API.

Robust Data Seeding: The prisma/seed.ts file handles complex JSON nesting and performs necessary data cleanup (e.g., parsing dates, handling nulls, type conversions for Sachkonto) before ingestion.

Detailed Analytics Mappings: Charts are correctly mapped from the raw data, including using Sachkonto/BUSchluessel for category distribution.

👤 Personal Space

[This is where you can add information about your specific deployment URLs, personal reflections on the challenges faced (e.g., handling case sensitivity in raw SQL or nested JSON parsing), or any specific performance considerations.]

Deployment URLs:

Frontend (Vercel): [Your Vercel URL here]

Database (Supabase): [Your Database Host]

Challenge Insight:
[A short paragraph on a challenge, e.g., "The greatest challenge was migrating the raw nested JSON into a truly normalized schema while preserving all extracted fields. Using Prisma's raw SQL with dynamic quoting was essential for implementing the aggregate chart APIs efficiently."]

Future Improvements (Bonus Scope):
[List any planned or future enhancements, such as implementing persistent chat history (using another collection in Supabase) or adding user authentication.]
