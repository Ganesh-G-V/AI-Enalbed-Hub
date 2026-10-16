"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface UseCaseDistributionChartProps {
  data: { name: string; value: number }[];
  className?: string;
}

const COLORS = ["#4338ca", "#0ea5e9", "#15803d", "#d97706", "#7c3aed", "#db2777"];

export function UseCaseDistributionChart({ data, className }: UseCaseDistributionChartProps) {
  return (
    <div className={["w-full h-64", className].join(" ")}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={90}
            fill="#8884d8"
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
