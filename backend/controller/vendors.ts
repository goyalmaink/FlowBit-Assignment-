import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

function sendError(res: Response, status = 500, message = 'Internal Server Error'): Response {
    return res.status(status).json({ error: message });
}

export async function getTopVendors(req: Request, res: Response): Promise<Response> {
    try {
        const vendorSpend = await prisma.invoice.groupBy({
            by: ['vendorId'],
            _sum: {
                totalAmount: true,
            },
            orderBy: {
                _sum: {
                    totalAmount: 'desc', // Sort by total spend descending
                },
            },
            take: 10, // Limit to the top 10
        });

        const topVendorIds = vendorSpend.map(item => item.vendorId);
        const vendorDetails = await prisma.vendor.findMany({
            where: {
                id: {
                    in: topVendorIds,
                },
            },
            select: {
                id: true,
                vendorName: true,
            },
        });

        const data = vendorSpend.map(spend => {
            const detail = vendorDetails.find(d => d.id === spend.vendorId);
            const totalSpend = Number(spend._sum.totalAmount ?? 0);
            return {
                vendorId: spend.vendorId,
                vendorName: detail?.vendorName ?? 'Unknown Vendor',
                totalSpend: parseFloat(totalSpend.toFixed(2)),
            };
        });

        return res.json(data);
    } catch (err: any) {
        console.error("getTopVendors error:", err);
        return sendError(res, 500, 'Failed to fetch top vendors data.');
    }
}