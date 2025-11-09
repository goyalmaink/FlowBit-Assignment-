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


export  default async function listInvoices(req: Request, res: Response): Promise<Response> {
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
        sortColumn = '"invoiceDate"'; // Explicitly quoting
        break;
      case 'invoiceNumber':
        sortColumn = '"invoiceNumber"'; // Explicitly quoting
        break;
      case 'amount':
        sortColumn = '"totalAmount"'; // Explicitly quoting
        break;
      case 'vendor':
        sortColumn = '"vendorName"'; // Explicitly quoting (from VENDOR table alias V)
        break;
      default:
        sortColumn = '"invoiceDate"';
    }

    const orderDir = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const orderByClause = Prisma.raw(`ORDER BY ${sortColumn} ${orderDir}`); 
    const selectFields = Prisma.sql`
        i."documentId",
        i."invoiceNumber" AS "invoiceNumber",
        i."invoiceDate" AS "invoiceDate",
        v."vendorName" AS "vendorName",
        i."totalAmount" AS "totalAmount",
        pd."dueDate" AS "dueDate",
        d.status AS "documentStatus"
    `;

    const fromClauses = Prisma.sql`
        FROM "invoices" i
        JOIN "vendors" v ON v.id = i."vendorId"
        LEFT JOIN "payment_details" pd ON pd."invoiceDocumentId" = i."documentId"
        JOIN "documents" d ON d.id = i."documentId"
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
        const documentStatus = r.documentStatus;

        if (dueDate && dueDate < new Date() && documentStatus === 'processed') {
            statusDisplay = 'Overdue';
        } else if (dueDate && documentStatus === 'processed') {
            statusDisplay = 'Due';
        } else {
             statusDisplay = documentStatus;
        }

        return {
            documentId: r.documentId,
            vendor: r.vendorName,
            date: r.invoiceDate.toISOString().split('T')[0],
            invoiceNumber: r.invoiceNumber,
            amount: parseFloat(Number(r.totalAmount).toFixed(2)),
            status: statusDisplay, // This is the calculated status
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
