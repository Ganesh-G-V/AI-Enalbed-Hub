"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface AIUsageChartProps {
  data: { name: string; requests: number; tokens: number }[];
  className?: string;
}

export function AIUsageChart({ data, className }: AIUsageChartProps) {
  return (
    <div className={["w-full h-64", className].join(" ")}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="requests" stroke="#4338ca" strokeWidth={2} name="Requests" />
          <Line type="monotone" dataKey="tokens" stroke="#0ea5e9" strokeWidth={2} name="Tokens (k)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
