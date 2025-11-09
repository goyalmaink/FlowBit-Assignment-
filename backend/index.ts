import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import { getStats } from "./controller/stats.js";
import { getTopVendors } from "./controller/vendors.js";
import { getCategorySpend } from "./controller/categories.js";
import { getInvoiceTrends } from "./controller/invoiceTrend.js";
import getCashOutflow from "./controller/cashflow.js";
import listInvoices from "./controller/invoice.js";
import ChatWithData from "./controller/chat.js";
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = 8000;
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send(" Backend server is running successfully!");
});

app.get('/stats', getStats); // working 
app.get('/invoice-trends', getInvoiceTrends); //working
app.get('/vendors/top10', getTopVendors); //working
app.get('/category-spend', getCategorySpend); //working 
app.get('/cash-outflow', getCashOutflow); //working 
app.get('/invoices', listInvoices); //working 
app.post('/chat-with-data', ChatWithData);
app.listen(PORT, () => {
  console.log(` Server started on http://localhost:${PORT}`);
});


