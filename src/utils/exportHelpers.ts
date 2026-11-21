// src/utils/exportHelpers.ts
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sanitizeSpreadsheetCell } from './security';
import {
  EVALUATION_DIMENSIONS,
  EVALUATION_QUESTIONS,
  COMMUNITY_EVALUATION_QUESTIONS,
  SDG_EVALUATION_ITEMS,
  buildStudentTranscriptRoster,
  type EvaluationAnalyticsSummary,
  type ParsedEvaluationRecord,
  type QuestionStatRow
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
  staff: 'อาจารย์/บุคลากร',
  general: 'บุคคลทั่วไป/ชุมชน'
};

function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildQuestionStatSummaryRow(
  codeLabel: string | number,
  dimensionLabel: string,
  st: QuestionStatRow
): Record<string, unknown> {
  return {
    'ข้อที่': codeLabel,
    'หมวดประเมิน': sanitizeSpreadsheetCell(dimensionLabel),
    'ประเด็นการประเมินความพึงพอใจ': sanitizeSpreadsheetCell(st.title),
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
    'ระดับความพึงพอใจ / เกณฑ์': st.levelText
  };
}

/**
 * 1. Export ข้อมูลครบวงจรเป็นไฟล์ Excel (.xlsx) 4 Sheets:
 *    - Sheet 1: 1_Raw_Data (ข้อมูลดิบผู้ตอบแบบประเมิน 36 ข้อ + ชุมชน 4 ข้อ + 7 SDGs + ข้อเสนอแนะ 3 ช่อง)
 *    - Sheet 2: 2_Summary_Table (ตารางสรุปสถิติ 9 หมวด, 36 ข้อหลัก, ชุมชน 4 ข้อ และตัวชี้วัด KPIs)
 *    - Sheet 3: 3_SDGs_Summary (สรุปผลความสอดคล้องเป้าหมาย SDGs 7 เป้าหมาย)
 *    - Sheet 4: 4_Krathongs_Data (รายชื่อและคำอธิษฐานผู้ลอยกระทง)
 */
