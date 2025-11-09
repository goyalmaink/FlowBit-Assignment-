import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

function sendError(res: Response, status = 500, message = 'Internal Server Error'): Response {
    return res.status(status).json({ error: message });
}

function parseIntSafe(value: any, fallback = 0): number {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? fallback : n;
}

function getPagination(query: any) {
    const page = Math.max(1, parseIntSafe(query.page, 1));
    const perPage = Math.min(100, Math.max(1, parseIntSafe(query.perPage, 20)));
    const offset = (page - 1) * perPage;
    return { page, perPage, offset };
}

export async function listInvoices(req: Request, res: Response): Promise<Response> {
    try {
        const { search = '', sortBy = 'invoiceDate', order = 'desc' } = req.query as any;
        const { page, perPage, offset } = getPagination(req.query);

        const queryParams: Prisma.Sql[] = [];
        const whereConditions: string[] = [];
        let paramIndex = 1;


        if (search && String(search).trim() !== '') {
            const s = `%${String(search).trim()}%`;
            whereConditions.push(`v."vendorName" ILIKE $${paramIndex} OR i."invoiceNumber" ILIKE $${paramIndex + 1}`);
            queryParams.push(Prisma.sql`${s}`);
            queryParams.push(Prisma.sql`${s}`);
            paramIndex += 2;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        let sortColumn: string;
        switch (String(sortBy)) {
            case 'invoiceDate':
                sortColumn = 'invoiceDate';
                break;
            case 'invoiceNumber':
                sortColumn = 'invoiceNumber';
                break;
            case 'amount':
                sortColumn = 'totalAmount';
                break;
            case 'vendor':
                sortColumn = 'vendorName';
                break;
            default:
                sortColumn = 'invoiceDate';
        }

        const orderDir = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const orderByClause = Prisma.raw(`ORDER BY ${sortColumn} ${orderDir}`);


        const selectFields = Prisma.sql`
        i."documentId",
        i."invoiceNumber" AS "invoiceNumber",
        i."invoiceDate" AS "invoiceDate",
        v."vendorName" AS "vendorName",
        i."totalAmount" AS "totalAmount",
        i."status" AS "status",
        pd."dueDate" AS "dueDate"
    `;

        const fromClauses = Prisma.sql`
        FROM "invoices" i
        JOIN "vendors" v ON v.id = i."vendorId"
        LEFT JOIN "payment_details" pd ON pd."invoiceDocumentId" = i."documentId"
    `;

        const dataQuery = Prisma.sql`
        SELECT ${selectFields}
        ${fromClauses}
        ${Prisma.raw(whereClause)}
        ${orderByClause}
        LIMIT ${perPage} OFFSET ${offset};
    `;

        const countQuery = Prisma.sql`
        SELECT COUNT(i."documentId")::int AS total
        ${fromClauses}
        ${Prisma.raw(whereClause)};
    `;

        const [rows, countRows] = await prisma.$transaction([
            prisma.$queryRaw(dataQuery, ...queryParams),
            prisma.$queryRaw(countQuery, ...queryParams)
        ]);
        const total = (countRows as { total: number }[])[0]?.total ?? 0;
        const totalPages = Math.ceil(total / perPage);

        const processedData = (rows as any[]).map(r => {
            const dueDate = r.dueDate ? new Date(r.dueDate) : null;
            let statusDisplay: string;

            if (dueDate && dueDate < new Date()) {
                statusDisplay = 'Overdue';
            } else if (r.status === 'processed') {
                statusDisplay = 'Processed';
            } else if (dueDate) {
                statusDisplay = 'Due';
            } else {
                statusDisplay = 'Unknown';
            }

            return {
                documentId: r.documentId,
                vendor: r.vendorName,
                date: r.invoiceDate.toISOString().split('T')[0],
                invoiceNumber: r.invoiceNumber,
                amount: parseFloat(Number(r.totalAmount).toFixed(2)),
                status: statusDisplay,
            };
        });

        return res.json({
            meta: { page, perPage, totalPages, total },
            data: processedData,
        });
    } catch (err: any) {
        console.error('listInvoices error:', err);
        return sendError(res, 500, err.message ?? 'Failed to list invoices');
    }
}

export async function getInvoiceTrends(req: Request, res: Response): Promise<Response> {
    try {
        const query = Prisma.sql`
            SELECT 
                TO_CHAR(i."invoiceDate", 'YYYY-MM') AS month,
                COUNT(i."documentId")::int AS invoice_count,
                SUM(COALESCE(i."totalAmount", 0)) AS total_spend
            FROM "invoices" i
            GROUP BY 1
            ORDER BY 1;
        `;

        const rows = await prisma.$queryRaw(query);
        const data = (rows as { month: string; invoice_count: number; total_spend: Decimal }[]).map(r => ({
            month: r.month,
            invoiceCount: r.invoice_count,
            totalSpend: parseFloat(Number(r.total_spend).toFixed(2)),
        }));

        return res.json(data);
    } catch (err: any) {
        console.error("getInvoiceTrends error:", err);
        return sendError(res, 500, 'Failed to fetch invoice trends.');
    }
}