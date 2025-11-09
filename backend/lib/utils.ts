import type { Request, Response } from 'express';

export function sendError(res: Response, status = 500, message = 'Internal Server Error') {
    return res.status(status).json({ error: message });
}

export function parseIntSafe(value: any, fallback = 0) {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? fallback : n;
}

export function getPagination(query: any) {
    const page = Math.max(1, parseIntSafe(query.page, 1));
    const perPage = Math.min(100, Math.max(1, parseIntSafe(query.perPage, 20)));
    const offset = (page - 1) * perPage;
    return { page, perPage, offset };
}

export function formatMonthFromDate(colName = 'invoiceDate') {
    // For raw SQL month grouping; usage: TO_CHAR("invoiceDate",'YYYY-MM') AS month
    return `TO_CHAR("${colName}", 'YYYY-MM')`;
}
