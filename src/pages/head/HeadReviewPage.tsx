import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Evaluation, UserProfile } from '../../types'

export default function HeadReviewPage() {
  const [evaluations, setEvaluations] = useState<(Evaluation & { student: UserProfile })[]>([])
  const [loading, setLoading] = useState(true)
  const [evalModal, setEvalModal] = useState<{ student: UserProfile; eval?: Evaluation } | null>(null)
  const [score, setScore] = useState('')
  const [comments, setComments] = useState('')
  const [result, setResult] = useState<'pass' | 'fail' | 'withdrawn' | 'pending'>('pass')
  const [isFinal, setIsFinal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchEvaluations()
  }, [])

  const fetchEvaluations = async () => {
    setLoading(true)
    const evalsRes = await api.get<{ data: Evaluation[] }>('/evaluations.php?user_id=all')
    const evals = evalsRes.data || []
    if (evals.length === 0) { setEvaluations([]); setLoading(false); return }

    const studentsRes = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
    const studentMap = new Map<string, UserProfile>(studentsRes.data.map(s => [s.id, s]))
    setEvaluations(evals.map(e => ({ ...e, student: studentMap.get(e.user_id) as UserProfile })).filter(e => e.student))
    setLoading(false)
  }

  const handleAddEval = async () => {
    if (!evalModal) return
    setSubmitting(true)
    try {
      if (evalModal.eval) {
        await api.put(`/evaluations.php?id=${evalModal.eval.id}`, {
          score: parseFloat(score) || 0,
          comments: comments || null,
          result,
          is_final: isFinal,
        })
      } else {
        await api.post('/evaluations.php', {
          user_id: evalModal.student.id,
          practicum_level: evalModal.student.academic_year_level || 1,
          score: parseFloat(score) || 0,
          comments: comments || null,
          result,
          is_final: isFinal,
        })
      }
    } catch (err) {
      alert('error: ' + (err as Error).message)
      setSubmitting(false)
      return
    }
    setEvalModal(null)
    setScore('')
    setComments('')
    setResult('pass')
    setIsFinal(false)
    setSubmitting(false)
    fetchEvaluations()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ประเมินผลและยืนยันผลขั้นสุดท้าย</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบและยืนยันผลการประเมินนักศึกษา</p>
      </div>

      {evaluations.length === 0 ? (
        <div className="card text-center py-12 text-gray-500"><p>ไม่มีผลการประเมิน</p></div>
      ) : (
        <div className="space-y-3">
          {evaluations.map(e => (
            <div key={e.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                      {e.student?.first_name} {e.student?.last_name} (ปี {e.student?.academic_year_level})
                    </span>
                    <span className={`badge ${e.result === 'pass' ? 'badge-approved' : e.result === 'fail' ? 'badge-rejected' : 'badge-pending'}`}>
                      {e.result === 'pass' ? 'ผ่าน' : e.result === 'fail' ? 'ไม่ผ่าน' : e.result === 'withdrawn' ? 'ยุติ' : 'รอผล'}
                    </span>
                    {e.is_final == 1 && (
                      <span className="badge bg-success-100 text-success-700">ยืนยันขั้นสุดท้ายแล้ว</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-1">คะแนน: {e.score}</h3>
                  <p className="text-xs text-gray-400">ประเมินเมื่อ: {e.evaluated_at}</p>
                  {e.comments && <p className="text-sm text-gray-600 mt-2">{e.comments}</p>}
                </div>
                <button
                  onClick={() => {
                    setEvalModal({ student: e.student, eval: e })
                    setScore(String(e.score))
                    setComments(e.comments || '')
                    setResult(e.result)
                    setIsFinal(e.is_final == 1)
                  }}
                  className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  แก้ไข/ยืนยัน
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {evalModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setEvalModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ประเมินผล: {evalModal.student.first_name} {evalModal.student.last_name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">คะแนน</label>
                <input type="number" step="0.01" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ผลการประเมิน</label>
                <select value={result} onChange={e => setResult(e.target.value as typeof result)} className="input-field">
                  <option value="pass">ผ่าน</option>
                  <option value="fail">ไม่ผ่าน</option>
                  <option value="withdrawn">ยุติการฝึกปฏิบัติ</option>
                  <option value="pending">รอผล</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ข้อเสนอแนะ</label>
                <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3} className="input-field" placeholder="พิมพ์ข้อเสนอแนะ..." />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isFinal} onChange={e => setIsFinal(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm text-gray-700">ยืนยันผลในขั้นตอนสุดท้าย</span>
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAddEval} disabled={submitting} className="btn-primary">
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button onClick={() => setEvalModal(null)} className="btn-secondary">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
