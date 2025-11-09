import type { Request, Response } from 'express'
import { PrismaClient } from "@prisma/client";
// import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

function sendError(res: Response, status = 500, message = 'Internal Server Error'): Response {
    return res.status(status).json({ error: message });
}

export const getStats = async (req: Request, res: Response): Promise<Response> => {
    try {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const aggResults = await prisma.invoice.aggregate({
            _sum: {
                totalAmount: true,
            },
            _avg: {
                totalAmount: true,
            },
            where: {
                invoiceDate: {
                    gte: yearStart,
                },
            },
        });
        
        const totalInvoice = await prisma.invoice.count();
        const documentUploaded = await prisma.document.count();
        const totalSpendYtd = Number(aggResults._sum.totalAmount ?? 0);
        const averageInvoiceValue = Number(aggResults._avg.totalAmount ?? 0);

        return res.json({
            totalSpendYtd: parseFloat(totalSpendYtd.toFixed(2)),
            totalInvoicesProcessed: totalInvoice,
            documentsUploaded: documentUploaded,
            averageInvoiceValue: parseFloat(averageInvoiceValue.toFixed(2)),
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return sendError(res, 500, 'An error occurred while fetching dashboard stats.');
    } finally {
        // await prisma.$disconnect(); 
    }
}