export function downloadCSV(filename: string, rows: object[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csvBody = [headers.join(',')].concat(
    rows.map((row) => headers.map((field) => {
      const escaped = String(row[field] ?? '').replace(/"/g, '""')
      return `"${escaped}"`
    }).join(',')),
  ).join('\n')

  const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
