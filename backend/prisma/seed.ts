import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper function to safely extract values from nested JSON objects
function safeExtract(data: any, defaultVal: any = null): any {
    let extracted = data;
    if (data && typeof data === 'object') {
        if (data.value !== undefined) {
            extracted = data.value;
        } else if (data.$numberLong !== undefined) {
            extracted = data.$numberLong;
        }
    }
    
    // Convert empty strings or nulls to the default value
    if (extracted === null || (typeof extracted === 'string' && extracted.trim() === '')) {
        return defaultVal;
    }
    
    return extracted ?? defaultVal;
}

// Helper function to safely extract and parse numbers
function safeExtractNumber(data: any): number | undefined {
    const extracted = safeExtract(data);
    if (extracted === null || extracted === undefined) {
        return undefined; 
    }
    
    let valueToParse = extracted;
    if (typeof valueToParse === 'string') {
        // Handle common numeric errors like currency symbols in the raw extraction
        valueToParse = valueToParse.replace(/[^\d\.\,-]/g, '').replace(',', '.'); 
    }
    
    const parsed = parseFloat(String(valueToParse));
    // Return undefined for null/NaN values so the database nullability is respected
    return isNaN(parsed) ? undefined : parsed;
}

// Helper function to safely parse dates
function safeParseDate(value: any): Date | undefined {
    const extractedValue = safeExtract(value);
    if (!extractedValue || typeof extractedValue !== 'string') return undefined;
    
    try {
        // Handle ISO-like dates and try to convert
        const date = new Date(extractedValue);
        if (!isNaN(date.getTime())) {
            return date;
        }
    } catch (e) {
        return undefined;
    }
    return undefined;
}


