
"use client";
import React, { useState, useEffect } from 'react';
import ChatWithData from './component/ChatWithData';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, FileText, Upload, DollarSign, Menu, Home, Receipt, File, Users, Settings, Building2 } from 'lucide-react';

// --- TYPE DEFINITIONS (Ensure these match your frontend usage) ---

type StatsData = {
  totalSpendYtd: number;
  totalInvoicesProcessed: number; // Corrected property name
  documentsUploaded: number;      // Corrected property name
  averageInvoiceValue: number;
};
type InvoiceVolumeData = { month: string; invoiceCount: number; totalSpend: number }; // Corrected property names
type VendorSpendItem = { name: string; totalSpend: number }; // Corrected property name
type CategoryItem = { name: string; value: number; color: string };
type CashOutflowItem = { range: string; amount: number };
type InvoiceItem = { documentId: string; vendor: string; invoiceNumber: string; date: string; amount: number; status: string };

// --- STATIC FALLBACK DATA (Using simplified structure for missing API data) ---

const FALLBACK_STATS = {
    totalSpendYtd: 12679.25,
    totalInvoicesProcessed: 49,
    documentsUploaded: 50,
    averageInvoiceValue: 2455.00
  } as StatsData;

const FALLBACK_TRENDS: InvoiceVolumeData[] = [
  { month: '2024-01', invoiceCount: 5, totalSpend: 3500 },
  { month: '2024-02', invoiceCount: 7, totalSpend: 4200 },
  { month: '2024-03', invoiceCount: 10, totalSpend: 5800 },
  { month: '2024-04', invoiceCount: 8, totalSpend: 4900 },
  { month: '2024-05', invoiceCount: 9, totalSpend: 6100 },
  { month: '2024-06', invoiceCount: 11, totalSpend: 7500 },
];
const FALLBACK_VENDORS: VendorSpendItem[] = [
    { name: 'CPB Software', totalSpend: 8352.00 },
    { name: 'Pixa', totalSpend: 3653.30 },
    { name: 'Auto Teile Europa GmbH', totalSpend: 618.80 },
    { name: 'EasyFirma GmbH', totalSpend: 2840.00 },
    { name: 'Musterfirma Müller', totalSpend: -717.58 }, // Negative value for Credit Note
];
const FALLBACK_CATEGORIES: CategoryItem[] = [
    { name: '4400', value: 5000.00, color: '#3B82F6' },
    { name: '3400', value: 4500.00, color: '#FB923C' },
    { name: '4925', value: 19.99, color: '#FCD34D' },
    { name: '4910', value: 1750.00, color: '#34D399' },
    { name: '4200', value: 197.10, color: '#A78BFA' }
];

const FALLBACK_CASH: CashOutflowItem[] = [
  { range: '2025-11-09', amount: 1200 },
  { range: '2025-11-14', amount: 3500 },
  { range: '2025-12-01', amount: 15000 },
  { range: '2026-01-01', amount: 80000 }
];


// --- UTILITY FUNCTIONS ---

const formatCurrency = (value: number | string | undefined | null) => {
  if (value === null || value === undefined) return '€ 0.00';
  return `€ ${Number(value).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatLargeNumber = (value: number | string | undefined | null) => {
  const num = Number(value);
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return String(num);
};

// --- STAT CARD COMPONENT ---

type StatCardProps = {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
  icon?: React.ComponentType<any>;
  period?: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon, period = '' }) => (
  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 transition duration-300 hover:shadow-lg">
    <div className="flex justify-between items-start mb-3">
      <span className="text-sm text-gray-600 font-medium">{title}</span>
      {period && <span className="text-xs text-gray-400">{period}</span>}
    </div>
    <div className="flex items-end justify-between">
      <div>
        <div className="text-3xl font-extrabold text-gray-900 leading-none">{value}</div>
        <div className={`flex items-center text-sm mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          <span className="font-semibold">{change}</span>
        </div>
      </div>
      {Icon && (
        <div className="text-gray-300 relative">
          <Icon className="w-10 h-10 absolute -top-2 right-0 opacity-10 text-indigo-500" />
          <svg className="w-16 h-12" viewBox="0 0 80 40">
            <path d={trend === 'up' ? "M 0 35 Q 20 20 40 25 T 80 10" : "M 0 10 Q 20 25 40 20 T 80 35"} fill="none" stroke="currentColor" strokeWidth="2" className={trend === 'up' ? 'text-green-500' : 'text-red-500'} />
          </svg>
        </div>
      )}
    </div>
  </div>
);

