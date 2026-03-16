"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function MessageActivityChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="time"
          stroke="var(--text-secondary)"
          style={{ fontSize: "12px" }}
        />
        <YAxis stroke="var(--text-secondary)" style={{ fontSize: "12px" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
          }}
        />
        <Legend wrapperStyle={{ color: "var(--text-secondary)" }} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: "#10b981", r: 4 }}
          activeDot={{ r: 6 }}
          name="Report Message Count"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
