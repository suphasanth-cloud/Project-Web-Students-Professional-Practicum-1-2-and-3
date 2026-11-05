import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UserProfile, Evaluation, ActivityLog } from '../../types'

export default function InstructorSummaryPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      const studsRes = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
      const evalsRes = await api.get<{ data: Evaluation[] }>('/evaluations.php?user_id=all')
      const actsRes = await api.get<{ data: ActivityLog[] }>('/activities.php?user_id=all')

      setStudents(studsRes.data || [])
      setEvaluations(evalsRes.data || [])
      setActivities(actsRes.data || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const resultLabels: Record<string, string> = { pass: 'ผ่าน', fail: 'ไม่ผ่าน', withdrawn: 'ยุติ', pending: 'รอประเมิน' }

  const stats = {
    total: students.length,
    passed: evaluations.filter(e => e.result === 'pass').length,
    failed: evaluations.filter(e => e.result === 'fail').length,
    withdrawn: evaluations.filter(e => e.result === 'withdrawn').length,
    pending: students.length - evaluations.filter(e => e.result !== 'pending').length,
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">สรุปผลการฝึกปฏิบัติ</h1>
        <p className="text-sm text-gray-500 mt-1">รายงานสรุปผลการฝึกปฏิบัติวิชาชีพ</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center"><p className="text-3xl font-bold text-primary-600">{stats.total}</p><p className="text-sm text-gray-500">นักศึกษาทั้งหมด</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-success-600">{stats.passed}</p><p className="text-sm text-gray-500">ผ่าน</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-error-600">{stats.failed}</p><p className="text-sm text-gray-500">ไม่ผ่าน</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-warning-600">{stats.pending}</p><p className="text-sm text-gray-500">รอประเมิน</p></div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">รายชื่อนักศึกษาและผลการประเมิน</h2>
        {students.length === 0 ? (
          <p className="text-center text-gray-500 py-8">ไม่มีข้อมูล</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                <th className="py-3 px-2">ชื่อ</th>
                <th className="py-3 px-2">สาขา</th>
                <th className="py-3 px-2">ปี</th>
                <th className="py-3 px-2">บันทึกกิจกรรม</th>
                <th className="py-3 px-2">คะแนน</th>
                <th className="py-3 px-2">ผล</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const eval_ = evaluations.find(e => e.user_id === s.id)
                const actCount = activities.filter(a => a.user_id === s.id).length
                const approvedCount = activities.filter(a => a.user_id === s.id && a.mentor_approval_status === 'approved').length
                return (
                  <tr key={s.id} className="border-b border-gray-100 text-sm">
                    <td className="py-3 px-2 text-gray-700 font-medium">{s.prefix_name} {s.first_name} {s.last_name}</td>
                    <td className="py-3 px-2 text-gray-600">{s.major || '-'}</td>
                    <td className="py-3 px-2 text-gray-600">{s.academic_year_level}</td>
                    <td className="py-3 px-2 text-gray-600">{approvedCount}/{actCount}</td>
                    <td className="py-3 px-2 text-gray-600">{eval_?.score || '-'}</td>
                    <td className="py-3 px-2">
                      {eval_ ? (
                        <span className={`badge ${eval_.result === 'pass' ? 'badge-approved' : eval_.result === 'fail' ? 'badge-rejected' : eval_.result === 'withdrawn' ? 'badge-pending' : 'bg-gray-100 text-gray-600'}`}>
                          {resultLabels[eval_.result]}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