export const exportEvaluationAndProjectToExcel = (
  analytics: EvaluationAnalyticsSummary,
  krathongs: KrathongExportRecord[] = [],
  filename = 'loy-krathong-project-summary.xlsx'
) => {
  const workbook = XLSX.utils.book_new();

  // --- Sheet 1: 1_Raw_Data ---
  const rawSheetRows =
    analytics.records.length > 0
      ? analytics.records.map((rec, index) => {
          const row: Record<string, any> = {
            'ลำดับ': index + 1,
            'วัน-เวลา (Timestamp)': sanitizeSpreadsheetCell(
              rec.created_at ? new Date(rec.created_at).toLocaleString('th-TH') : '-'
            ),
            'ประเภทผู้เข้าร่วม': sanitizeSpreadsheetCell(USER_TYPE_THAI[rec.user_type] || rec.user_type),
            'รหัสนักศึกษา': sanitizeSpreadsheetCell(rec.student_id || '-'),
            'คณะ / วิทยาลัย': sanitizeSpreadsheetCell(rec.faculty || '-'),
            'สาขา / สังกัด': sanitizeSpreadsheetCell(rec.major || '-'),
            'ชั้นปี': sanitizeSpreadsheetCell(rec.year_level || '-'),
            'บทบาท': sanitizeSpreadsheetCell(rec.role || '-'),
            'ยินยอม PDPA': rec.pdpaAccepted ? 'ยินยอม' : '-'
          };

          EVALUATION_QUESTIONS.forEach((q, qIdx) => {
            row[`ข้อ ${q.id}: ${q.shortLabel.replace(/^\d+\.\d+\s*/, '')}`] =
              rec.scores[qIdx] ?? '-';
          });

          COMMUNITY_EVALUATION_QUESTIONS.forEach((cq, cIdx) => {
            const val =
              rec.community_scores && rec.community_scores.length === COMMUNITY_EVALUATION_QUESTIONS.length
                ? rec.community_scores[cIdx]
                : '-';
            row[`ชุมชน ${cq.id}: ${cq.shortLabel.replace(/^ช\.\d+\s*/, '')}`] = val;
          });

          SDG_EVALUATION_ITEMS.forEach((sdg, sIdx) => {
            const val =
              rec.sdg_results && rec.sdg_results.length === SDG_EVALUATION_ITEMS.length
                ? rec.sdg_results[sIdx]
                  ? 'สอดคล้อง / บรรลุ'
                  : 'ไม่สอดคล้อง'
                : '-';
            row[`SDG ${sdg.code}: ${sdg.nameTh}`] = val;
          });

          row['ค่าเฉลี่ยรายบุคคล (x̄)'] = rec.average_score;
          row['สิ่งที่ประทับใจ'] = sanitizeSpreadsheetCell(rec.feedback_impressed || '-');
          row['สิ่งที่ควรปรับปรุง'] = sanitizeSpreadsheetCell(rec.feedback_improve || '-');
          row['ข้อเสนอแนะอื่นๆ'] = sanitizeSpreadsheetCell(rec.feedback_other || '-');
          return row;
        })
      : [
          {
            'ลำดับ': '-',
            'หมายเหตุ': 'ยังไม่มีข้อมูลผู้ตอบแบบประเมินมาตรฐานใหม่ (V3)'
          }
        ];

  const rawWorksheet = XLSX.utils.json_to_sheet(rawSheetRows);
  XLSX.utils.book_append_sheet(workbook, rawWorksheet, '1_Raw_Data');

  // --- Sheet 2: 2_Summary_Table ---
  const summarySheetRows: Record<string, unknown>[] = [];
  const dimMap = new Map(EVALUATION_DIMENSIONS.map((d) => [d.id, d]));

  analytics.dimensionStats.forEach((dim) => {
    summarySheetRows.push({
      'ข้อที่': 'หมวด',
      'หมวดประเมิน': sanitizeSpreadsheetCell(dim.sectionGroup),
      'ประเด็นการประเมินความพึงพอใจ': sanitizeSpreadsheetCell(dim.label),
      'จำนวนผู้ตอบ (N)': dim.totalN,
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
      'ค่าเฉลี่ย (x̄)': dim.mean.toFixed(2),
      'ส่วนเบี่ยงเบนมาตรฐาน (S.D.)': dim.sd.toFixed(2),
      'ระดับความพึงพอใจ / เกณฑ์': dim.levelText
    });

    const items = analytics.questionStats.filter((q) => q.dimensionId === dim.dimensionId);
    items.forEach((st) => {
      summarySheetRows.push(buildQuestionStatSummaryRow(st.questionId, dim.label, st));
    });
  });

  // ส่วนที่ 15: สำหรับผู้ปกครอง / ชุมชน
  analytics.communityStats.forEach((st) => {
    summarySheetRows.push(
      buildQuestionStatSummaryRow(`ช.${st.questionId}`, 'ส่วนที่ 15: สำหรับผู้ปกครอง / ชุมชน', st)
    );
  });

  // ตัวชี้วัด KPIs 3 ข้อ (หน้า 5 เล่มโครงการ)
  analytics.kpiStats.forEach((kpi, idx) => {
    summarySheetRows.push({
      'ข้อที่': `KPI ${idx + 1}`,
      'หมวดประเมิน': 'ตัวชี้วัดความสำเร็จโครงการ (เกณฑ์ ≥ 4.00)',
      'ประเด็นการประเมินความพึงพอใจ': sanitizeSpreadsheetCell(kpi.label),
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
      'ค่าเฉลี่ย (x̄)': kpi.mean.toFixed(2),
      'ส่วนเบี่ยงเบนมาตรฐาน (S.D.)': kpi.sd.toFixed(2),
      'ระดับความพึงพอใจ / เกณฑ์':
        analytics.totalN === 0
          ? 'รอข้อมูล'
          : kpi.passed
            ? 'ผ่านเกณฑ์ (≥ 4.00)'
            : 'ต่ำกว่าเกณฑ์ (< 4.00)'
    });
  });

  // แถวสรุปภาพรวมท้ายตาราง
  summarySheetRows.push({
    'ข้อที่': 'สรุป',
    'หมวดประเมิน': 'ภาพรวมโครงการ',
    'ประเด็นการประเมินความพึงพอใจ': 'ค่าเฉลี่ยรวม 36 ข้อหลัก (Overall Mean)',
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
    'ระดับความพึงพอใจ / เกณฑ์': analytics.overallLevelText
  });

  void dimMap;
  const summaryWorksheet = XLSX.utils.json_to_sheet(summarySheetRows);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '2_Summary_Table');

  // --- Sheet 3: 3_SDGs_Summary ---
  const sdgRows = analytics.sdgStats.map((sdg) => ({
    'รหัส SDG': `SDG ${sdg.code}`,
    'เป้าหมาย': `${sdg.nameTh} (${sdg.nameEn})`,
    'รายละเอียดความสอดคล้อง': sanitizeSpreadsheetCell(sdg.description),
    'จำนวนผู้ตอบ (N)': sdg.totalN,
    'สอดคล้อง / บรรลุ (คน)': sdg.compliantCount,
    'สอดคล้อง / บรรลุ (%)': `${sdg.compliantPct.toFixed(1)}%`,
    'ไม่สอดคล้อง (คน)': sdg.nonCompliantCount,
    'ไม่สอดคล้อง (%)': `${sdg.nonCompliantPct.toFixed(1)}%`
  }));
  const sdgWorksheet = XLSX.utils.json_to_sheet(sdgRows);
  XLSX.utils.book_append_sheet(workbook, sdgWorksheet, '3_SDGs_Summary');

  // --- Sheet 4: 4_Krathongs_Data ---
  if (krathongs.length > 0) {
    const statusMap: Record<string, string> = {
      approved: 'แสดงผล',
      pending: 'แสดงผล',
      rejected: 'ซ่อนแล้ว'
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
    XLSX.utils.book_append_sheet(workbook, krathongWorksheet, '4_Krathongs_Data');
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
    'คณะ / วิทยาลัย',
    'สาขา / สังกัด',
    'ชั้นปี',
    'บทบาท',
    'ยินยอม PDPA',
    ...EVALUATION_QUESTIONS.map((q) => `ข้อ_${q.id}`),
    ...COMMUNITY_EVALUATION_QUESTIONS.map((cq) => `ชุมชน_${cq.id}`),
    ...SDG_EVALUATION_ITEMS.map((sdg) => `SDG_${sdg.code}`),
    'ค่าเฉลี่ยรวม',
    'สิ่งที่ประทับใจ',
    'สิ่งที่ควรปรับปรุง',
    'ข้อเสนอแนะอื่นๆ'
  ];

  const escapeCsvField = (val: unknown) => {
    const safe = sanitizeSpreadsheetCell(val).replace(/"/g, '""');
    return `"${safe}"`;
  };

  const lines = [
    headers.map(escapeCsvField).join(','),
    ...analytics.records.map((rec, idx) => {
      const communityCells = COMMUNITY_EVALUATION_QUESTIONS.map((_, cIdx) =>
        rec.community_scores && rec.community_scores.length === COMMUNITY_EVALUATION_QUESTIONS.length
          ? rec.community_scores[cIdx]
          : '-'
      );
      const sdgCells = SDG_EVALUATION_ITEMS.map((_, sIdx) =>
        rec.sdg_results && rec.sdg_results.length === SDG_EVALUATION_ITEMS.length
          ? rec.sdg_results[sIdx]
            ? 'สอดคล้อง / บรรลุ'
            : 'ไม่สอดคล้อง'
          : '-'
      );

      return [
        idx + 1,
        rec.created_at,
        USER_TYPE_THAI[rec.user_type] || rec.user_type,
        rec.student_id || '-',
        rec.faculty || '-',
        rec.major || '-',
        rec.year_level || '-',
        rec.role || '-',
        rec.pdpaAccepted ? 'ยินยอม' : '-',
        ...EVALUATION_QUESTIONS.map((_, qIdx) => rec.scores[qIdx] ?? '-'),
        ...communityCells,
        ...sdgCells,
        rec.average_score.toFixed(2),
        rec.feedback_impressed || '',
        rec.feedback_improve || '',
        rec.feedback_other || ''
      ]
        .map(escapeCsvField)
        .join(',');
    })
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
 *    ครบทั้ง KPIs 3 ข้อ, กราฟ Radar Chart 9 หมวด, ตาราง 36 ข้อ + ชุมชน 4 ข้อ และผลความสอดคล้อง 7 SDGs
 */
export const openOfficialA4ReportPrintView = (
  analytics: EvaluationAnalyticsSummary,
  totalKrathongs = 0
) => {
  const radarDataUrl = generateRadarChartDataUrl(
    analytics.dimensionStats,
    analytics.overallMean,
    analytics.totalN,
    'bw'
  );

  const XBAR_HTML = '<span class="xbar">x</span>';

  const highest = analytics.highestDimension;
  const lowest = analytics.lowestDimension;
  const studentPct =
    analytics.totalN > 0 ? ((analytics.userTypeCounts.student / analytics.totalN) * 100).toFixed(1) : '0.0';
  const staffPct =
    analytics.totalN > 0 ? ((analytics.userTypeCounts.staff / analytics.totalN) * 100).toFixed(1) : '0.0';
  const generalPct =
    analytics.totalN > 0 ? ((analytics.userTypeCounts.general / analytics.totalN) * 100).toFixed(1) : '0.0';

  const topSdg =
    analytics.sdgStats.length > 0
      ? [...analytics.sdgStats].sort((a, b) => b.compliantPct - a.compliantPct)[0]
      : null;

  const passedKpiCount = analytics.kpiStats.filter((k) => k.passed).length;

  const groupedQuestionRowsHtml = analytics.dimensionStats
    .map((dim) => {
      const items = analytics.questionStats.filter((q) => q.dimensionId === dim.dimensionId);
      const groupRow = `
        <tr class="group-row">
          <td colspan="7" class="left">${escapeHtml(dim.label)} <span style="font-weight:400;color:#222222;">(${escapeHtml(dim.sectionGroup)})</span></td>
          <td>${dim.mean.toFixed(2)}</td>
          <td>${dim.sd.toFixed(2)}</td>
          <td>${escapeHtml(dim.levelText)}</td>
        </tr>
      `;
      const itemRows = items
        .map(
          (st) => `
          <tr>
            <td>${st.questionId}</td>
            <td class="left">${st.subGroupLabel ? `<span class="badge-sub">${escapeHtml(st.subGroupLabel)}</span> ` : ''}${escapeHtml(st.title)}</td>
            <td>${st.percentages[5].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[5]})</span></td>
            <td>${st.percentages[4].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[4]})</span></td>
            <td>${st.percentages[3].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[3]})</span></td>
            <td>${st.percentages[2].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[2]})</span></td>
            <td>${st.percentages[1].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[1]})</span></td>
            <td><strong>${st.mean.toFixed(2)}</strong></td>
            <td>${st.sd.toFixed(2)}</td>
            <td>${escapeHtml(st.levelText)}</td>
          </tr>
        `
        )
        .join('');
      return groupRow + itemRows;
    })
    .join('');

  const communityRowsHtml =
    analytics.communityN > 0
      ? `
        <tr class="group-row">
          <td colspan="10" class="left">ส่วนที่ 15: แบบประเมินสำหรับผู้ปกครอง / ชุมชน (N = ${analytics.communityN} คน)</td>
        </tr>
        ${analytics.communityStats
          .map(
            (st) => `
            <tr>
              <td>ช.${st.questionId}</td>
              <td class="left">${escapeHtml(st.title)}</td>
              <td>${st.percentages[5].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[5]})</span></td>
              <td>${st.percentages[4].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[4]})</span></td>
              <td>${st.percentages[3].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[3]})</span></td>
              <td>${st.percentages[2].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[2]})</span></td>
              <td>${st.percentages[1].toFixed(1)}%<br/><span style="color:#333333;font-size:11px;">(${st.counts[1]})</span></td>
              <td><strong>${st.mean.toFixed(2)}</strong></td>
              <td>${st.sd.toFixed(2)}</td>
              <td>${escapeHtml(st.levelText)}</td>
            </tr>
          `
          )
          .join('')}
      `
      : '';

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>รายงานสรุปผลการประเมินโครงการลอยกระทงบุฟเฟต์ (A4 Report)</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 0; }
    * {
      box-sizing: border-box;
      font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      color: #000000;
      background: #f3f3f3;
      font-size: 15px;
      line-height: 1.38;
    }
    .screen-wrap {
      padding: 16px;
    }
    .toolbar {
      max-width: 210mm;
      margin: 0 auto 12px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      color: #000000;
      border: 1px solid #000000;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 16px;
    }
    .toolbar button {
      background: #111111;
      color: #ffffff;
      border: 1px solid #000000;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
    }
    .a4-page {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
    table.print-shell {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }
    td.print-margin-top,
    td.print-margin-bottom {
      border: none;
      padding: 0;
      height: 13mm;
    }
    td.print-body {
      border: none;
      padding: 0 15mm;
      vertical-align: top;
    }
    h1 { font-size: 21px; font-weight: 700; text-align: center; margin: 0 0 2px 0; color: #000000; }
    h2 { font-size: 17px; font-weight: 700; text-align: center; color: #000000; margin: 0 0 10px 0; }
    h3 { font-size: 16.5px; font-weight: 700; color: #000000; margin: 11px 0 6px 0; border-left: 4px solid #000000; padding-left: 8px; }
    .xbar {
      display: inline-block;
      border-top: 1px solid #000000;
      line-height: 0.92;
      padding-top: 1px;
      margin: 0 1px;
    }
    .meta-box {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 6px;
      border: 1px solid #000000;
      background: #ffffff;
      padding: 7px 11px;
      margin-bottom: 10px;
      font-size: 14.5px;
      color: #000000;
    }
    .chart-wrapper { text-align: center; margin: 8px 0 10px 0; }
    .chart-wrapper img { max-width: 86%; height: auto; border: 1px solid #000000; }
    table.data-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 10px; color: #000000; }
    table.data-table th,
    table.data-table td { border: 1px solid #000000; padding: 3.5px 5px; text-align: center; color: #000000; }
    table.data-table th { background: #ececec; font-weight: 700; }
    table.data-table td.left { text-align: left; }
    table.data-table tr { break-inside: avoid; }
    tr.group-row td { background: #f3f3f3; font-weight: 700; color: #000000; }
    tr.summary-row td { background: #e4e4e4; font-weight: 700; color: #000000; }
    .badge-sub { display: inline-block; background: #ffffff; border: 1px solid #555555; border-radius: 3px; padding: 0 4px; font-size: 11.5px; font-weight: 700; color: #000000; }
    .status-cell { font-weight: 700; color: #000000; }
    .page-break { page-break-before: always; break-before: page; }
    .analysis-box {
      border: 1px solid #000000;
      padding: 9px 13px;
      background: #ffffff;
      font-size: 14.5px;
      color: #000000;
      break-inside: avoid;
    }
    @media print {
      html, body { background: #ffffff; }
      .screen-wrap { padding: 0; }
      .toolbar { display: none !important; }
      .a4-page { box-shadow: none; max-width: 100%; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="screen-wrap">
    <div class="toolbar">
      <span style="font-weight:700;">รายงานสรุปผลขนาดมาตรฐาน A4 (ขาว-ดำ • TH Sarabun PSK • โครงการลอยกระทงบุฟเฟต์)</span>
      <button onclick="window.print()">พิมพ์รายงาน / บันทึกเป็น PDF (A4)</button>
    </div>

    <div class="a4-page">
      <table class="print-shell">
        <thead>
          <tr><td class="print-margin-top"></td></tr>
        </thead>
        <tbody>
          <tr>
            <td class="print-body">
              <h1>รายงานสรุปผลการประเมินโครงการลอยกระทงบุฟเฟต์ (Loy Krathong Buffet)</h1>
              <h2>สโมสรนักศึกษาคณะวิทยาศาสตร์ มหาวิทยาลัยสงขลานครินทร์ • วันที่ 24 พฤศจิกายน 2569</h2>

              <div class="meta-box">
                <div><strong>จำนวนผู้ตอบแบบประเมิน (N):</strong> ${analytics.totalN.toLocaleString()} คน (กระทงทั้งหมด ${totalKrathongs.toLocaleString()} ใบ)</div>
                <div><strong>สัดส่วนผู้ตอบ:</strong> นักศึกษา ${studentPct}% | อาจารย์/บุคลากร ${staffPct}% | บุคคลทั่วไป/ชุมชน ${generalPct}%</div>
                <div><strong>วันที่ออกรายงาน:</strong> ${new Date().toLocaleDateString('th-TH')}</div>
              </div>

              <h3>1. สรุปตัวชี้วัดความสำเร็จของโครงการ (KPIs เชิงคุณภาพ • เกณฑ์ ≥ 4.00)</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 36px;">ข้อ</th>
                    <th>ตัวชี้วัดความสำเร็จ (หน้า 5 เล่มโครงการ)</th>
                    <th style="width: 72px;">ค่าเป้าหมาย</th>
                    <th style="width: 72px;">ค่าเฉลี่ย (${XBAR_HTML})</th>
                    <th style="width: 58px;">S.D.</th>
                    <th style="width: 92px;">ผลการประเมิน</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.kpiStats
                    .map(
                      (kpi, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td class="left">${escapeHtml(kpi.label)}</td>
                      <td>≥ ${kpi.target.toFixed(2)}</td>
                      <td><strong>${kpi.mean.toFixed(2)}</strong></td>
                      <td>${kpi.sd.toFixed(2)}</td>
                      <td class="status-cell">${analytics.totalN === 0 ? 'รอข้อมูล' : kpi.passed ? 'ผ่านเกณฑ์' : 'ต่ำกว่าเกณฑ์'}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>

              <h3>2. กราฟเรดาร์สรุปผลความพึงพอใจ 9 หมวดหลัก</h3>
              <div class="chart-wrapper">
                <img src="${radarDataUrl}" alt="Radar Chart 9 Dimensions" />
              </div>

              <table class="data-table">
                <thead>
                  <tr>
                    <th>หมวดประเมิน (9 ด้านหลัก)</th>
                    <th style="width: 195px;">กลุ่มประเมินในแบบฟอร์มมาตรฐาน</th>
                    <th style="width: 58px;">จำนวนข้อ</th>
                    <th style="width: 70px;">ค่าเฉลี่ย (${XBAR_HTML})</th>
                    <th style="width: 56px;">S.D.</th>
                    <th style="width: 84px;">ระดับความพึงพอใจ</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.dimensionStats
                    .map(
                      (dim) => `
                    <tr>
                      <td class="left"><strong>${escapeHtml(dim.label)}</strong></td>
                      <td class="left">${escapeHtml(dim.sectionGroup)}</td>
                      <td>${dim.questionCount}</td>
                      <td><strong>${dim.mean.toFixed(2)}</strong></td>
                      <td>${dim.sd.toFixed(2)}</td>
                      <td>${escapeHtml(dim.levelText)}</td>
                    </tr>
                  `
                    )
                    .join('')}
                  <tr class="summary-row">
                    <td colspan="3" class="left" style="text-align:right;padding-right:10px;">ค่าเฉลี่ยรวมทุกด้าน (Overall Mean, N = ${analytics.totalN})</td>
                    <td>${analytics.overallMean.toFixed(2)}</td>
                    <td>${analytics.overallSD.toFixed(2)}</td>
                    <td>${escapeHtml(analytics.overallLevelText)}</td>
                  </tr>
                </tbody>
              </table>

              <div class="page-break"></div>
              <h3>3. ตารางสรุปสถิติรายข้อครบทั้ง 36 ข้อหลัก (+ ส่วนที่ 15 สำหรับผู้ปกครอง/ชุมชน)</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th rowspan="2" style="width: 34px;">ข้อ</th>
                    <th rowspan="2">ประเด็นการประเมินความพึงพอใจ</th>
                    <th colspan="5">ร้อยละ (%) ของผู้ตอบในแต่ละระดับคะแนน (N = ${analytics.totalN})</th>
                    <th rowspan="2" style="width: 50px;">ค่าเฉลี่ย<br/>(${XBAR_HTML})</th>
                    <th rowspan="2" style="width: 44px;">S.D.</th>
                    <th rowspan="2" style="width: 66px;">ระดับ<br/>ความพึงพอใจ</th>
                  </tr>
                  <tr>
                    <th style="width: 44px;">5<br/>มากที่สุด</th>
                    <th style="width: 44px;">4<br/>มาก</th>
                    <th style="width: 44px;">3<br/>ปานกลาง</th>
                    <th style="width: 44px;">2<br/>น้อย</th>
                    <th style="width: 44px;">1<br/>น้อยที่สุด</th>
                  </tr>
                </thead>
                <tbody>
                  ${groupedQuestionRowsHtml}
                  ${communityRowsHtml}
                  <tr class="summary-row">
                    <td colspan="7" class="left" style="text-align:right;padding-right:10px;">ค่าเฉลี่ยรวม 36 ข้อหลัก (Overall Mean)</td>
                    <td>${analytics.overallMean.toFixed(2)}</td>
                    <td>${analytics.overallSD.toFixed(2)}</td>
                    <td>${escapeHtml(analytics.overallLevelText)}</td>
                  </tr>
                </tbody>
              </table>

              <h3>4. สรุปผลการประเมินความสอดคล้องเป้าหมายการพัฒนาที่ยั่งยืน (SDGs 7 เป้าหมาย)</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th style="width: 68px;">SDG</th>
                    <th>เป้าหมายและคำอธิบายความสอดคล้อง</th>
                    <th style="width: 62px;">ผู้ตอบ (N)</th>
                    <th style="width: 112px;">สอดคล้อง / บรรลุ</th>
                    <th style="width: 100px;">ไม่สอดคล้อง</th>
                  </tr>
                </thead>
                <tbody>
                  ${analytics.sdgStats
                    .map(
                      (sdg) => `
                    <tr>
                      <td><strong>SDG ${sdg.code}</strong></td>
                      <td class="left"><strong>${escapeHtml(sdg.nameTh)}</strong> (${escapeHtml(sdg.nameEn)})<br/><span style="color:#222222;font-size:12px;">${escapeHtml(sdg.description)}</span></td>
                      <td>${sdg.totalN}</td>
                      <td class="status-cell">${sdg.compliantCount} คน (${sdg.compliantPct.toFixed(1)}%)</td>
                      <td>${sdg.nonCompliantCount} คน (${sdg.nonCompliantPct.toFixed(1)}%)</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>

              <div class="analysis-box">
                <strong>สรุปและวิเคราะห์ผลการประเมินโครงการลอยกระทงบุฟเฟต์:</strong><br/>
                1. <strong>ภาพรวมความพึงพอใจ:</strong> ผู้เข้าร่วมกิจกรรมจำนวนทั้งหมด ${analytics.totalN.toLocaleString()} คน มีความพึงพอใจในภาพรวมทุกด้านอยู่ในระดับ <strong>&ldquo;${escapeHtml(analytics.overallLevelText)}&rdquo;</strong> ค่าเฉลี่ยรวม (${XBAR_HTML}) เท่ากับ <strong>${analytics.overallMean.toFixed(2)}</strong> (S.D. = ${analytics.overallSD.toFixed(2)})<br/>
                2. <strong>หมวดที่ได้คะแนนเฉลี่ยสูงสุด:</strong> ได้แก่ <em>&ldquo;${escapeHtml(highest ? highest.label : '-')}&rdquo;</em> (${XBAR_HTML} = <strong>${highest ? highest.mean.toFixed(2) : '-'}</strong>, ระดับ${escapeHtml(highest ? highest.levelText : '-')})<br/>
                3. <strong>หมวดที่มีคะแนนเฉลี่ยรองลงมา/ควรพัฒนาต่อยอด:</strong> ได้แก่ <em>&ldquo;${escapeHtml(lowest ? lowest.label : '-')}&rdquo;</em> (${XBAR_HTML} = <strong>${lowest ? lowest.mean.toFixed(2) : '-'}</strong>, ระดับ${escapeHtml(lowest ? lowest.levelText : '-')})<br/>
                4. <strong>ผลตัวชี้วัดความสำเร็จโครงการ (KPIs ≥ 4.00):</strong> ผ่านเกณฑ์ ${passedKpiCount} จาก ${analytics.kpiStats.length} ตัวชี้วัด และเป้าหมายความสอดคล้อง SDGs ที่โดดเด่นที่สุดคือ <strong>SDG ${topSdg ? topSdg.code : '-'} (${escapeHtml(topSdg ? topSdg.nameTh : '-')})</strong> ที่ระดับ ${topSdg ? topSdg.compliantPct.toFixed(1) : '0.0'}%
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td class="print-margin-bottom"></td></tr>
        </tfoot>
      </table>
    </div>
  </div>
</body>
</html>`;

  const htmlBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(htmlBlob);
  const printWin = window.open(blobUrl, '_blank');
  if (!printWin) {
    URL.revokeObjectURL(blobUrl);
    alert('กรุณาอนุญาตการเปิดหน้าต่างป๊อปอัป (Pop-up) เพื่อพิมพ์รายงาน PDF ขนาด A4');
    return;
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};

const FORBIDDEN_SHEET_CHARS = new Set(['[', ']', ':', '*', '?', '/', '\\']);

const buildUniqueSafeSheetName = (rawName: string, existingNames: string[]): string => {
  const cleaned =
    Array.from(rawName)
      .map((ch) => (FORBIDDEN_SHEET_CHARS.has(ch) ? '_' : ch))
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^'+|'+$/g, '') || 'ไม่ระบุคณะ';

  const existingLower = new Set(existingNames.map((n) => n.toLowerCase()));
  const base = cleaned.slice(0, 31);
  if (!existingLower.has(base.toLowerCase())) {
    return base;
  }

  for (let counter = 2; counter < 1000; counter++) {
    const suffix = `_${counter}`;
    const candidate = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
    if (!existingLower.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
  return `faculty_${existingNames.length + 1}`.slice(0, 31);
};

/**
 * 4. ส่งออกรายชื่อนักศึกษาสำหรับยื่น Activity Transcript แยก Sheet ตามคณะ (พร้อมคอลัมน์ สาขา และ ชั้นปี)
 */
export const exportStudentTranscriptByFacultyToExcel = (
  analytics: EvaluationAnalyticsSummary,
  krathongs: { id: string; owner_name: string }[] = [],
  filename = 'loy-krathong-student-transcript.xlsx',
  overrideRecords?: ParsedEvaluationRecord[]
): void => {
  const roster = buildStudentTranscriptRoster(overrideRecords ?? analytics.records, krathongs);
  const workbook = XLSX.utils.book_new();

  // --- Sheet 1: สรุปจำนวนรายคณะ ---
  const summaryRows: Record<string, any>[] =
    roster.facultyBreakdown.length > 0
      ? roster.facultyBreakdown.map((item, idx) => ({
          'ลำดับ': idx + 1,
          'คณะ / วิทยาลัย': sanitizeSpreadsheetCell(item.faculty),
          'จำนวนนักศึกษาไม่ซ้ำ (คน)': item.count,
          'สัดส่วน (%)': Number(item.percentage.toFixed(2))
        }))
      : [
          {
            'ลำดับ': '-',
            'คณะ / วิทยาลัย': 'ยังไม่มีข้อมูลนักศึกษา',
            'จำนวนนักศึกษาไม่ซ้ำ (คน)': 0,
            'สัดส่วน (%)': 0
          }
        ];

  summaryRows.push(
    {},
    {
      'ลำดับ': 'สรุป',
      'คณะ / วิทยาลัย': 'รวมนักศึกษาไม่ซ้ำทั้งหมด (Unique IDs)',
      'จำนวนนักศึกษาไม่ซ้ำ (คน)': roster.uniqueStudents.length,
      'สัดส่วน (%)': 100
    },
    {
      'ลำดับ': 'ตรวจพบ',
      'คณะ / วิทยาลัย': 'รายการส่งซ้ำรหัสนักศึกษาเดิม (ถูกตัดออกแล้ว)',
      'จำนวนนักศึกษาไม่ซ้ำ (คน)': roster.duplicateIdCount,
      'สัดส่วน (%)': ''
    },
    {
      'ลำดับ': 'เฝ้าระวัง',
      'คณะ / วิทยาลัย': 'รายการที่ส่งจากอุปกรณ์เดียวกันมากกว่า 1 รหัส',
      'จำนวนนักศึกษาไม่ซ้ำ (คน)': roster.sharedDeviceCount,
      'สัดส่วน (%)': ''
    }
  );

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 10 }, { wch: 46 }, { wch: 24 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, '1_สรุปจำนวนรายคณะ');

  const formatStudentRows = (entries: typeof roster.uniqueStudents) =>
    entries.map((entry, idx) => ({
      'ลำดับ': idx + 1,
      'รหัสนักศึกษา': sanitizeSpreadsheetCell(entry.student_id),
      'คณะ / วิทยาลัย (จำแนกจากรหัส)': sanitizeSpreadsheetCell(entry.faculty || 'ไม่ระบุคณะ'),
      'สาขา': sanitizeSpreadsheetCell(entry.major || '-'),
      'ชั้นปี': sanitizeSpreadsheetCell(entry.year_level || '-'),
      'สถานะตรวจสอบอุปกรณ์':
        entry.deviceStatus === 'shared_device'
          ? 'พบใช้อุปกรณ์ซ้ำ (ตรวจสอบเพิ่มเติม)'
          : 'ยืนยัน 1 เครื่อง 1 รหัส',
      'รหัสอุปกรณ์ (Device Token)': sanitizeSpreadsheetCell(entry.device_id || '-'),
      'วัน-เวลาที่ส่ง': sanitizeSpreadsheetCell(
        entry.created_at ? new Date(entry.created_at).toLocaleString('th-TH') : '-'
      ),
      'รหัสกระทงอ้างอิง': sanitizeSpreadsheetCell(entry.krathong_id || '-')
    }));

  const studentSheetCols = [
    { wch: 8 },
    { wch: 16 },
    { wch: 34 },
    { wch: 26 },
    { wch: 14 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
    { wch: 38 }
  ];

  // --- Sheet 2: รายชื่อรวมทั้งหมด (ตัดซ้ำแล้ว) ---
  const allStudentsRows =
    roster.uniqueStudents.length > 0
      ? formatStudentRows(roster.uniqueStudents)
      : [
          {
            'ลำดับ': '-',
            'รหัสนักศึกษา': 'ยังไม่มีรายชื่อนักศึกษา',
            'คณะ / วิทยาลัย (จำแนกจากรหัส)': '-',
            'สาขา': '-',
            'ชั้นปี': '-',
            'สถานะตรวจสอบอุปกรณ์': '-',
            'รหัสอุปกรณ์ (Device Token)': '-',
            'วัน-เวลาที่ส่ง': '-',
            'รหัสกระทงอ้างอิง': '-'
          }
        ];

  const allStudentsSheet = XLSX.utils.json_to_sheet(allStudentsRows);
  allStudentsSheet['!cols'] = studentSheetCols;
  XLSX.utils.book_append_sheet(workbook, allStudentsSheet, '2_รายชื่อรวมทั้งหมด_ตัดซ้ำ');

  // --- Sheet 3+: แยกตามคณะ / วิทยาลัย ---
  const facultyGroups = new Map<string, typeof roster.uniqueStudents>();
  for (const entry of roster.uniqueStudents) {
    const key = entry.faculty || 'ไม่ระบุคณะ';
    const group = facultyGroups.get(key);
    if (group) {
      group.push(entry);
    } else {
      facultyGroups.set(key, [entry]);
    }
  }

  for (const [facultyName, entries] of facultyGroups.entries()) {
    const sheetName = buildUniqueSafeSheetName(facultyName, workbook.SheetNames);
    const facultySheet = XLSX.utils.json_to_sheet(formatStudentRows(entries));
    facultySheet['!cols'] = studentSheetCols;
    XLSX.utils.book_append_sheet(workbook, facultySheet, sheetName);
  }

  XLSX.writeFile(workbook, filename);
};

// คงฟังก์ชันชื่อเดิมไว้เพื่อความเข้ากันได้ย้อนหลัง
export const exportToExcel = (data: KrathongExportRecord[], filename = 'loy-krathong-report.xlsx') => {
  const dummyAnalytics: EvaluationAnalyticsSummary = {
    totalN: 0,
    legacyExcludedCount: 0,
    userTypeCounts: { student: 0, staff: 0, general: 0 },
    dimensionStats: [],
    questionStats: [],
    communityStats: [],
    communityN: 0,
    kpiStats: [],
    sdgStats: [],
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
