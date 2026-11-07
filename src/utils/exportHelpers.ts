// src/utils/exportHelpers.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sanitizeSpreadsheetCell } from './security';
import {
  EVALUATION_QUESTIONS,
  type EvaluationAnalyticsSummary
} from './evaluationHelpers';
import { generateRadarChartDataUrl } from '../components/EvaluationRadarChart';

export interface KrathongExportRecord {
  id: string;
  user_type: string;
  owner_name: string;
  wish_message: string;
  status: string;
  created_at: string;
}

const USER_TYPE_THAI: Record<string, string> = {
  student: 'นักศึกษา',
  faculty: 'อาจารย์',
  staff: 'บุคลากร',
  general: 'บุคคลภายนอก'
};

/**
 * 1. Export ข้อมูลครบวงจรเป็นไฟล์ Excel (.xlsx) 3 Sheets:
 *    - Sheet 1: Raw Data (ข้อมูลดิบผู้ตอบแบบประเมินรายบุคคล 10 ข้อ)
 *    - Sheet 2: Summary Table (ตารางสรุปสถิติ N, ร้อยละ 1-5, ค่าเฉลี่ย x̄, S.D. สำหรับทำเล่มรายงาน)
 *    - Sheet 3: Krathongs Data (รายชื่อและคำอธิษฐานผู้ลอยกระทง)
 */
export const exportEvaluationAndProjectToExcel = (
  analytics: EvaluationAnalyticsSummary,
  krathongs: KrathongExportRecord[] = [],
  filename = 'loy-krathong-project-summary.xlsx'
) => {
  const workbook = XLSX.utils.book_new();

  // --- Sheet 1: Raw Data (ข้อมูลดิบของผู้ตอบแบบประเมินทุกคนแยกตามแถว) ---
  const rawSheetRows = analytics.records.map((rec, index) => {
    const row: Record<string, any> = {
      'ลำดับ': index + 1,
      'วัน-เวลา (Timestamp)': sanitizeSpreadsheetCell(
        rec.created_at ? new Date(rec.created_at).toLocaleString('th-TH') : '-'
      ),
      'ประเภทผู้เข้าร่วม': sanitizeSpreadsheetCell(USER_TYPE_THAI[rec.user_type] || rec.user_type),
      'รหัสนักศึกษา': sanitizeSpreadsheetCell(rec.student_id || '-')
    };

    EVALUATION_QUESTIONS.forEach((q, qIdx) => {
      row[`ข้อ ${q.id}: ${q.shortLabel.replace(/^\d+\.\s*/, '')}`] = rec.scores[qIdx] ?? 5;
    });

    row['ค่าเฉลี่ยรายบุคคล (x̄)'] = rec.average_score;
    row['ข้อเสนอแนะเพิ่มเติม'] = sanitizeSpreadsheetCell(rec.comment || '-');
    return row;
  });

  const rawWorksheet = XLSX.utils.json_to_sheet(rawSheetRows);
  XLSX.utils.book_append_sheet(workbook, rawWorksheet, '1_Raw_Data');

  // --- Sheet 2: Summary Table (ตารางสรุปสถิติตามรูปแบบเอกสารราชการ) ---
  const summarySheetRows: Record<string, any>[] = analytics.questionStats.map((st) => ({
    'ข้อที่': st.questionId,
    'ประเด็นการประเมินความพึงพอใจ': st.title,
    'จำนวนผู้ตอบ (N)': st.totalN,
    '5 มากที่สุด (คน)': st.counts[5],
    '5 มากที่สุด (%)': `${st.percentages[5].toFixed(1)}%`,
    '4 มาก (คน)': st.counts[4],
    '4 มาก (%)': `${st.percentages[4].toFixed(1)}%`,
    '3 ปานกลาง (คน)': st.counts[3],
    '3 ปานกลาง (%)': `${st.percentages[3].toFixed(1)}%`,
    '2 น้อย (คน)': st.counts[2],
    '2 น้อย (%)': `${st.percentages[2].toFixed(1)}%`,
    '1 น้อยที่สุด (คน)': st.counts[1],
    '1 น้อยที่สุด (%)': `${st.percentages[1].toFixed(1)}%`,
    'ค่าเฉลี่ย (x̄)': st.mean.toFixed(2),
    'ส่วนเบี่ยงเบนมาตรฐาน (S.D.)': st.sd.toFixed(2),
    'ระดับความพึงพอใจ': st.levelText
  }));

  // แถวสรุปภาพรวมท้ายตาราง
  summarySheetRows.push({
    'ข้อที่': 'สรุป',
    'ประเด็นการประเมินความพึงพอใจ': 'ค่าเฉลี่ยรวมทุกด้าน (Overall Mean)',
    'จำนวนผู้ตอบ (N)': analytics.totalN,
    '5 มากที่สุด (คน)': '-',
    '5 มากที่สุด (%)': '-',
    '4 มาก (คน)': '-',
    '4 มาก (%)': '-',
    '3 ปานกลาง (คน)': '-',
    '3 ปานกลาง (%)': '-',
    '2 น้อย (คน)': '-',
    '2 น้อย (%)': '-',
    '1 น้อยที่สุด (คน)': '-',
    '1 น้อยที่สุด (%)': '-',
    'ค่าเฉลี่ย (x̄)': analytics.overallMean.toFixed(2),
    'ส่วนเบี่ยงเบนมาตรฐาน (S.D.)': analytics.overallSD.toFixed(2),
    'ระดับความพึงพอใจ': analytics.overallLevelText
  });

  const summaryWorksheet = XLSX.utils.json_to_sheet(summarySheetRows);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '2_Summary_Table');

  // --- Sheet 3: Krathongs List (ข้อมูลผู้ร่วมลอยกระทง) ---
  if (krathongs.length > 0) {
    const statusMap: Record<string, string> = {
      approved: 'อนุมัติแล้ว',
      pending: 'รอตรวจสอบ',
      rejected: 'ปฏิเสธ'
    };

    const krathongRows = krathongs.map((item, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสกระทง': sanitizeSpreadsheetCell(item.id),
      'ประเภทผู้ใช้': sanitizeSpreadsheetCell(USER_TYPE_THAI[item.user_type] || item.user_type),
      'ชื่อเจ้าของกระทง': sanitizeSpreadsheetCell(item.owner_name),
      'คำอธิษฐาน/ขอขมา': sanitizeSpreadsheetCell(item.wish_message),
      'สถานะ': sanitizeSpreadsheetCell(statusMap[item.status] || item.status),
      'เวลาที่ปล่อย': sanitizeSpreadsheetCell(item.created_at)
    }));

    const krathongWorksheet = XLSX.utils.json_to_sheet(krathongRows);
    XLSX.utils.book_append_sheet(workbook, krathongWorksheet, '3_Krathongs_Data');
  }

  XLSX.writeFile(workbook, filename);
};

