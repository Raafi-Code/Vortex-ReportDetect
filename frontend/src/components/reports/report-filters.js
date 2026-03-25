import { Search, Download, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function ReportFilters({
  t,
  searchDraft,
  onSearchDraftChange,
  startDate,
  endDate,
  onDateChange,
  rowsPerPage,
  onRowsPerPageChange,
  exportFormat,
  onExportFormatChange,
  onApply,
  onExport,
  isLoading,
}) {
  return (
    <div className="report-screen-only grid gap-3 md:grid-cols-2 xl:grid-cols-12">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 xl:col-span-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {t.searchLabel}
        </label>
        <div className="flex gap-2">
          <Input
            value={searchDraft}
            onChange={(e) => onSearchDraftChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
          />
          <Button onClick={onApply} size="sm" disabled={isLoading}>
            <Search size={15} />
            <span>{t.searchButton}</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 xl:col-span-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {t.dateLabel}
        </label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto] xl:items-center">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange("start", e.target.value)}
            aria-label={t.startDate}
          />
          <span className="hidden text-center text-sm text-[var(--text-muted)] xl:block">
            -
          </span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange("end", e.target.value)}
            aria-label={t.endDate}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={onApply}
            disabled={isLoading}
            className="w-full justify-center"
          >
            <CalendarDays size={15} />
            <span>{t.applyDate}</span>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 md:col-span-2 xl:col-span-3">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {t.showLabel}
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(e.target.value)}
            aria-label={t.showLabel}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="all">{t.all}</option>
          </Select>

          <Select
            value={exportFormat}
            onChange={(e) => onExportFormatChange(e.target.value)}
            aria-label={t.exportFormatLabel}
          >
            <option value="xlsx">XLSX</option>
            <option value="csv">CSV</option>
          </Select>

          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={15} />
            <span>{t.exportButton}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
