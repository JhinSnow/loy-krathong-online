// src/utils/exportHelpers.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface KrathongExportRecord {
  id: string;
  user_type: string;
  owner_name: string;
  wish_message: string;
  status: string;
  created_at: string;
}

export const exportToExcel = (data: KrathongExportRecord[], filename = 'loy-krathong-report.xlsx') => {
  const typeMap: Record<string, string> = {
    student: 'นักศึกษา',
    staff: 'บุคลากร',
    general: 'บุคคลทั่วไป'
  };

  const statusMap: Record<string, string> = {
    approved: 'อนุมัติแล้ว',
    pending: 'รอตรวจสอบ',
    rejected: 'ปฏิเสธ'
  };

  const formattedRows = data.map((item, index) => ({
    'ลำดับ': index + 1,
    'รหัสกระทง': item.id,
    'ประเภทผู้ใช้': typeMap[item.user_type] || item.user_type,
    'ชื่อเจ้าของกระทง': item.owner_name,
    'คำอธิษฐาน/ขอขมา': item.wish_message,
    'สถานะ': statusMap[item.status] || item.status,
    'เวลาที่ปล่อย': item.created_at
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Krathongs');
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (data: KrathongExportRecord[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('Loy Krathong Online - Summary Report', 14, 18);
  doc.setFontSize(9);
  doc.text(`Exported at: ${new Date().toLocaleString('th-TH')}`, 14, 25);
  doc.text(`Total Records: ${data.length}`, 14, 30);

  const tableRows = data.map((item, index) => [
    index + 1,
    item.user_type,
    item.owner_name,
    item.wish_message.slice(0, 35) + (item.wish_message.length > 35 ? '...' : ''),
    item.status,
    item.created_at ? item.created_at.slice(0, 16) : '-'
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['#', 'Type', 'Name', 'Wish Message', 'Status', 'Date']],
    body: tableRows,
    theme: 'striped',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] }
  });

  doc.save('loy-krathong-report.pdf');
};
