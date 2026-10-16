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

interface CostTrendChartProps {
  data: { name: string; cost: number }[];
  className?: string;
}

export function CostTrendChart({ data, className }: CostTrendChartProps) {
  return (
    <div className={["w-full h-64", className].join(" ")}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cost" stroke="#15803d" strokeWidth={2} name="Estimated cost" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
