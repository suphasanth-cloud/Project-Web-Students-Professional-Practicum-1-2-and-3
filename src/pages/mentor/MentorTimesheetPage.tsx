import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { AttendanceLog, UserProfile } from '../../types'

export default function MentorTimesheetPage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<(AttendanceLog & { student: UserProfile })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  useEffect(() => {
    fetchRecords()
  }, [profile?.id, filter])

  const fetchRecords = async () => {
    if (!profile?.id) return
    const { data: students } = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')

    if (!students || students.length === 0) {
      setRecords([])
      setLoading(false)
      return
    }

    const results = await Promise.all(
      students.map(s => api.get<{ data: AttendanceLog[] }>(`/attendance.php?user_id=${s.id}`))
    )
    let allRecords = results.flatMap(r => r.data || [])

    if (filter !== 'all') {
      allRecords = allRecords.filter(r => r.mentor_approval_status === filter)
    }

    allRecords.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    const studentMap = new Map<string, UserProfile>()
    students.forEach(p => studentMap.set(p.id, p))

    setRecords(allRecords.map(r => ({ ...r, student: studentMap.get(r.user_id) as UserProfile })))
    setLoading(false)
  }

  const handleQuickApprove = async (id: string) => {
    try {
      await api.put(`/attendance.php?id=${id}`, { mentor_approval_status: 'approved' })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      return
    }
    fetchRecords()
  }

  const handleReject = async (id: string) => {
    if (!confirm('ต้องการปฏิเสธบันทึกเวลานี้ใช่ไหม?')) return
    try {
      await api.put(`/attendance.php?id=${id}`, { mentor_approval_status: 'rejected' })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      return
    }
    fetchRecords()
  }

  const statusLabels: Record<string, string> = { present: 'มา', late: 'สาย', absent: 'ขาด', leave: 'ลา' }
  const statusBadges: Record<string, string> = {
    present: 'bg-success-100 text-success-700',
    late: 'bg-warning-100 text-warning-700',
    absent: 'bg-error-100 text-error-700',
    leave: 'bg-secondary-100 text-secondary-700',
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">อนุมัติบันทึกเวลา</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบเวลาเข้า-ออกของนักศึกษา</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          { value: 'pending', label: 'รอตรวจสอบ' },
          { value: 'approved', label: 'อนุมัติแล้ว' },
          { value: 'rejected', label: 'ปฏิเสธ' },
          { value: 'all', label: 'ทั้งหมด' },
        ] as const).map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.value ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>ไม่มีบันทึกเวลาในหมวดนี้</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                <th className="py-3 px-2">นักศึกษา</th>
                <th className="py-3 px-2">วันที่</th>
                <th className="py-3 px-2">เข้า</th>
                <th className="py-3 px-2">ออก</th>
                <th className="py-3 px-2">สถานะ</th>
                <th className="py-3 px-2">อนุมัติ</th>
                <th className="py-3 px-2">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-gray-100 text-sm">
                  <td className="py-3 px-2 text-gray-700 font-medium">
                    {r.student?.first_name} {r.student?.last_name}
                    <span className="text-xs text-gray-400 block">ปี {r.student?.academic_year_level}</span>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{r.date}</td>
                  <td className="py-3 px-2 text-gray-600">{r.check_in_time || '-'}</td>
                  <td className="py-3 px-2 text-gray-600">{r.check_out_time || '-'}</td>
                  <td className="py-3 px-2"><span className={`badge ${statusBadges[r.status]}`}>{statusLabels[r.status]}</span></td>
                  <td className="py-3 px-2">
                    <span className={`badge ${
                      r.mentor_approval_status === 'approved' ? 'badge-approved' :
                      r.mentor_approval_status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                    }`}>
                      {r.mentor_approval_status === 'approved' ? 'อนุมัติ' :
                       r.mentor_approval_status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจ'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {r.mentor_approval_status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleQuickApprove(r.id)} className="text-success-600 hover:text-success-700 text-xs font-medium">อนุมัติ</button>
                        <button onClick={() => handleReject(r.id)} className="text-error-600 hover:text-error-700 text-xs font-medium">ปฏิเสธ</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
