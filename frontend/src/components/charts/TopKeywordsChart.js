"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function TopKeywordsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          type="number"
          stroke="var(--text-secondary)"
          style={{ fontSize: "12px" }}
        />
        <YAxis
          dataKey="keyword"
          type="category"
          stroke="var(--text-secondary)"
          style={{ fontSize: "11px" }}
          width={25}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <Legend wrapperStyle={{ color: "var(--text-secondary)" }} />
        <Bar
          dataKey="count"
          fill="#8b5cf6"
          name="Report Match Count"
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
