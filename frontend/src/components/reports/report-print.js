export default function ReportPrint({
  t,
  rows,
  formatDateTime,
  startDate,
  endDate,
}) {
  return (
    <section className="report-print-area" aria-hidden="true">
      <h1>{t.title}</h1>
      <p>
        {t.printDateRange}: {startDate || "-"} - {endDate || "-"}
      </p>
      <p>
        {t.totalRows}: {rows.length}
      </p>

      <table>
        <thead>
          <tr>
            <th>{t.columns.created_at}</th>
            <th>{t.columns.group_name}</th>
            <th>{t.columns.sender_name}</th>
            <th>{t.columns.matched_keyword}</th>
            <th>{t.columns.message_text}</th>
            <th>{t.columns.is_read}</th>
            <th>{t.columns.is_forwarded}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{formatDateTime(row.created_at)}</td>
              <td>{row.group_name || "-"}</td>
              <td>{row.sender_name || t.unknown}</td>
              <td>{row.matched_keyword || "-"}</td>
              <td>{row.message_text || "-"}</td>
              <td>{row.is_read ? t.status.read : t.status.unread}</td>
              <td>
                {row.is_forwarded ? t.status.forwarded : t.status.notForwarded}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
