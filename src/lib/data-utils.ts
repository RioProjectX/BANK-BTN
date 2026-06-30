import { Customer } from '../types';

/**
 * Safely escapes strings for CSV format
 */
function escapeCSVCell(val: string | number | undefined): string {
  if (val === undefined || val === null) return '';
  const str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

/**
 * Exports database records to a standard CSV file
 */
export function exportToCSV(customers: Customer[]) {
  const headers = ['Nama Nasabah', 'Nomor HP', 'Bank', 'Tanggal Pendaftaran', 'Status', 'Catatan Tambahan', 'Tanggal Dibuat'];
  const rows = customers.map(c => [
    c.name,
    c.phone,
    c.bank,
    c.registrationDate,
    c.status,
    c.notes || '-',
    new Date(c.createdAt).toLocaleString('id-ID')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(escapeCSVCell).join(','))
  ].join('\r\n');

  // Add UTF-8 BOM so Excel opens with correct characters
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Tracker_Nasabah_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports data in an HTML Spreadsheet format (.xls) which Microsoft Excel opens beautifully with formatting
 */
export function exportToExcel(customers: Customer[]) {
  const title = 'Laporan Tracker Nasabah';
  const timestamp = new Date().toLocaleString('id-ID');

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <style>
        table { border-collapse: collapse; font-family: Arial, sans-serif; }
        th { background-color: #1E3A8A; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px; }
        td { border: 1px solid #CBD5E1; padding: 8px; }
        .title { font-size: 16pt; font-weight: bold; color: #1E3A8A; text-align: center; margin-bottom: 5px; }
        .meta { font-size: 10pt; color: #64748B; text-align: center; margin-bottom: 20px; }
        .status-berhasil { background-color: #DCFCE7; color: #15803D; font-weight: 500; }
        .status-pending { background-color: #FEF9C3; color: #A16207; font-weight: 500; }
        .status-ditolak { background-color: #FEE2E2; color: #B91C1C; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="title">${title}</div>
      <div class="meta">Diekspor pada: ${timestamp}</div>
      <table>
        <thead>
          <tr>
            <th>Nama Nasabah</th>
            <th>Nomor HP</th>
            <th>Bank Penerbit</th>
            <th>Tanggal Pembukaan</th>
            <th>Status Rekening</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
  `;

  customers.forEach(c => {
    let statusClass = '';
    if (c.status === 'Berhasil') statusClass = 'status-berhasil';
    if (c.status === 'Pending') statusClass = 'status-pending';
    if (c.status === 'Ditolak') statusClass = 'status-ditolak';

    html += `
      <tr>
        <td>${c.name}</td>
        <td>'${c.phone}</td> <!-- Prepended single quote prevents Excel from stripping leading zero -->
        <td>${c.bank}</td>
        <td>${c.registrationDate}</td>
        <td class="${statusClass}">${c.status}</td>
        <td>${c.notes || '-'}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Tracker_Nasabah_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Automatically triggers the browser print utility of checking customer list
 */
export function printLaporan() {
  window.print();
}
