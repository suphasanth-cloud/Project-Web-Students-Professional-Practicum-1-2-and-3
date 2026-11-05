import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { AttendanceLog, AcademicSemester } from '../../types'
import { getPracticumInfo } from '../../lib/practicum'
import PracticumLevelBanner from '../../components/PracticumLevelBanner'

export default function TimesheetPage() {
  const { profile } = useAuth()
  const [records, setRecords] = useState<AttendanceLog[]>([])
  const [semester, setSemester] = useState<AcademicSemester | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    check_in_time: '08:00',
    check_out_time: '16:00',
    status: 'present' as 'present' | 'late' | 'absent' | 'leave',
    notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [profile?.id])

  const fetchData = async () => {
    if (!profile?.id) return
    try {
      const semRes = await api.get<{ data: AcademicSemester[] }>('/semesters.php')
      const sem = semRes.data.find((s) => s.is_current) || null
      setSemester(sem)

      const res = await api.get<{ data: AttendanceLog[] }>(`/attendance.php?user_id=${profile.id}`)
      setRecords(res.data || [])
    } catch {
      // fetch error
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !semester) return

    try {
      await api.post('/attendance.php', {
        user_id: profile.id,
        semester_id: semester.id,
        unit_id: profile.selected_unit_id,
        date: form.date,
        check_in_time: form.check_in_time || null,
        check_out_time: form.check_out_time || null,
        status: form.status,
        notes: form.notes || null,
      })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      return
    }

    setShowForm(false)
    setForm({ date: new Date().toISOString().split('T')[0], check_in_time: '08:00', check_out_time: '16:00', status: 'present', notes: '' })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบบันทึกเวลานี้ใช่ไหม?')) return
    await api.delete(`/attendance.php?id=${id}`)
    fetchData()
  }

  const statusLabels: Record<string, string> = {
    present: 'มาปฏิบัติ',
    late: 'มาสาย',
    absent: 'ขาด',
    leave: 'ลา',
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">บันทึกเวลาเข้า-ออก</h1>
          <p className="text-sm text-gray-500 mt-1">ลงเวลาการฝึกปฏิบัติประจำวัน</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ บันทึกเวลา</button>
        )}
      </div>

      {getPracticumInfo(profile?.academic_year_level) && (
        <PracticumLevelBanner info={getPracticumInfo(profile?.academic_year_level)!} compact />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 animate-scale-in">
          <h2 className="text-lg font-semibold text-gray-700">บันทึกเวลาใหม่</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะ</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'present' | 'late' | 'absent' | 'leave' })} className="input-field">
                <option value="present">มาปฏิบัติ</option>
                <option value="late">มาสาย</option>
                <option value="absent">ขาด</option>
                <option value="leave">ลา</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาเข้า</label>
              <input type="time" value={form.check_in_time} onChange={(e) => setForm({ ...form, check_in_time: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เวลาออก</label>
              <input type="time" value={form.check_out_time} onChange={(e) => setForm({ ...form, check_out_time: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุ</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">บันทึก</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>ยังไม่มีบันทึกเวลา กด "+ บันทึกเวลา" เพื่อเริ่ม</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                <th className="py-3 px-2">วันที่</th>
                <th className="py-3 px-2">เข้า</th>
                <th className="py-3 px-2">ออก</th>
                <th className="py-3 px-2">สถานะ</th>
                <th className="py-3 px-2">อนุมัติ</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 text-sm">
                  <td className="py-3 px-2 text-gray-700">{r.date}</td>
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
                      <button onClick={() => handleDelete(r.id)} className="text-error-600 hover:text-error-700 text-xs">ลบ</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