/**
 * 2. Export ข้อมูลดิบเป็นไฟล์ CSV (.csv) รองรับภาษาไทย (UTF-8 with BOM)
 */
export const exportEvaluationToCSV = (
  analytics: EvaluationAnalyticsSummary,
  filename = 'loy-krathong-evaluation-raw.csv'
) => {
  const headers = [
    'ลำดับ',
    'Timestamp',
    'ประเภทผู้ตอบ',
    'รหัสนักศึกษา',
    ...EVALUATION_QUESTIONS.map((q) => `ข้อ_${q.id}`),
    'ค่าเฉลี่ยรวม',
    'ข้อเสนอแนะ'
  ];

  const escapeCsvField = (val: unknown) => {
    const safe = sanitizeSpreadsheetCell(val).replace(/"/g, '""');
    return `"${safe}"`;
  };

  const lines = [
    headers.map(escapeCsvField).join(','),
    ...analytics.records.map((rec, idx) =>
      [
        idx + 1,
        rec.created_at,
        USER_TYPE_THAI[rec.user_type] || rec.user_type,
        rec.student_id || '-',
        ...rec.scores,
        rec.average_score.toFixed(2),
        rec.comment || ''
      ]
        .map(escapeCsvField)
        .join(',')
    )
  ];

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * 3. เปิดหน้ารายงานสรุปผลโครงการขนาด A4 มาตรฐานราชการ (Print-Friendly / Save as PDF A4)
 *    พร้อมแนบกราฟ Radar Chart ความละเอียดสูง ตารางสรุปสถิติ 10 ด้าน และบทวิเคราะห์อัตโนมัติ
 */
export const openOfficialA4ReportPrintView = (
  analytics: EvaluationAnalyticsSummary,
  totalKrathongs = 0
) => {
  const radarDataUrl = generateRadarChartDataUrl(
    analytics.questionStats,
    analytics.overallMean,
    analytics.totalN,
    'light'
  );

  const printWin = window.open('', '_blank', 'width=1024,height=900');
  if (!printWin) {
    alert('กรุณาอนุญาตการเปิดหน้าต่างป๊อปอัป (Pop-up) เพื่อพิมพ์รายงาน PDF ขนาด A4');
    return;
  }

  const highest = analytics.highestDimension;
  const lowest = analytics.lowestDimension;
  const studentPct =
    analytics.totalN > 0 ? ((analytics.userTypeCounts.student / analytics.totalN) * 100).toFixed(1) : '0.0';
  const staffPct =
    analytics.totalN > 0 ? ((analytics.userTypeCounts.staff / analytics.totalN) * 100).toFixed(1) : '0.0';
  const generalPct =
    analytics.totalN > 0 ? ((analytics.userTypeCounts.general / analytics.totalN) * 100).toFixed(1) : '0.0';

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>รายงานสรุปผลความพึงพอใจโครงการเทศกาลลอยกระทง (A4 Report)</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Sarabun', sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.45;
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 14px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: #fff;
      padding: 10px 18px;
      border-radius: 12px;
    }
    .toolbar button {
      background: #f59e0b;
      color: #0f172a;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: 'Sarabun', sans-serif;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
    }
    .a4-page {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 14mm 16mm;
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
    }
    h1 {
      font-size: 18px;
      font-weight: 800;
      text-align: center;
      margin: 0 0 4px 0;
    }
    h2 {
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      color: #334155;
      margin: 0 0 12px 0;
    }
    .meta-box {
      display: flex;
      justify-content: space-between;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 11.5px;
    }
    .chart-wrapper {
      text-align: center;
      margin: 8px 0 12px 0;
    }
    .chart-wrapper img {
      max-width: 82%;
      height: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 12px;
    }
    th, td {
      border: 1px solid #94a3b8;
      padding: 4px 6px;
      text-align: center;
    }
    th {
      background: #e2e8f0;
      font-weight: 700;
    }
    td.left {
      text-align: left;
    }
    tr.summary-row {
      background: #fef3c7;
      font-weight: 700;
    }
    .analysis-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 14px;
      background: #f8fafc;
      font-size: 11.5px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none !important; }
      .a4-page { box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>📄 รายงานสรุปผลขนาดมาตรฐาน A4 (พร้อมแนบเล่มสรุปโครงการ)</span>
    <button onclick="window.print()">🖨️ พิมพ์รายงาน / บันทึกเป็น PDF (A4)</button>
  </div>

  <div class="a4-page">
    <h1>รายงานสรุปผลการประเมินความพึงพอใจโครงการเทศกาลลอยกระทงออนไลน์</h1>
    <h2>ตัวชี้วัดเชิงคุณภาพ: ระดับความพึงพอใจของผู้เข้าร่วมกิจกรรม (10 ด้าน)</h2>

    <div class="meta-box">
      <div><strong>จำนวนผู้ตอบแบบประเมิน (N):</strong> ${analytics.totalN.toLocaleString()} คน (กระทงทั้งหมด ${totalKrathongs.toLocaleString()} ใบ)</div>
      <div><strong>สัดส่วนผู้ตอบ:</strong> นักศึกษา ${studentPct}% | บุคลากร ${staffPct}% | บุคคลภายนอก ${generalPct}%</div>
      <div><strong>วันที่ออกรายงาน:</strong> ${new Date().toLocaleDateString('th-TH')}</div>
    </div>

    <div class="chart-wrapper">
      <img src="${radarDataUrl}" alt="Radar Chart 10 Dimensions" />
    </div>

    <table>
      <thead>
        <tr>
          <th rowspan="2" style="width: 34px;">ข้อ</th>
          <th rowspan="2">ประเด็นการประเมินความพึงพอใจ</th>
          <th colspan="5">ร้อยละ (%) ของผู้ตอบในแต่ละระดับคะแนน (N = ${analytics.totalN})</th>
          <th rowspan="2" style="width: 48px;">ค่าเฉลี่ย<br/>(x̄)</th>
          <th rowspan="2" style="width: 44px;">S.D.</th>
          <th rowspan="2" style="width: 68px;">ระดับ<br/>ความพึงพอใจ</th>
        </tr>
        <tr>
          <th style="width: 44px;">5<br/>(มากที่สุด)</th>
          <th style="width: 44px;">4<br/>(มาก)</th>
          <th style="width: 44px;">3<br/>(ปานกลาง)</th>
          <th style="width: 44px;">2<br/>(น้อย)</th>
          <th style="width: 44px;">1<br/>(น้อยที่สุด)</th>
        </tr>
      </thead>
      <tbody>
        ${analytics.questionStats
          .map(
            (st) => `
          <tr>
            <td>${st.questionId}</td>
            <td class="left">${st.title}</td>
            <td>${st.percentages[5].toFixed(1)}%<br/><span style="color:#64748b;font-size:9px;">(${st.counts[5]})</span></td>
            <td>${st.percentages[4].toFixed(1)}%<br/><span style="color:#64748b;font-size:9px;">(${st.counts[4]})</span></td>
            <td>${st.percentages[3].toFixed(1)}%<br/><span style="color:#64748b;font-size:9px;">(${st.counts[3]})</span></td>
            <td>${st.percentages[2].toFixed(1)}%<br/><span style="color:#64748b;font-size:9px;">(${st.counts[2]})</span></td>
            <td>${st.percentages[1].toFixed(1)}%<br/><span style="color:#64748b;font-size:9px;">(${st.counts[1]})</span></td>
            <td><strong>${st.mean.toFixed(2)}</strong></td>
            <td>${st.sd.toFixed(2)}</td>
            <td>${st.levelText}</td>
          </tr>
        `
          )
          .join('')}
        <tr class="summary-row">
          <td colspan="7" class="left" style="text-align:right;padding-right:12px;">
            ค่าเฉลี่ยรวมทุกด้าน (Overall Mean)
          </td>
          <td>${analytics.overallMean.toFixed(2)}</td>
          <td>${analytics.overallSD.toFixed(2)}</td>
          <td>${analytics.overallLevelText}</td>
        </tr>
      </tbody>
    </table>

    <div class="analysis-box">
      <strong>สรุปและวิเคราะห์ผลการประเมินโครงการ:</strong><br/>
      1. <strong>ภาพรวมความพึงพอใจ:</strong> ผู้เข้าร่วมกิจกรรมจำนวนทั้งหมด ${analytics.totalN.toLocaleString()} คน มีความพึงพอใจในภาพรวมทุกด้านอยู่ในระดับ <strong>"${analytics.overallLevelText}"</strong> โดยมีค่าเฉลี่ยรวม (x̄) เท่ากับ <strong>${analytics.overallMean.toFixed(2)}</strong> คะแนน (จากคะแนนเต็ม 5.00) และส่วนเบี่ยงเบนมาตรฐาน (S.D.) เท่ากับ ${analytics.overallSD.toFixed(2)}<br/>
      2. <strong>ประเด็นที่ได้คะแนนเฉลี่ยสูงสุด:</strong> ได้แก่ <em>"${highest ? highest.title : '-'}"</em> มีค่าเฉลี่ย (x̄) เท่ากับ <strong>${highest ? highest.mean.toFixed(2) : '-'}</strong> คะแนน (ระดับ${highest ? highest.levelText : '-'})<br/>
      3. <strong>ประเด็นที่มีคะแนนเฉลี่ยรองลงมา/ควรพัฒนาเพิ่มเติม:</strong> ได้แก่ <em>"${lowest ? lowest.title : '-'}"</em> มีค่าเฉลี่ย (x̄) เท่ากับ <strong>${lowest ? lowest.mean.toFixed(2) : '-'}</strong> คะแนน (ระดับ${lowest ? lowest.levelText : '-'})
    </div>
  </div>
</body>
</html>`;

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
};

// คงฟังก์ชันชื่อเดิมไว้เพื่อความเข้ากันได้ย้อนหลัง
export const exportToExcel = (data: KrathongExportRecord[], filename = 'loy-krathong-report.xlsx') => {
  const dummyAnalytics: EvaluationAnalyticsSummary = {
    totalN: 0,
    userTypeCounts: { student: 0, staff: 0, general: 0 },
    questionStats: [],
    overallMean: 0,
    overallSD: 0,
    overallLevelText: '-',
    highestDimension: null,
    lowestDimension: null,
    records: []
  };
  exportEvaluationAndProjectToExcel(dummyAnalytics, data, filename);
};

export const exportToPDF = (data: KrathongExportRecord[]) => {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Loy Krathong Online - Summary Report', 14, 18);
  const tableRows = data.map((item, index) => [
    index + 1,
    sanitizeSpreadsheetCell(item.user_type),
    sanitizeSpreadsheetCell(item.owner_name),
    sanitizeSpreadsheetCell(item.wish_message).slice(0, 35),
    sanitizeSpreadsheetCell(item.status),
    item.created_at ? sanitizeSpreadsheetCell(item.created_at).slice(0, 16) : '-'
  ]);
  autoTable(doc, {
    startY: 28,
    head: [['#', 'Type', 'Name', 'Wish Message', 'Status', 'Date']],
    body: tableRows
  });
  doc.save('loy-krathong-report.pdf');
};