async function main() {
    console.log('Starting data seeding for normalized schema...');
    
    // IMPORTANT: Clear data in the correct order due to foreign key constraints.
    await prisma.lineItem.deleteMany();
    await prisma.paymentDetail.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.validatedData.deleteMany(); 
    await prisma.documentMetadata.deleteMany(); 
    await prisma.customer.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.document.deleteMany();

    console.log('Existing data cleared.');

    // Ensure Analytics_Test_Data.json is in the current working directory
    const rawData = fs.readFileSync(path.join(process.cwd(), 'Analytics_Test_Data.json'), 'utf-8');
    const dataset = JSON.parse(rawData);
    const uniqueVendors = new Map();
    const uniqueCustomers = new Map();
    const recordsToProcess = [];

    // --- PHASE 1: Collect & Normalize Unique Entities (Vendors & Customers) ---
    for (const record of dataset) {
        const llmData = record.extractedData?.llmData;
        if (!llmData || typeof llmData !== 'object') continue;

        const vendorDataRaw = llmData.vendor?.value || {};
        const customerDataRaw = llmData.customer?.value || {};
        const summaryDataRaw = llmData.summary?.value || {};

        // 1. Vendor Extraction - Use vendorName as unique identifier
        const vendorName = safeExtract(vendorDataRaw.vendorName);
        if (vendorName) {
            if (!uniqueVendors.has(vendorName)) {
                uniqueVendors.set(vendorName, {
                    vendorName: vendorName,
                    vendorAddress: safeExtract(vendorDataRaw.vendorAddress),
                    vendorTaxId: safeExtract(vendorDataRaw.vendorTaxId),
                    vendorPartyNumber: safeExtract(vendorDataRaw.vendorPartyNumber),
                });
            }
        }

        // 2. Customer Extraction - Use customerName as unique identifier
        const customerName = safeExtract(customerDataRaw.customerName);
        if (customerName) {
            if (!uniqueCustomers.has(customerName)) {
                uniqueCustomers.set(customerName, {
                    customerName: customerName,
                    customerAddress: safeExtract(customerDataRaw.customerAddress),
                    customerTaxId: safeExtract(customerDataRaw.customerTaxId),
                });
            }
        }
        
        // Only process records that have a valid total amount for the Invoice table
        const invoiceTotal = safeExtractNumber(summaryDataRaw.invoiceTotal);
        if (invoiceTotal !== undefined) {
             recordsToProcess.push(record);
        }
    }

    // --- PHASE 2: Insert Unique Entities and Create Mapping ---
    const vendorMap = new Map<string, string>(); // Maps vendorName -> vendorId
    for (const [name, data] of uniqueVendors.entries()) {
        const vendor = await prisma.vendor.create({ 
            data: {
                // Ensure non-nullable unique field is always present
                vendorName: data.vendorName || `Unknown Vendor ${Math.random()}`,
                vendorAddress: data.vendorAddress,
                vendorTaxId: data.vendorTaxId,
                vendorPartyNumber: data.vendorPartyNumber,
            }
        });
        vendorMap.set(name, vendor.id);
    }
    
    const customerMap = new Map<string, string>(); // Maps customerName -> customerId
    for (const [name, data] of uniqueCustomers.entries()) {
        const customer = await prisma.customer.create({ 
            data: {
                customerName: data.customerName || `Unknown Customer ${Math.random()}`,
                customerAddress: data.customerAddress,
                customerTaxId: data.customerTaxId
            }
        });
        customerMap.set(name, customer.id);
    }

    console.log(`Inserted ${vendorMap.size} unique vendors and ${customerMap.size} unique customers.`);
    
    // --- PHASE 3: Insert Document and Transaction Data ---
    let invoiceCount = 0;
    let lineItemCount = 0;
    let paymentDetailCount = 0;
    
    for (const record of recordsToProcess) {
        const documentId = record._id;
        // FIX: Declare metadata here as it is used outside the scope of record.metadata check
        const metadata = record.metadata || {};
        const llmData = record.extractedData?.llmData;

        // Extract raw fields
        const invoiceDataRaw = llmData?.invoice?.value || {};
        const vendorDataRaw = llmData?.vendor?.value || {};
        const customerDataRaw = llmData?.customer?.value || {};
        const paymentDataRaw = llmData?.payment?.value || {};
        const summaryDataRaw = llmData?.summary?.value || {};
        
        // 1. Insert base Document record
        await prisma.document.create({
            data: {
                id: documentId,
                name: record.name ?? '',
                filePath: record.filePath ?? '',
                fileType: record.fileType ?? 'application/octet-stream',
                fileSize: safeExtractNumber(record.fileSize),
                status: record.status ?? 'uploaded',
                organizationId: record.organizationId ?? 'unknown',
                departmentId: record.departmentId ?? 'unknown',
                uploadedById: record.uploadedById ?? 'unknown',
                createdAt: safeParseDate(record.createdAt) ?? new Date(),
                updatedAt: safeParseDate(record.updatedAt) ?? new Date(),
                processedAt: safeParseDate(record.processedAt),
                isValidatedByHuman: safeExtract(record.isValidatedByHuman, false),
                analyticsId: record.analyticsId,
            }
        });

        // 2. Insert ValidatedData (Audit Table)
        if (record.validatedData) {
            try {
                await prisma.validatedData.create({
                    data: {
                        documentId: documentId,
                        lastValidatedAt: safeParseDate(record.validatedData.lastValidatedAt) ?? new Date(),
                        validatedBy: safeExtract(record.validatedData.validatedBy) ?? 'unknown',
                        status: safeExtract(record.validatedData.status) ?? 'validated',
                    }
                });
            } catch (e: any) {
                 console.warn(`[ValidatedData WARNING] Failed to create ValidatedData for ${documentId}: ${e.message}`);
            }
        }
        
        // 3. Insert DocumentMetadata
        // FIX: Use the 'metadata' object we declared at the start of the loop
        if (metadata.docId) { 
            try {
                await prisma.documentMetadata.create({
                    data: {
                        documentId: documentId,
                        userId: safeExtract(metadata.userId) ?? 'unknown',
                        organizationId: safeExtract(metadata.organizationId) ?? 'unknown',
                        departmentId: safeExtract(metadata.departmentId) ?? 'unknown',
                        templateId: safeExtract(metadata.templateId),
                        templateName: safeExtract(metadata.templateName),
                        title: safeExtract(metadata.title, record.name) ?? '',
                        description: safeExtract(metadata.description),
                        uploadedAt: safeParseDate(metadata.uploadedAt) ?? new Date(),
                        originalFileName: safeExtract(metadata.originalFileName, record.name) ?? '',
                        uploadedBy: safeExtract(metadata.uploadedBy) ?? 'unknown',
                        aiResponseBaseUrl: safeExtract(metadata.aiResponseBaseUrl),
                    }
                });
            } catch (e: any) {
                 console.warn(`[Metadata WARNING] Failed to create DocumentMetadata for ${documentId}: ${e.message}`);
            }
        }


        // 4. Resolve Foreign Keys
        const rawVendorName = safeExtract(vendorDataRaw.vendorName);
        const rawCustomerName = safeExtract(customerDataRaw.customerName);

        const vendorId = rawVendorName ? vendorMap.get(rawVendorName) : undefined;
        const customerId = rawCustomerName ? customerMap.get(rawCustomerName) : undefined;

        if (!vendorId) {
            console.warn(`Skipping Invoice/LineItems/Payment for Document ${documentId}: Vendor ID not resolved, data integrity issue.`);
            continue;
        }

        // 5. Insert Invoice record (main transaction)
        await prisma.invoice.create({
            data: {
                documentId: documentId,
                
                vendorId: vendorId,
                customerId: customerId, 
                
                invoiceNumber: safeExtract(invoiceDataRaw.invoiceId),
                invoiceDate: safeParseDate(invoiceDataRaw.invoiceDate) ?? new Date('1970-01-01'),
                deliveryDate: safeParseDate(invoiceDataRaw.deliveryDate),
                documentType: safeExtract(summaryDataRaw.documentType),
                totalAmount: safeExtractNumber(summaryDataRaw.invoiceTotal) ?? 0,
                totalTax: safeExtractNumber(summaryDataRaw.totalTax),
                subTotal: safeExtractNumber(summaryDataRaw.subTotal),
                currency: safeExtract(summaryDataRaw.currencySymbol),
            }
        });
        invoiceCount++;
        
        // 6. Insert Payment Details (1:1 relation to Invoice via documentId)
        if (Object.keys(paymentDataRaw).length > 0 && 
            Object.values(paymentDataRaw).some(val => safeExtract(val) !== null)) {
            
            await prisma.paymentDetail.create({
                data: {
                    invoiceDocumentId: documentId,
                    dueDate: safeParseDate(paymentDataRaw.dueDate),
                    paymentTerms: safeExtract(paymentDataRaw.paymentTerms),
                    bankAccountNumber: safeExtract(paymentDataRaw.bankAccountNumber),
                    BIC: safeExtract(paymentDataRaw.BIC),
                    accountName: safeExtract(paymentDataRaw.accountName),
                    netDays: safeExtractNumber(paymentDataRaw.netDays),
                    discountPercentage: safeExtractNumber(paymentDataRaw.discountPercentage),
                    discountDays: safeExtractNumber(paymentDataRaw.discountDays),
                    discountDueDate: safeParseDate(paymentDataRaw.discountDueDate),
                    discountedTotal: safeExtractNumber(paymentDataRaw.discountedTotal),
                }
            });
            paymentDetailCount++;
        }
        
        // 7. Insert Line Items (1:M relation to Invoice via documentId)
        let lineItemsArray = llmData?.lineItems?.value?.items?.value || [];
        if (!Array.isArray(lineItemsArray) && Array.isArray(llmData?.lineItems?.value)) {
             lineItemsArray = llmData.lineItems.value; // Handle alternate nesting
        }
        
        // Normalize item structure (flatten value nesting if present) AND FIX: Convert number fields to string for Sachkonto/BUSchluessel
        if (Array.isArray(lineItemsArray)) {
            lineItemsArray = lineItemsArray.map(item => {
                if (typeof item === 'object' && item !== null) {
                    const newItem: any = {};
                    for (const key in item) {
                        newItem[key] = safeExtract(item[key]);
                    }
                    return newItem;
                }
                return item;
            });
        }


        if (Array.isArray(lineItemsArray) && lineItemsArray.length > 0) {
            const lineItemCreations = lineItemsArray.map((item: any, index: number) => ({
                invoiceDocumentId: documentId,
                line_number: safeExtractNumber(item.srNo) ?? (index + 1),
                description: safeExtract(item.description),
                quantity: safeExtractNumber(item.quantity),
                unitPrice: safeExtractNumber(item.unitPrice),
                totalPrice: safeExtractNumber(item.totalPrice),
                // FIX: Explicitly convert numeric fields that should be Strings in Prisma
                Sachkonto: String(safeExtract(item.Sachkonto) ?? ''),
                BUSchluessel: String(safeExtract(item.BUSchluessel) ?? ''),
                vatRate: safeExtractNumber(item.vatRate),
                vatAmount: safeExtractNumber(item.vatAmount),
            }));

            const result = await prisma.lineItem.createMany({
                data: lineItemCreations,
                skipDuplicates: true,
            });
            lineItemCount += result.count;
        }
    }

    console.log('\n--- Seeding Summary ---');
    console.log(`Documents successfully processed for Invoice creation: ${invoiceCount} out of ${recordsToProcess.length} valid records.`);
    console.log(`Total Unique Vendors inserted: ${vendorMap.size}`);
    console.log(`Total Unique Customers inserted: ${customerMap.size}`);
    console.log(`Total Payment Details inserted: ${paymentDetailCount}`);
    console.log(`Total Line Items inserted: ${lineItemCount}`);
}

main()
    .catch((err) => {
        console.error('error while seeding data:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });