import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const columns = [
  { key: "created_at", label: "Tanggal" },
  { key: "group_name", label: "Group" },
  { key: "sender_name", label: "Pengirim" },
  { key: "status", label: "Status" },
  { key: "matched_keyword", label: "Keyword" },
  { key: "message_text", label: "Isi Pesan" },
  { key: "is_read", label: "Read" },
  { key: "is_forwarded", label: "Forwarded" },
];

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown size={14} />;
  return direction === "asc" ? (
    <ArrowUpAZ size={14} />
  ) : (
    <ArrowDownAZ size={14} />
  );
}

function StatusPill({ value, trueLabel, falseLabel }) {
  const isTrue = Boolean(value);
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
        isTrue
          ? "bg-[var(--accent-dim)] text-[var(--accent)]"
          : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
      }`}
    >
      {isTrue ? trueLabel : falseLabel}
    </span>
  );
}

function ReportStatusPill({ status, t }) {
  const defaultStatus = status || "diterima";

  const colors = {
    diterima: "bg-[var(--bg-tertiary)] text-[var(--text-primary)]",
    diproses: "bg-blue-500/10 text-blue-500",
    selesai: "bg-green-500/10 text-green-500",
  };

  const colorClass = colors[defaultStatus] || colors.diterima;
  const label = t.reportStatus?.[defaultStatus] || defaultStatus;

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${colorClass}`}
    >
      {label}
    </span>
  );
}

export default function ReportTable({
  t,
  rows,
  sortConfig,
  onSort,
  onStatusChange,
  formatDateTime,
}) {
  return (
    <div className="space-y-2 w-full max-w-full">
      <p className="text-xs text-[var(--text-muted)] lg:hidden">
        Geser tabel ke kanan/kiri untuk melihat semua kolom.
      </p>

      <Table className="min-w-[920px]">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto justify-start p-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  onClick={() => onSort(column.key)}
                >
                  <span>{t.columns[column.key] || column.label}</span>
                  <SortIcon
                    active={sortConfig.key === column.key}
                    direction={sortConfig.direction}
                  />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDateTime(row.created_at)}</TableCell>
              <TableCell>{row.group_name || "-"}</TableCell>
              <TableCell>{row.sender_name || t.unknown}</TableCell>
              <TableCell>
                <select
                  className={`rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] font-semibold outline-none focus:border-[var(--accent)] ${
                    row.status === "selesai"
                      ? "bg-green-500/10 text-green-500"
                      : row.status === "diproses"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                  }`}
                  value={row.status || "diterima"}
                  onChange={(e) => onStatusChange(row.id, e.target.value)}
                >
                  <option
                    value="diterima"
                    className="bg-[var(--bg-card)] text-[var(--text-primary)]"
                  >
                    {t.reportStatus?.diterima || "Diterima"}
                  </option>
                  <option
                    value="diproses"
                    className="bg-[var(--bg-card)] text-[var(--text-primary)]"
                  >
                    {t.reportStatus?.diproses || "Diproses"}
                  </option>
                  <option
                    value="selesai"
                    className="bg-[var(--bg-card)] text-[var(--text-primary)]"
                  >
                    {t.reportStatus?.selesai || "Selesai"}
                  </option>
                </select>
              </TableCell>
              <TableCell>{row.matched_keyword || "-"}</TableCell>
              <TableCell
                className="max-w-[340px] truncate"
                title={row.message_text || ""}
              >
                {row.message_text || "-"}
              </TableCell>
              <TableCell>
                <StatusPill
                  value={row.is_read}
                  trueLabel={t.status.read}
                  falseLabel={t.status.unread}
                />
              </TableCell>
              <TableCell>
                <StatusPill
                  value={row.is_forwarded}
                  trueLabel={t.status.forwarded}
                  falseLabel={t.status.notForwarded}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
