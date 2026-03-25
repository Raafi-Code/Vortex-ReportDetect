"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/language-context";
import { getMessageReports, updateMessageStatus } from "@/lib/api";
import { showError } from "@/lib/alerts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ReportFilters from "@/components/reports/report-filters";
import ReportTable from "@/components/reports/report-table";

const MAX_PAGE_FETCH = 50;
const FETCH_LIMIT = 200;

function sortRows(rows, sortConfig) {
  const { key, direction } = sortConfig;
  const factor = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    let left = a[key];
    let right = b[key];

    if (key === "created_at") {
      left = new Date(left).getTime();
      right = new Date(right).getTime();
      return (left - right) * factor;
    }

    if (typeof left === "boolean" || typeof right === "boolean") {
      return (left === right ? 0 : left ? 1 : -1) * factor;
    }

    left = (left || "").toString().toLowerCase();
    right = (right || "").toString().toLowerCase();

    if (left < right) return -1 * factor;
    if (left > right) return 1 * factor;
    return 0;
  });
}

export default function ReportsPage() {
  const { language } = useLanguage();
  const isId = language === "id";

  const t = {
    title: isId ? "Laporan Pesan" : "Message Reports",
    subtitle: isId
      ? "Tabel laporan pesan dengan pencarian, sortir, filter tanggal, dan export"
      : "Message report table with search, sort, date filters, and export",
    searchLabel: isId ? "Search" : "Search",
    searchPlaceholder: isId ? "Cari isi pesan..." : "Search message text...",
    searchButton: isId ? "Cari" : "Search",
    dateLabel: isId ? "Rentang Tanggal" : "Date Range",
    startDate: isId ? "Tanggal Mulai" : "Start Date",
    endDate: isId ? "Tanggal Akhir" : "End Date",
    applyDate: isId ? "Terapkan" : "Apply",
    showLabel: isId ? "Show" : "Show",
    all: isId ? "Semua" : "All",
    exportButton: isId ? "Export" : "Export",
    exportFormatLabel: isId ? "Format Export" : "Export Format",
    totalRows: isId ? "Total Baris" : "Total Rows",
    loadedRows: isId ? "Data dimuat" : "Rows loaded",
    pageInfo: isId ? "Halaman" : "Page",
    loading: isId ? "Memuat data laporan..." : "Loading report data...",
    empty: isId
      ? "Tidak ada data pada rentang tanggal ini"
      : "No data for this date range",
    unknown: isId ? "Tidak diketahui" : "Unknown",
    columns: {
      created_at: isId ? "Tanggal" : "Date",
      group_name: isId ? "Group" : "Group",
      sender_name: isId ? "Pengirim" : "Sender",
      matched_keyword: isId ? "Keyword" : "Keyword",
      message_text: isId ? "Isi Pesan" : "Message",
      status: isId ? "Status" : "Status",
      is_read: isId ? "Read" : "Read",
      is_forwarded: isId ? "Forwarded" : "Forwarded",
    },
    status: {
      read: isId ? "Read" : "Read",
      unread: isId ? "Unread" : "Unread",
      forwarded: isId ? "Yes" : "Yes",
      notForwarded: isId ? "No" : "No",
    },
    reportStatus: {
      diterima: isId ? "Diterima" : "Received",
      diproses: isId ? "Diproses" : "In Progress",
      selesai: isId ? "Selesai" : "Resolved",
    },
    tabs: {
      all: isId ? "Semua Status" : "All Status",
      diterima: isId ? "Diterima" : "Received",
      diproses: isId ? "Diproses" : "In Progress",
      selesai: isId ? "Selesai" : "Resolved",
    },
  };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  const [statusFilter, setStatusFilter] = useState("all");

  const formatDateTime = (value) => {
    const date = new Date(value);
    return date.toLocaleString(isId ? "id-ID" : "en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalPages = useMemo(() => {
    if (rowsPerPage === "all") return 1;
    const perPage = Number(rowsPerPage);
    const count = rows.filter(
      (r) => statusFilter === "all" || r.status === statusFilter,
    ).length;
    return Math.max(1, Math.ceil(count / perPage));
  }, [rows, rowsPerPage, statusFilter]);

  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    return sortRows(result, sortConfig);
  }, [rows, statusFilter, sortConfig]);

  const pageRows = useMemo(() => {
    if (rowsPerPage === "all") return filteredRows;
    const perPage = Number(rowsPerPage);
    const start = (currentPage - 1) * perPage;
    return filteredRows.slice(start, start + perPage);
  }, [filteredRows, currentPage, rowsPerPage]);

  const fetchReports = useCallback(async ({ search, start, end }) => {
    setLoading(true);

    try {
      let page = 1;
      let pages = 1;
      let collected = [];

      do {
        const res = await getMessageReports({
          page,
          limit: FETCH_LIMIT,
          search: search || undefined,
          start_date: start || undefined,
          end_date: end || undefined,
        });

        const batch = res?.data || [];
        collected = [...collected, ...batch];
        pages = res?.pagination?.totalPages || 1;
        page += 1;
      } while (page <= pages && page <= MAX_PAGE_FETCH);

      setRows(collected);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch report rows:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleApply = () => {
    if (startDate && endDate && startDate > endDate) {
      return;
    }

    setSearchApplied(searchDraft);
    fetchReports({ search: searchDraft, start: startDate, end: endDate });
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      return {
        key,
        direction: prev.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateMessageStatus(id, newStatus);
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      showError(err.message, "Update Failed");
    }
  };

  const handleDateChange = (type, value) => {
    if (type === "start") setStartDate(value);
    if (type === "end") setEndDate(value);
  };

  const handleExport = () => {
    const exportRows = filteredRows.map((row) => ({
      [t.columns.created_at]: formatDateTime(row.created_at),
      [t.columns.group_name]: row.group_name || "-",
      [t.columns.sender_name]: row.sender_name || t.unknown,
      [t.columns.matched_keyword]: row.matched_keyword || "-",
      [t.columns.message_text]: row.message_text || "-",
      [t.columns.status]: t.reportStatus[row.status] || t.reportStatus.diterima,
    }));

    if (exportRows.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

    const dateLabel = new Date().toISOString().slice(0, 10);
    const extension = exportFormat === "csv" ? "csv" : "xlsx";
    const fileName = `message-reports-${dateLabel}.${extension}`;

    XLSX.writeFile(workbook, fileName, {
      bookType: exportFormat,
    });
  };

  const handleRowsPerPage = (value) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  };

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  useEffect(() => {
    fetchReports({ search: "", start: "", end: "" });
  }, [fetchReports]);

  return (
    <div className="animate-fade-in space-y-4 md:space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {t.title}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">{t.subtitle}</p>
      </header>

      <ReportFilters
        t={t}
        searchDraft={searchDraft}
        onSearchDraftChange={setSearchDraft}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPage}
        exportFormat={exportFormat}
        onExportFormatChange={setExportFormat}
        onApply={handleApply}
        onExport={handleExport}
        isLoading={loading}
      />

      <div className="flex flex-wrap gap-2 pb-2">
        {[
          { id: "all", label: t.tabs.all },
          { id: "diterima", label: t.tabs.diterima },
          { id: "diproses", label: t.tabs.diproses },
          { id: "selesai", label: t.tabs.selesai },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={statusFilter === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setStatusFilter(tab.id);
              setCurrentPage(1);
            }}
            className={`whitespace-nowrap ${statusFilter === tab.id ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90" : ""}`}
            disabled={loading}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="report-screen-only border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <FileText size={18} /> {t.title}
              </CardTitle>
              <CardDescription>
                {t.loadedRows}: {filteredRows.length}{" "}
                {statusFilter !== "all" && `(Dari ${rows.length})`}
              </CardDescription>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                fetchReports({
                  search: searchApplied,
                  start: startDate,
                  end: endDate,
                })
              }
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>{isId ? "Refresh" : "Refresh"}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-3 md:p-4">
          {loading ? (
            <div className="py-16 text-center text-sm text-[var(--text-secondary)]">
              {t.loading}
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--text-secondary)]">
              {t.empty}
            </div>
          ) : (
            <>
              <ReportTable
                t={t}
                rows={pageRows}
                sortConfig={sortConfig}
                onSort={handleSort}
                formatDateTime={formatDateTime}
                onStatusChange={handleStatusChange}
              />

              <div className="report-screen-only mt-3 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
                <p className="text-xs text-[var(--text-muted)]">
                  {t.pageInfo} {currentPage}/{totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={!canGoPrev || rowsPerPage === "all"}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={!canGoNext || rowsPerPage === "all"}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
