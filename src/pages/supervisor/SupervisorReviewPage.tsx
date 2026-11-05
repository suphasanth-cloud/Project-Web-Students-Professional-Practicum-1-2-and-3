import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { ActivityLog, UserProfile, LessonPlan, Evaluation } from '../../types'

export default function SupervisorReviewPage() {
  const [tab, setTab] = useState<'activities' | 'lesson_plans' | 'evaluations'>('activities')
  const [activities, setActivities] = useState<(ActivityLog & { student: UserProfile })[]>([])
  const [lessonPlans, setLessonPlans] = useState<(LessonPlan & { student: UserProfile })[]>([])
  const [evaluations, setEvaluations] = useState<(Evaluation & { student: UserProfile })[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackModal, setFeedbackModal] = useState<{ type: 'activity' | 'lesson' | 'eval'; id: string; action: 'approve' | 'reject'; title: string } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (tab === 'activities') fetchActivities()
    else if (tab === 'lesson_plans') fetchLessonPlans()
    else fetchEvaluations()
  }, [tab])

  const fetchStudentMap = async () => {
    const studentsRes = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
    return new Map<string, UserProfile>(studentsRes.data.map(s => [s.id, s]))
  }

  const fetchActivities = async () => {
    setLoading(true)
    const actsRes = await api.get<{ data: ActivityLog[] }>('/activities.php?user_id=all')
    const acts = actsRes.data || []
    if (acts.length === 0) { setActivities([]); setLoading(false); return }
    const studentMap = await fetchStudentMap()
    setActivities(acts.map(a => ({ ...a, student: studentMap.get(a.user_id) as UserProfile })).filter(a => a.student))
    setLoading(false)
  }

  const fetchLessonPlans = async () => {
    setLoading(true)
    const plansRes = await api.get<{ data: LessonPlan[] }>('/lesson_plans.php?user_id=all')
    const plans = plansRes.data || []
    if (plans.length === 0) { setLessonPlans([]); setLoading(false); return }
    const studentMap = await fetchStudentMap()
    setLessonPlans(plans.map(p => ({ ...p, student: studentMap.get(p.user_id) as UserProfile })).filter(p => p.student))
    setLoading(false)
  }

  const fetchEvaluations = async () => {
    setLoading(true)
    const evalsRes = await api.get<{ data: Evaluation[] }>('/evaluations.php?user_id=all')
    const evals = evalsRes.data || []
    if (evals.length === 0) { setEvaluations([]); setLoading(false); return }
    const studentMap = await fetchStudentMap()
    setEvaluations(evals.map(e => ({ ...e, student: studentMap.get(e.user_id) as UserProfile })).filter(e => e.student))
    setLoading(false)
  }

  const handleReview = async () => {
    if (!feedbackModal) return
    setSubmitting(true)
    const status = feedbackModal.action === 'approve' ? 'approved' : 'rejected'

    try {
      if (feedbackModal.type === 'lesson') {
        await api.put(`/lesson_plans.php?id=${feedbackModal.id}`, {
          instructor_approval_status: status,
          instructor_feedback: feedbackText || null,
        })
      } else if (feedbackModal.type === 'activity') {
        await api.put(`/activities.php?id=${feedbackModal.id}`, {
          mentor_approval_status: status,
          mentor_feedback: feedbackText || null,
        })
      }
    } catch (err) {
      alert('error: ' + (err as Error).message)
      setSubmitting(false)
      return
    }

    setFeedbackModal(null)
    setFeedbackText('')
    setSubmitting(false)
    if (feedbackModal.type === 'activity') fetchActivities()
    else if (feedbackModal.type === 'lesson') fetchLessonPlans()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ตรวจสอบข้อมูลนักศึกษา</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบบันทึกกิจกรรม แผนการสอน และผลการประเมิน</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTab('activities')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'activities' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          บันทึกกิจกรรม
        </button>
        <button onClick={() => setTab('lesson_plans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'lesson_plans' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          แผนการสอน
        </button>
        <button onClick={() => setTab('evaluations')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'evaluations' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          ผลการประเมิน
        </button>
      </div>

      {tab === 'activities' && (
        activities.length === 0 ? (
          <div className="card text-center py-12 text-gray-500"><p>ไม่มีบันทึกกิจกรรม</p></div>
        ) : (
          <div className="space-y-3">
            {activities.map(a => (
              <div key={a.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {a.student?.first_name} {a.student?.last_name} (ปี {a.student?.academic_year_level})
                      </span>
                      <span className={`badge ${a.mentor_approval_status === 'approved' ? 'badge-approved' : a.mentor_approval_status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                        {a.mentor_approval_status === 'approved' ? 'อนุมัติแล้ว' : a.mentor_approval_status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจ'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mt-1">{a.title}</h3>
                    <p className="text-xs text-gray-400">{a.activity_date}</p>
                    <p className="text-sm text-gray-600 mt-2">{a.description}</p>
                    {a.mentor_feedback && <div className="mt-2 bg-gray-50 rounded p-2 text-xs text-gray-600">อาจารย์พี่เลี้ยง: {a.mentor_feedback}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'lesson_plans' && (
        lessonPlans.length === 0 ? (
          <div className="card text-center py-12 text-gray-500"><p>ไม่มีแผนการสอน</p></div>
        ) : (
          <div className="space-y-3">
            {lessonPlans.map(p => (
              <div key={p.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {p.student?.first_name} {p.student?.last_name} (ปี {p.student?.academic_year_level})
                      </span>
                      <span className={`badge ${p.instructor_approval_status === 'approved' ? 'badge-approved' : p.instructor_approval_status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`}>
                        {p.instructor_approval_status === 'approved' ? 'อนุมัติแล้ว' : p.instructor_approval_status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจ'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mt-1">{p.subject_name}: {p.topic}</h3>
                    <a href={p.plan_url} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary-600 hover:underline mt-2 inline-block">เปิดดูแผนการสอน</a>
                    {p.instructor_feedback && <div className="mt-2 bg-primary-50 rounded p-2 text-xs text-primary-700">ความคิดเห็น: {p.instructor_feedback}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'evaluations' && (
        evaluations.length === 0 ? (
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
                    </div>
                    <h3 className="font-semibold text-gray-800 mt-1">คะแนน: {e.score}</h3>
                    <p className="text-xs text-gray-400">ประเมินเมื่อ: {e.evaluated_at}</p>
                    {e.comments && <p className="text-sm text-gray-600 mt-2">{e.comments}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {feedbackModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setFeedbackModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {feedbackModal.action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}: {feedbackModal.title}
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ข้อเสนอแนะ</label>
              <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={4} className="input-field" placeholder="พิมพ์ข้อเสนอแนะ..." />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleReview} disabled={submitting}
                className={`btn-primary ${feedbackModal.action === 'reject' ? '!bg-error-500 hover:!bg-error-600' : ''}`}>
                {submitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </button>
              <button onClick={() => setFeedbackModal(null)} className="btn-secondary">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
