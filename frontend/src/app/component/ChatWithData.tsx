"use client";
import React, { useState } from "react";

interface Message {
    role: "user" | "assistant";
    content: string;
    sql?: string;
    results?: any[];
}

export default function ChatWithData() {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    const sendQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setMessages((m) => [...m, { role: "user", content: input }]);
        setLoading(true);

        try {
            const res = await fetch("https://flow-bit-assignment.vercel.app/chat-with-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input }),
            });
            const data = await res.json();

            if (data.error) {
                setMessages((m) => [
                    ...m,
                    { role: "assistant", content: `${data.error}` },
                ]);
            } else {
                setMessages((m) => [
                    ...m,
                    {
                        role: "assistant",
                        content: "Here’s the SQL and its results:",
                        sql: data.sql,
                        results: data.results,
                    },
                ]);
            }
        } catch (err: any) {
            setMessages((m) => [
                ...m,
                { role: "assistant", content: `Network error: ${err.message}` },
            ]);
        } finally {
            setInput("");
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50  flex  justify-center not-even:flex-col items-center">
            <div className="w-full max-w-3xl bg-white rounded-lg shadow border border-gray-200 p-5 flex flex-col h-[80vh]">
                <h2 className="text-xl font-semibold mb-3 text-gray-900">💬 Chat with Data</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Ask questions like “Top 5 vendors by spend” or “Show overdue invoices”.
                </p>

                <div className="flex-1 overflow-y-auto space-y-3 border-b border-gray-200 pb-3">
                    {messages.length === 0 && (
                        <div className="text-black-500 text-sm text-center mt-20">
                            Start typing a question…
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`p-3 rounded-lg ${msg.role === "user"
                                    ? "bg-indigo-50 text-indigo-800"
                                    : "bg-gray-50 text-gray-800"
                                }`}
                        >
                            <b>{msg.role === "user" ? "You" : "AI"}:</b>{" "}
                            <div className="whitespace-pre-wrap mt-1">{msg.content}</div>

                            {msg.sql && (
                                <pre className="bg-gray-900 text-gray-100 text-xs p-3 mt-3 rounded-lg overflow-x-auto">
                                    {msg.sql}
                                </pre>
                            )}

                            {msg.results && msg.results.length > 0 && (
                                <div className="overflow-x-auto mt-3 border border-gray-200 rounded-lg">
                                    <table className="min-w-full text-xs text-left">
                                        <thead className="bg-gray-100 border-b">
                                            <tr>
                                                {Object.keys(msg.results[0]).map((col) => (
                                                    <th
                                                        key={col}
                                                        className="px-2 py-1 font-semibold text-gray-700"
                                                    >
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {msg.results.map((row, ridx) => (
                                                <tr
                                                    key={ridx}
                                                    className="border-b last:border-0 hover:bg-gray-50"
                                                >
                                                    {Object.values(row).map((val, vidx) => (
                                                        <td key={vidx} className="px-2 py-1">
                                                            {String(val)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={sendQuery} className="flex gap-2 mt-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask e.g. 'Show total spend last 90 days'"
                        className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-indigo-500 text-black"
                    />
                    <button
                        disabled={loading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </form>
            </div>
        </div>
    );
}
