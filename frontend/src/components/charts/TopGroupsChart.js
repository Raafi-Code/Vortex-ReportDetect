"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

export default function TopGroupsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="count"
          label={({ name, count }) => `${name}: ${count}`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
          formatter={(value) => `Report Message Count: ${value}`}
        />
        <Legend wrapperStyle={{ color: "var(--text-secondary)", fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
