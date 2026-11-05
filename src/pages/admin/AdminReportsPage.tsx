import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UserProfile, Evaluation, ActivityLog, AttendanceLog } from '../../types'

export default function AdminReportsPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [attendance, setAttendance] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<'all' | 1 | 2 | 3>('all')

  useEffect(() => {
    const fetchAll = async () => {
      const studsRes = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
      const evalsRes = await api.get<{ data: Evaluation[] }>('/evaluations.php?user_id=all')
      const actsRes = await api.get<{ data: ActivityLog[] }>('/activities.php?user_id=all')
      const attsRes = await api.get<{ data: AttendanceLog[] }>('/attendance.php?user_id=all')
      setStudents(studsRes.data || [])
      setEvaluations(evalsRes.data || [])
      setActivities(actsRes.data || [])
      setAttendance(attsRes.data || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const filteredStudents = students.filter(s => yearFilter === 'all' || s.academic_year_level === yearFilter)

  const stats = {
    totalStudents: filteredStudents.length,
    totalActivities: activities.filter(a => filteredStudents.some(s => s.id === a.user_id)).length,
    approvedActivities: activities.filter(a => filteredStudents.some(s => s.id === a.user_id) && a.mentor_approval_status === 'approved').length,
    totalAttendance: attendance.filter(a => filteredStudents.some(s => s.id === a.user_id)).length,
    passed: evaluations.filter(e => e.result === 'pass' && filteredStudents.some(s => s.id === e.user_id)).length,
    failed: evaluations.filter(e => e.result === 'fail' && filteredStudents.some(s => s.id === e.user_id)).length,
    withdrawn: evaluations.filter(e => e.result === 'withdrawn' && filteredStudents.some(s => s.id === e.user_id)).length,
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">รายงาน</h1><p className="text-sm text-gray-500 mt-1">สถิติและรายงานการฝึกปฏิบัติวิชาชีพ</p></div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as 1 | 2 | 3)} className="input-field max-w-xs">
          <option value="all">ทุกชั้นปี</option>
          <option value={1}>ปี 1</option>
          <option value={2}>ปี 2</option>
          <option value={3}>ปี 3</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center"><p className="text-3xl font-bold text-primary-600">{stats.totalStudents}</p><p className="text-sm text-gray-500">นักศึกษา</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-secondary-600">{stats.totalActivities}</p><p className="text-sm text-gray-500">บันทึกกิจกรรม</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-success-600">{stats.approvedActivities}</p><p className="text-sm text-gray-500">อนุมัติแล้ว</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-warning-600">{stats.totalAttendance}</p><p className="text-sm text-gray-500">บันทึกเวลา</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center"><p className="text-3xl font-bold text-success-600">{stats.passed}</p><p className="text-sm text-gray-500">ผ่าน</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-error-600">{stats.failed}</p><p className="text-sm text-gray-500">ไม่ผ่าน</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-warning-600">{stats.withdrawn}</p><p className="text-sm text-gray-500">ยุติการฝึก</p></div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">รายงานรายบุคคล</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
              <th className="py-3 px-2">ชื่อ</th>
              <th className="py-3 px-2">ปี</th>
              <th className="py-3 px-2">สาขา</th>
              <th className="py-3 px-2">กิจกรรม</th>
              <th className="py-3 px-2">เวลา</th>
              <th className="py-3 px-2">คะแนน</th>
              <th className="py-3 px-2">ผล</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(s => {
              const eval_ = evaluations.find(e => e.user_id === s.id)
              const actCount = activities.filter(a => a.user_id === s.id).length
              const attCount = attendance.filter(a => a.user_id === s.id).length
              return (
                <tr key={s.id} className="border-b border-gray-100 text-sm">
                  <td className="py-3 px-2 text-gray-700 font-medium">{s.prefix_name} {s.first_name} {s.last_name}</td>
                  <td className="py-3 px-2 text-gray-600">{s.academic_year_level}</td>
                  <td className="py-3 px-2 text-gray-600">{s.major || '-'}</td>
                  <td className="py-3 px-2 text-gray-600">{actCount}</td>
                  <td className="py-3 px-2 text-gray-600">{attCount}</td>
                  <td className="py-3 px-2 text-gray-600">{eval_?.score || '-'}</td>
                  <td className="py-3 px-2">
                    {eval_ ? (
                      <span className={`badge ${eval_.result === 'pass' ? 'badge-approved' : eval_.result === 'fail' ? 'badge-rejected' : eval_.result === 'withdrawn' ? 'badge-pending' : 'bg-gray-100 text-gray-600'}`}>
                        {eval_.result === 'pass' ? 'ผ่าน' : eval_.result === 'fail' ? 'ไม่ผ่าน' : eval_.result === 'withdrawn' ? 'ยุติ' : 'รอประเมิน'}
                      </span>
                    ) : <span className="text-gray-400">-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
