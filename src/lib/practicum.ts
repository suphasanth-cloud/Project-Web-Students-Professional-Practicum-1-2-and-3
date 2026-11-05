import type { AcademicYearLevel } from '../types'

export interface PracticumLevelInfo {
  title: string
  short: string
  focus: string
  requirements: string[]
  recordHint: string
}

export const PRACTICUM_LEVELS: Record<AcademicYearLevel, PracticumLevelInfo> = {
  1: {
    title: 'ฝึกปฏิบัติวิชาชีพ 1',
    short: 'ฝึก 1',
    focus: 'เรียนรู้งานครูและ E-PLC',
    requirements: [
      'บันทึกกิจกรรมการเรียนรู้งานครูรายวัน',
      'สังเกตและบันทึก E-PLC',
      'ลงเวลาเข้า-ออกทุกวันฝึก',
      'ส่งบันทึกสะท้อนคิดตามที่อาจารย์กำหนด',
    ],
    recordHint: 'เน้นบันทึกสิ่งที่เรียนรู้จากการติดตามครูพี่เลี้ยง',
  },
  2: {
    title: 'ฝึกปฏิบัติวิชาชีพ 2',
    short: 'ฝึก 2',
    focus: 'สังเกตการสอน พฤติกรรมผู้เรียน โมเดล 4+6',
    requirements: [
      'บันทึกการสังเกตการสอนตามโมเดล 4+6',
      'บันทึกพฤติกรรมผู้เรียน',
      'ลงเวลาเข้า-ออกทุกวันฝึก',
      'ส่งแผนการสอนที่ได้รับมอบหมาย',
    ],
    recordHint: 'เน้นบันทึกการสังเกตและวิเคราะห์พฤติกรรม',
  },
  3: {
    title: 'ฝึกปฏิบัติวิชาชีพ 3',
    short: 'ฝึก 3',
    focus: 'ผู้ช่วยสอน แผนการสอน เทคโนโลยีดิจิทัล',
    requirements: [
      'บันทึกการเป็นผู้ช่วยสอน/สอนเอง',
      'ส่งแผนการสอนทุกครั้งที่สอน',
      'ใช้เทคโนโลยีดิจิทัลในการจัดการเรียนการสอน',
      'ลงเวลาเข้า-ออกทุกวันฝึก',
    ],
    recordHint: 'เน้นบันทึกการปฏิบัติงานอิสระในฐานะผู้ช่วยสอน',
  },
}

export function getPracticumInfo(level: AcademicYearLevel | null | undefined): PracticumLevelInfo | null {
  if (!level) return null
  return PRACTICUM_LEVELS[level] || null
}
