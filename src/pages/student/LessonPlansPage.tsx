import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { LessonPlan, AcademicSemester } from '../../types'
import { getPracticumInfo } from '../../lib/practicum'
import PracticumLevelBanner from '../../components/PracticumLevelBanner'
import FileUpload from '../../components/FileUpload'

export default function LessonPlansPage() {
  const { profile } = useAuth()
  const [plans, setPlans] = useState<LessonPlan[]>([])
  const [semester, setSemester] = useState<AcademicSemester | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    subject_name: '',
    topic: '',
    plan_url: '',
    plan_type: 'url' as 'url' | 'file',
  })

  useEffect(() => {
    fetchData()
  }, [profile?.id])

  const fetchData = async () => {
    if (!profile?.id) return
    const semRes = await api.get<{ data: AcademicSemester[] }>('/semesters.php')
    const sem = semRes.data.find((s) => s.is_current) || null
    setSemester(sem)

    const res = await api.get<{ data: LessonPlan[] }>(`/lesson_plans.php?user_id=${profile.id}`)
    setPlans(res.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !semester) return
    if (!form.plan_url) {
      alert(form.plan_type === 'file' ? 'กรุณาอัปโหลดไฟล์แผนการสอน' : 'กรุณาใส่ลิงก์ URL')
      return
    }

    try {
      await api.post('/lesson_plans.php', {
        user_id: profile.id,
        semester_id: semester.id,
        practicum_level: profile.academic_year_level,
        subject_name: form.subject_name,
        topic: form.topic,
        plan_url: form.plan_url,
        plan_type: form.plan_type,
      })
    } catch (err) { alert('error: ' + (err as Error).message); return }

    setShowForm(false)
    setForm({ subject_name: '', topic: '', plan_url: '', plan_type: 'url' })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบแผนการสอนนี้ใช่ไหม?')) return
    await api.delete(`/lesson_plans.php?id=${id}`)
    fetchData()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">แผนการสอน</h1>
          <p className="text-sm text-gray-500 mt-1">ส่งแผนการสอนผ่านลิงก์ URL หรือไฟล์แนบ</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">+ ส่งแผนใหม่</button>
        )}
      </div>

      {getPracticumInfo(profile?.academic_year_level) && (
        <PracticumLevelBanner info={getPracticumInfo(profile?.academic_year_level)!} compact />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 animate-scale-in">
          <h2 className="text-lg font-semibold text-gray-700">ส่งแผนการสอนใหม่</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">รายวิชา</label>
              <input type="text" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} required placeholder="ชื่อรายวิชา" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">หัวข้อที่สอน</label>
              <input type="text" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required placeholder="หัวข้อการสอน" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทการส่ง</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, plan_type: 'url' })}
                className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${form.plan_type === 'url' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
                ลิงก์ URL (Google Drive, Canva)
              </button>
              <button type="button" onClick={() => setForm({ ...form, plan_type: 'file' })}
                className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${form.plan_type === 'file' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
                อัปโหลดไฟล์ PDF/Word
              </button>
            </div>
          </div>
          {form.plan_type === 'url' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ลิงก์ URL</label>
              <input type="url" value={form.plan_url} onChange={(e) => setForm({ ...form, plan_url: e.target.value })} required
                placeholder="https://docs.google.com/..."
                className="input-field" />
            </div>
          ) : (
            <FileUpload
              kind="lessonplan"
              value={form.plan_url}
              onChange={(url) => setForm({ ...form, plan_url: url })}
              label="ไฟล์แผนการสอน (PDF/Word)"
            />
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">ส่งแผน</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {plans.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <p>ยังไม่มีแผนการสอน กด "+ ส่งแผนใหม่" เพื่อส่ง</p>
          </div>
        ) : (
          plans.map((p) => (
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{p.subject_name}</h3>
                    <span className={`badge ${
                      p.instructor_approval_status === 'approved' ? 'badge-approved' :
                      p.instructor_approval_status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                    }`}>
                      {p.instructor_approval_status === 'approved' ? 'อนุมัติแล้ว' :
                       p.instructor_approval_status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอตรวจสอบ'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">หัวข้อ: {p.topic}</p>
                  <p className="text-xs text-gray-400 mb-2">
                    {p.plan_type === 'url' ? 'ลิงก์ URL' : 'ไฟล์แนบ'} - {new Date(p.created_at).toLocaleDateString('th-TH')}
                  </p>
                  <a href={p.plan_url} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary-600 hover:underline">
                    เปิดดูแผนการสอน
                  </a>
                  {p.instructor_feedback && (
                    <div className="mt-3 bg-primary-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-primary-700">ความคิดเห็นอาจารย์:</p>
                      <p className="text-primary-600">{p.instructor_feedback}</p>
                    </div>
                  )}
                </div>
                {p.instructor_approval_status === 'pending' && (
                  <button onClick={() => handleDelete(p.id)} className="text-error-600 hover:text-error-700 text-sm">ลบ</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
