import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

function sendError(res: Response, status = 500, message = 'Internal Server Error'): Response {
    return res.status(status).json({ error: message });
}

export async function getCashOutflow(req: Request, res: Response): Promise<Response> {
    try {
        const { from, to } = req.query as { from?: string; to?: string };

        const queryParams: Prisma.Sql[] = [];
        let conditionStrings: string[] = [];
        let paramIndex = 1; // SQL parameter index starts at 1

        if (from) {
            conditionStrings.push(`pd."dueDate" >= $${paramIndex}`);
            queryParams.push(Prisma.sql`${from}`);
            paramIndex++;
        } else {
            conditionStrings.push(`pd."dueDate" >= CURRENT_DATE`);
        }

        if (to) {
            conditionStrings.push(`pd."dueDate" <= $${paramIndex}`);
            queryParams.push(Prisma.sql`${to}`);
            paramIndex++;
        }
        const whereClause = conditionStrings.length > 0 ? `WHERE ${conditionStrings.join(' AND ')}` : '';
        const rawQuery = Prisma.sql`
            SELECT 
                pd."dueDate"::date AS date,
                SUM(COALESCE(pd."discountedTotal", i."totalAmount", 0)) AS expected_outflow
            FROM "payment_details" pd
            JOIN "invoices" i ON i."documentId" = pd."invoiceDocumentId"
            ${Prisma.raw(whereClause)}
            GROUP BY 1 -- Group by date
            ORDER BY 1 -- Order by date
            LIMIT 365;
        `;
        
        const rows = await prisma.$queryRaw(rawQuery, ...queryParams);

        const data = (rows as any[]).map(r => ({
            date: r.date.toISOString().split('T')[0], 
            expected_outflow: parseFloat(Number(r.expected_outflow ?? 0).toFixed(2)),
        }));

        return res.json(data);
    } catch (err: any) {
        console.error("getCashOutflow error:", err);
        return sendError(res, 500, 'Failed to fetch cash outflow data.');
    }
}

export async function getCategorySpend(req: Request, res: Response): Promise<Response> {
    try {
        const query = Prisma.sql`
            SELECT 
                COALESCE("Sachkonto", "BUSchluessel", 'Unknown') AS category,
                SUM(COALESCE("totalPrice", 0)) AS spend
            FROM "line_items"
            GROUP BY 1
            ORDER BY spend DESC;
        `;

        const rows = await prisma.$queryRaw<
            { category: string; spend: Decimal }[]
        >(query);

        const data = rows.map(r => ({
            category: r.category,
            spend: parseFloat(Number(r.spend).toFixed(2))
        }));

        return res.json(data);
    } catch (err: any) {
        console.error("Category Spend Error:", err);
        return sendError(res, 500, 'Failed to fetch category spend data.');
    }
}