// --- SIDEBAR COMPONENT ---

type SidebarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'chat', icon: Users, label: 'Chat with Data' },
    { id: 'invoice', icon: Receipt, label: 'Invoices Table' },
    { id: 'files', icon: File, label: 'Other files' },
    { id: 'departments', icon: Building2, label: 'Departments' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col justify-between min-h-screen">
      <div>
        <div className="p-4 border-b border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Analytics App</div>
            <div className="text-xs text-gray-500">Flowbit</div>
          </div>
        </div>
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-500 mb-2 px-3">GENERAL</div>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${activeTab === item.id
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

// --- MAIN DASHBOARD COMPONENT ---

export default function InvoiceDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>(FALLBACK_STATS);
  const [invoiceVolumeDataState, setInvoiceVolumeData] = useState<InvoiceVolumeData[]>(FALLBACK_TRENDS);
  const [vendorSpendDataState, setVendorSpendData] = useState<VendorSpendItem[]>(FALLBACK_VENDORS);
  const [categoryDataState, setCategoryData] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);
  const [cashOutflowDataState, setCashOutflowData] = useState<CashOutflowItem[]>(FALLBACK_CASH);
  const [invoicesByVendorState, setInvoicesByVendor] = useState<InvoiceItem[]>([]); // Initialize with empty array

  useEffect(() => {
    const BASE_URL = 'https://flow-bit-assignment.vercel.app';

    const endpoints = {
      stats: '/stats',
      trends: '/invoice-trends',
      vendors: '/vendors/top10', // Changed to top10 as per API spec
      categories: '/category-spend',
      cash: '/cash-outflow',
      invoices: '/invoices?perPage=5&page=1&sortBy=invoiceDate&order=desc'
    };

    const fetchEndpoint = async (url: string) => {
      try {
        const res = await fetch(`${BASE_URL}${url}`);
        if (!res.ok) {
          console.warn(`API Fetch failed for ${url}: ${res.status} ${res.statusText}`);
          return null;
        }
        return res.json();
      } catch (e) {
        console.error(`Network error for ${url}:`, e);
        return null;
      }
    };

    async function loadData() {
      setLoading(true);

      const [statsRes, trendsRes, vendorsRes, categoriesRes, cashRes, invoicesRes] = await Promise.all([
        fetchEndpoint(endpoints.stats),
        fetchEndpoint(endpoints.trends),
        fetchEndpoint(endpoints.vendors),
        fetchEndpoint(endpoints.categories),
        fetchEndpoint(endpoints.cash),
        fetchEndpoint(endpoints.invoices),
      ]);

      // --- 1. STATS DATA (/stats) ---
      if (statsRes && !isNaN(Number(statsRes.totalSpendYtd))) {
        setStats({
          // Use corrected API property names
          totalSpendYtd: Number(statsRes.totalSpendYtd) || FALLBACK_STATS.totalSpendYtd,
          totalInvoicesProcessed: Number(statsRes.totalInvoicesProcessed) || FALLBACK_STATS.totalInvoicesProcessed,
          documentsUploaded: Number(statsRes.documentsUploaded) || FALLBACK_STATS.documentsUploaded,
          averageInvoiceValue: Number(statsRes.averageInvoiceValue) || FALLBACK_STATS.averageInvoiceValue,
        });
      }

      // --- 2. TRENDS DATA (/invoice-trends) ---
      if (trendsRes && Array.isArray(trendsRes) && trendsRes.length > 0) {
        const mappedTrends: InvoiceVolumeData[] = trendsRes.map((t: any) => ({
          month: t.month,
          // Use corrected API property names
          invoiceCount: Number(t.invoiceCount),
          totalSpend: Number(t.totalSpend),
        }));
        setInvoiceVolumeData(mappedTrends);
      } else {
         setInvoiceVolumeData(FALLBACK_TRENDS);
      }
      
      // --- 3. VENDOR SPEND DATA (/vendors/top10) ---
      if (vendorsRes && Array.isArray(vendorsRes) && vendorsRes.length > 0) {
        const rows = vendorsRes as any[];
        const mappedVendors: VendorSpendItem[] = rows.map((r: any) => ({
          name: r.vendorName,
          // Use corrected API property name
          totalSpend: Number(r.totalSpend),
        })).sort((a, b) => b.totalSpend - a.totalSpend); // Re-sort descending

        setVendorSpendData(mappedVendors);
      } else {
         setVendorSpendData(FALLBACK_VENDORS);
      }

      // --- 4. CATEGORIES DATA (/category-spend) ---
      if (categoriesRes && Array.isArray(categoriesRes) && categoriesRes.length > 0) {
        const colors = ['#3B82F6', '#FB923C', '#FCD34D', '#34D399', '#A78BFA', '#EF4444'];
        const mappedCategories: CategoryItem[] = categoriesRes.map((c: any, idx: number) => ({
          name: c.category ?? 'Unknown',
          // Use 'spend' from API, map to 'value' for PieChart
          value: Number(c.spend), 
          color: colors[idx % colors.length]
        }));
        setCategoryData(mappedCategories);
      } else {
         setCategoryData(FALLBACK_CATEGORIES);
      }
      
      // --- 5. CASH OUTFLOW DATA (/cash-outflow) ---
      if (cashRes && Array.isArray(cashRes) && cashRes.length > 0) {
        const mappedCash: CashOutflowItem[] = cashRes.map((c: any) => ({
          range: c.date,
          // Use corrected API property name
          amount: Number(c.expected_outflow)
        }));
        setCashOutflowData(mappedCash);
      } else {
         setCashOutflowData(FALLBACK_CASH);
      }


      // --- 6. INVOICES TABLE DATA (/invoices) ---
      const actualInvoicesRes = invoicesRes?.data || [];
      if (actualInvoicesRes && Array.isArray(actualInvoicesRes) && actualInvoicesRes.length > 0) {
        const mappedInvoices: InvoiceItem[] = actualInvoicesRes.map((i: any) => ({
          // Use corrected API property names from the final processed JSON
          documentId: i.documentId,
          vendor: i.vendor,
          invoiceNumber: i.invoiceNumber,
          date: i.date, // already standardized date string
          amount: Number(i.amount),
          status: i.status
        }));
        setInvoicesByVendor(mappedInvoices);
      } else {
         // Fallback is left as an empty array or a small sample if needed
      }


      setLoading(false);
    }

    loadData();
  }, []);
  
  // Use correct StatsData properties for UI display
  const totalInvoices = stats.totalInvoicesProcessed;
  const docsUploaded = stats.documentsUploaded;
  const avgInvoiceValue = stats.averageInvoiceValue;
  const totalSpendYtd = stats.totalSpendYtd;
  const totalVendorSpend = vendorSpendDataState.reduce((sum, v) => sum + v.totalSpend, 0); // Corrected property

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-indigo-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <div className="text-indigo-600 font-semibold text-lg">Fetching live data... (Using fallback if API fails)</div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === "dashboard" && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="text-sm hidden sm:block">
                  <div className="font-medium text-gray-900">Mayank Goel</div>
                  <div className="text-gray-500 text-xs">Admin</div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors hover:bg-gray-100">
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>


          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Spend"
                value={formatCurrency(totalSpendYtd)}
                change="+8.2% from last month"
                trend="up"
                period="(YTD)"
                icon={DollarSign}
              />
              <StatCard
                title="Total Invoices Processed"
                value={totalInvoices.toLocaleString()}
                change="+8.2% from last month"
                trend="up"
                icon={FileText}
              />
              <StatCard
                title="Documents Uploaded"
                value={docsUploaded.toLocaleString()}
                change="-8 less from last month"
                trend="down"
                period="Total"
                icon={Upload}
              />
              <StatCard
                title="Average Invoice Value"
                value={formatCurrency(avgInvoiceValue)}
                change="+8.2% from last month"
                trend="up"
                icon={DollarSign}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Invoice Volume & Value Trend</h3>
                  <p className="text-sm text-gray-500">Invoice count and total spend over the last 12 months.</p>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={invoiceVolumeDataState} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis yAxisId="left" stroke="#6366f1" orientation="left" style={{ fontSize: '12px' }} tickFormatter={(val) => formatLargeNumber(val)} label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6366f1' } }} />
                      <YAxis yAxisId="right" stroke="#c7d2fe" orientation="right" style={{ fontSize: '12px' }} tickFormatter={(val) => formatLargeNumber(val)} label={{ value: 'Spend (€)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#c7d2fe' } }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: 'white', padding: '10px' }}
                        labelStyle={{ color: 'white', fontWeight: 'bold' }}
                        formatter={(value: any, name, props) => {
                          const displayValue = Array.isArray(value) ? value[0] : value;
                          if (props.dataKey === 'totalSpend') {
                            return [formatCurrency(displayValue), 'Total Spend'];
                          }
                          return [displayValue, 'Invoice Count'];
                        }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="invoiceCount" name="Invoice Count" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="totalSpend" name="Total Spend" stroke="#c7d2fe" strokeWidth={2} dot={{ fill: '#c7d2fe', r: 3 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Spend by Vendor (Top Vendors)</h3>
                  <p className="text-sm text-gray-500">Vendor spend with percentage distribution.</p>
                </div>
                <div className="space-y-4">
                  {vendorSpendDataState.slice(0, 5).map((vendor: VendorSpendItem, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-800 font-medium truncate max-w-[70%]">{vendor.name}</span>
                        <span className="text-indigo-600 font-semibold">{formatCurrency(vendor.totalSpend)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-indigo-600 transition-all duration-700`}
                          style={{ width: `${(vendor.totalSpend / (totalVendorSpend || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="text-right text-xs text-gray-500 mt-1">
                        {((vendor.totalSpend / (totalVendorSpend || 1)) * 100).toFixed(1)}% of Total Vendor Spend
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Spend by Category</h3>
                  <p className="text-sm text-gray-500">Distribution of spending across different categories.</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDataState}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(Number(percent) * 100).toFixed(0)}%)`}
                      >
                        {categoryDataState.map((entry: CategoryItem, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Spend']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {categoryDataState.map((cat: CategoryItem, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-700 font-medium">{cat.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Cash Outflow Forecast</h3>
                  <p className="text-sm text-gray-500">Expected payment obligations by due date.</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashOutflowDataState} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                      <XAxis dataKey="range" stroke="#6b7280" style={{ fontSize: '11px' }} angle={-15} textAnchor="end" height={40} />
                      <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={(val) => formatLargeNumber(val)} />
                      <Tooltip
                        formatter={(value: any) => {
                          const displayValue = Array.isArray(value) ? value[0] : value;
                          return [formatCurrency(displayValue), 'Amount'];
                        }}
                        contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '8px', color: 'white', padding: '10px' }}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" name="Amount" radius={[6, 6, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Recent Invoices</h3>
                  <p className="text-sm text-gray-500">A sample of the most recent processed invoices.</p>
                </div>
                <div className="overflow-auto" style={{ maxHeight: '360px' }}>
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 sticky top-0 bg-white shadow-sm">
                      <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                        <th className="pb-3 pt-0 font-bold">Vendor/ID</th>
                        <th className="pb-3 pt-0 font-bold">Date</th>
                        <th className="pb-3 pt-0 font-bold text-right">Amount</th>
                        <th className="pb-3 pt-0 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoicesByVendorState.map((item: InvoiceItem, idx: number) => (
                        <tr key={item.documentId || idx} className="border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50">
                          <td className="py-3 pr-2">
                            <div className="font-medium text-gray-900 truncate max-w-[120px]">{item.vendor}</div>
                            <div className="text-xs text-gray-500">{item.invoiceNumber || 'N/A'}</div>
                          </td>
                          <td className="py-3 text-gray-700 text-xs">{item.date ? new Date(item.date).toLocaleDateString('de-DE') : 'N/A'}</td>
                          <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'Overdue' ? 'bg-red-100 text-red-700' : item.status === 'Due' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {invoicesByVendorState.length === 0 && (
                  <p className="text-center text-gray-500 p-4">No invoice data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}      
      {activeTab === "chat" && (
        <ChatWithData />
      )}
    </div>
  );
}