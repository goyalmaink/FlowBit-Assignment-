import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Groq } from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

function sendError(res: Response, status = 500, message = 'Internal Server Error') {
    return res.status(status).json({ error: message });
}

export default async function ChatWithData(req: Request, res: Response) {
    try {
        const { query } = req.body;

        if (!query || typeof query !== "string") {
            return sendError(res, 400, "Missing or invalid 'query'.");
        }
        const prompt = `
You are an expert SQL data analyst for a PostgreSQL database.
Your task is to write a valid SQL SELECT query to answer the following question:
"${query}"

Use ONLY the following tables and their columns:
1. "invoices" (i): documentId, invoiceNumber, invoiceDate, deliveryDate, documentType, totalAmount, totalTax, subTotal, currency, vendorId, customerId
2. "vendors" (v): id, vendorName, vendorAddress, vendorTaxId
3. "customers" (c): id, customerName, customerAddress, customerTaxId
4. "line_items" (li): id, invoiceDocumentId, line_number, description, quantity, unitPrice, totalPrice, Sachkonto, BUSchluessel
5. "payment_details" (pd): invoiceDocumentId, dueDate, paymentTerms, bankAccountNumber

RULES:
- When referencing columns in joins, use **double quotes and camelCase** (e.g., i."invoiceDate").
- Use aliases (i, v, c, li, pd) for brevity.
- Join tables using Foreign Keys: 
    - invoices.vendorId = vendors.id
    - invoices.customerId = customers.id
    - line_items.invoiceDocumentId = invoices.documentId
    - payment_details.invoiceDocumentId = invoices.documentId
- Always output a valid PostgreSQL SELECT query. Do not include markdown, explanations, or quotes around the SQL.
`;

        const completion = await groq.chat.completions.create({

            model: "groq/compound",
            messages: [
                { role: "system", content: "You are a data-to-SQL translator for PostgreSQL. Follow all user rules strictly." },
                { role: "user", content: prompt },
            ],
            temperature: 0.3,
        });

        let sql = completion.choices?.[0]?.message?.content?.trim() || "";
        sql = sql.replace(/```sql|```/g, "").trim();

        console.log("🧠 Generated SQL:", sql);

        if (!sql.toLowerCase().startsWith("select")) {
            return sendError(res, 400, "Generated SQL is not a valid SELECT query for safety.");
        }

        const results = await prisma.$queryRawUnsafe(sql);

        return res.status(200).json({
            success: true,
            sql,
            results,
        });

    } catch (error: any) {
        console.error("ChatWithData Execution Error:", error);
        const errorMessage = error.message || "Internal Server Error";
        return sendError(res, 500, `Query Failed: ${errorMessage.substring(0, 150)}...`);
    }
}