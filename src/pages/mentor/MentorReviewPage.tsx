import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { ActivityLog, UserProfile } from '../../types'

export default function MentorReviewPage() {
  const { profile } = useAuth()
  const [activities, setActivities] = useState<(ActivityLog & { student: UserProfile })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [feedbackModal, setFeedbackModal] = useState<{ activity: ActivityLog; action: 'approve' | 'reject' } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchActivities()
  }, [profile?.id, filter])

  const fetchActivities = async () => {
    if (!profile?.id) return
    const { data: students } = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')

    if (!students || students.length === 0) {
      setActivities([])
      setLoading(false)
      return
    }

    const results = await Promise.all(
      students.map(s => api.get<{ data: ActivityLog[] }>(`/activities.php?user_id=${s.id}`))
    )
    let allActivities = results.flatMap(r => r.data || [])

    if (filter !== 'all') {
      allActivities = allActivities.filter(a => a.mentor_approval_status === filter)
    }

    allActivities.sort((a, b) => (b.activity_date || '').localeCompare(a.activity_date || ''))

    const studentMap = new Map<string, UserProfile>()
    students.forEach(p => studentMap.set(p.id, p))

    setActivities(allActivities.map(a => ({ ...a, student: studentMap.get(a.user_id) as UserProfile })))
    setLoading(false)
  }

  const handleReview = async () => {
    if (!feedbackModal) return
    setSubmitting(true)
    const status = feedbackModal.action === 'approve' ? 'approved' : 'rejected'
    try {
      await api.put(`/activities.php?id=${feedbackModal.activity.id}`, {
        mentor_approval_status: status,
        mentor_feedback: feedbackText || null,
      })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      setSubmitting(false)
      return
    }

    setFeedbackModal(null)
    setFeedbackText('')
    setSubmitting(false)
    fetchActivities()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ตรวจสอบบันทึกกิจกรรม</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบและอนุมัติบันทึกของนักศึกษาในความดูแล</p>
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

      {activities.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>ไม่มีบันทึกในหมวดนี้</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map(a => (
            <div key={a.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                      {a.student?.first_name} {a.student?.last_name} (ปี {a.student?.academic_year_level})
                    </span>
                    <span className={`badge ${
                      a.mentor_approval_status === 'approved' ? 'badge-approved' :
                      a.mentor_approval_status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                    }`}>
                      {a.mentor_approval_status === 'approved' ? 'อนุมัติ' :
                       a.mentor_approval_status === 'rejected' ? 'ปฏิเสธ' : 'รอตรวจ'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mt-1">{a.title}</h3>
                  <p className="text-xs text-gray-400">{a.activity_date}</p>
                  <p className="text-sm text-gray-600 mt-2">{a.description}</p>
                  {a.reflection && <p className="text-sm text-gray-500 mt-2 italic">Reflection: {a.reflection}</p>}
                  {a.attachment_url && (
                    <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary-600 hover:underline mt-2 inline-block">ดูไฟล์แนบ</a>
                  )}
                  {a.mentor_feedback && (
                    <div className="mt-3 bg-primary-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-primary-700">ความคิดเห็นของคุณ: {a.mentor_feedback}</p>
                    </div>
                  )}
                </div>
                {a.mentor_approval_status === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button onClick={() => { setFeedbackModal({ activity: a, action: 'approve' }); setFeedbackText('') }}
                      className="bg-success-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-success-600 transition-colors">อนุมัติ</button>
                    <button onClick={() => { setFeedbackModal({ activity: a, action: 'reject' }); setFeedbackText('') }}
                      className="bg-error-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-error-600 transition-colors">ปฏิเสธ</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => setFeedbackModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {feedbackModal.action === 'approve' ? 'อนุมัติบันทึก' : 'ปฏิเสธบันทึก'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">บันทึก: {feedbackModal.activity.title}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ความคิดเห็น/ข้อเสนอแนะ {feedbackModal.action === 'approve' ? '(ไม่บังคับ)' : '(แนะนำให้ระบุเหตุผล)'}
              </label>
              <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} rows={4} className="input-field" placeholder="พิมพ์ความคิดเห็น..." />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleReview} disabled={submitting}
                className={`btn-primary ${feedbackModal.action === 'reject' ? '!bg-error-500 hover:!bg-error-600' : ''}`}>
                {submitting ? 'กำลังบันทึก...' : feedbackModal.action === 'approve' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ'}
              </button>
              <button onClick={() => setFeedbackModal(null)} className="btn-secondary">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
