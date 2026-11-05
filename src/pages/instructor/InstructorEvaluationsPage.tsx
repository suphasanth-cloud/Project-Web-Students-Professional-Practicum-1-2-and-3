import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UserProfile, Evaluation, AcademicSemester } from '../../types'

export default function InstructorEvaluationsPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [semester, setSemester] = useState<AcademicSemester | null>(null)
  const [loading, setLoading] = useState(true)
  const [evalModal, setEvalModal] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ score: '', comments: '', result: 'pending' as 'pass' | 'fail' | 'withdrawn' | 'pending' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const semRes = await api.get<{ data: AcademicSemester[] }>('/semesters.php')
    const sem = semRes.data.find(s => s.is_current) || null
    setSemester(sem)

    const studsRes = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
    setStudents(studsRes.data || [])

    const evalsRes = await api.get<{ data: Evaluation[] }>('/evaluations.php?user_id=all')
    setEvaluations(evalsRes.data || [])
    setLoading(false)
  }

  const evalByStudent = (studentId: string) => evaluations.filter(e => e.user_id === studentId)

  const handleSubmit = async () => {
    if (!evalModal || !semester) return
    setSubmitting(true)

    const existing = evaluations.find(e => e.user_id === evalModal.id && e.practicum_level === evalModal.academic_year_level)

    try {
      if (existing) {
        await api.put(`/evaluations.php?id=${existing.id}`, {
          score: parseFloat(form.score) || 0,
          comments: form.comments || null,
          result: form.result,
        })
      } else {
        await api.post('/evaluations.php', {
          user_id: evalModal.id,
          semester_id: semester.id,
          practicum_level: evalModal.academic_year_level,
          score: parseFloat(form.score) || 0,
          comments: form.comments || null,
          result: form.result,
        })
      }
    } catch (err) {
      alert('error: ' + (err as Error).message)
      setSubmitting(false)
      return
    }

    setEvalModal(null)
    setForm({ score: '', comments: '', result: 'pending' })
    setSubmitting(false)
    fetchData()
  }

  const resultLabels: Record<string, string> = { pass: 'ผ่าน', fail: 'ไม่ผ่าน', withdrawn: 'ยุติ', pending: 'รอประเมิน' }
  const resultBadges: Record<string, string> = { pass: 'badge-approved', fail: 'badge-rejected', withdrawn: 'badge-pending', pending: 'bg-gray-100 text-gray-600' }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ประเมินผลนักศึกษา</h1>
        <p className="text-sm text-gray-500 mt-1">ประเมินสมรรถนะและตัดสินผลการฝึกปฏิบัติ</p>
      </div>

      {students.length === 0 ? (
        <div className="card text-center py-12 text-gray-500"><p>ยังไม่มีนักศึกษาในระบบ</p></div>
      ) : (
        <div className="space-y-3">
          {students.map(s => {
            const evals = evalByStudent(s.id)
            const latestEval = evals[0]
            return (
              <div key={s.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {s.profile_image_url ? (
                      <img src={s.profile_image_url} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                        {s.first_name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{s.prefix_name} {s.first_name} {s.last_name}</h3>
                      <p className="text-sm text-gray-500">{s.major} - ปี {s.academic_year_level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {latestEval ? (
                      <div className="text-right">
                        <span className={`badge ${resultBadges[latestEval.result]}`}>{resultLabels[latestEval.result]}</span>
                        <p className="text-xs text-gray-500 mt-1">คะแนน: {latestEval.score}</p>
                      </div>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500">ยังไม่ประเมิน</span>
                    )}
                    <button onClick={() => {
                      setEvalModal(s)
                      setForm({
                        score: latestEval?.score?.toString() || '',
                        comments: latestEval?.comments || '',
                        result: latestEval?.result || 'pending',
                      })
                    }} className="btn-primary text-sm whitespace-nowrap">ประเมิน</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {evalModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setEvalModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">ประเมินผล: {evalModal.first_name} {evalModal.last_name}</h2>
            <p className="text-sm text-gray-500 mb-4">ฝึกปฏิบัติวิชาชีพ {evalModal.academic_year_level}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">คะแนน (0-100)</label>
                <input type="number" min="0" max="100" step="0.01" value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} className="input-field" placeholder="เช่น 85" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ผลการตัดสิน</label>
                <select value={form.result} onChange={e => setForm({ ...form, result: e.target.value as 'pass' | 'fail' | 'withdrawn' | 'pending' })} className="input-field">
                  <option value="pending">รอประเมิน</option>
                  <option value="pass">ผ่าน</option>
                  <option value="fail">ไม่ผ่าน</option>
                  <option value="withdrawn">ยุติการฝึกปฏิบัติ</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ความคิดเห็น</label>
                <textarea value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} rows={4} className="input-field" placeholder="ข้อเสนอแนะ..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? 'กำลังบันทึก...' : 'บันทึกการประเมิน'}
              </button>
              <button onClick={() => setEvalModal(null)} className="btn-secondary">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
