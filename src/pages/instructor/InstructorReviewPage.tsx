import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { ActivityLog, UserProfile, LessonPlan } from '../../types'

export default function InstructorReviewPage() {
  const [tab, setTab] = useState<'activities' | 'lesson_plans'>('activities')
  const [activities, setActivities] = useState<(ActivityLog & { student: UserProfile })[]>([])
  const [lessonPlans, setLessonPlans] = useState<(LessonPlan & { student: UserProfile })[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackModal, setFeedbackModal] = useState<{ type: 'activity' | 'lesson'; id: string; action: 'approve' | 'reject'; title: string } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (tab === 'activities') fetchActivities()
    else fetchLessonPlans()
  }, [tab])

  const fetchActivities = async () => {
    setLoading(true)
    const actsRes = await api.get<{ data: ActivityLog[] }>('/activities.php?user_id=all')
    const acts = actsRes.data || []
    if (acts.length === 0) { setActivities([]); setLoading(false); return }

    const userIds = [...new Set(acts.map(a => a.user_id))]
    const studentsRes = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
    const studentMap = new Map<string, UserProfile>()
    studentsRes.data.forEach(s => studentMap.set(s.id, s))

    setActivities(acts.map(a => ({ ...a, student: studentMap.get(a.user_id) as UserProfile })).filter(a => a.student))
    setLoading(false)
  }

  const fetchLessonPlans = async () => {
    setLoading(true)
    const plansRes = await api.get<{ data: LessonPlan[] }>('/lesson_plans.php?user_id=all')
    const plans = plansRes.data || []
    if (plans.length === 0) { setLessonPlans([]); setLoading(false); return }

    const studentsRes = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
    const studentMap = new Map<string, UserProfile>()
    studentsRes.data.forEach(s => studentMap.set(s.id, s))

    setLessonPlans(plans.map(p => ({ ...p, student: studentMap.get(p.user_id) as UserProfile })).filter(p => p.student))
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
      } else {
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
    else fetchLessonPlans()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ตรวจสอบงานนักศึกษา</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบบันทึกกิจกรรมและแผนการสอน</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('activities')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'activities' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          บันทึกกิจกรรม
        </button>
        <button onClick={() => setTab('lesson_plans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'lesson_plans' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          แผนการสอน
        </button>
      </div>

      {tab === 'activities' ? (
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
                        {a.mentor_approval_status === 'approved' ? 'อาจารย์พี่เลี้ยงอนุมัติ' : a.mentor_approval_status === 'rejected' ? 'อาจารย์พี่เลี้ยงปฏิเสธ' : 'รออาจารย์พี่เลี้ยงตรวจ'}
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
      ) : (
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
                    {p.instructor_feedback && <div className="mt-2 bg-primary-50 rounded p-2 text-xs text-primary-700">ความคิดเห็นของคุณ: {p.instructor_feedback}</div>}
                  </div>
                  {p.instructor_approval_status === 'pending' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button onClick={() => { setFeedbackModal({ type: 'lesson', id: p.id, action: 'approve', title: p.subject_name }); setFeedbackText('') }}
                        className="bg-success-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-success-600 transition-colors">อนุมัติ</button>
                      <button onClick={() => { setFeedbackModal({ type: 'lesson', id: p.id, action: 'reject', title: p.subject_name }); setFeedbackText('') }}
                        className="bg-error-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-error-600 transition-colors">ปฏิเสธ</button>
                    </div>
                  )}
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ความคิดเห็น</label>
              <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={4} className="input-field" placeholder="พิมพ์ความคิดเห็น..." />
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
