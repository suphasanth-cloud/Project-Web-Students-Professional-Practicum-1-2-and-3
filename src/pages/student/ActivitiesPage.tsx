import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { ActivityLog, AcademicSemester, AcademicYearLevel } from '../../types'
import { getPracticumInfo } from '../../lib/practicum'
import PracticumLevelBanner from '../../components/PracticumLevelBanner'
import FileUpload from '../../components/FileUpload'

export default function ActivitiesPage() {
  const { profile } = useAuth()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [semester, setSemester] = useState<AcademicSemester | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState<'all' | number>('all')

  const [form, setForm] = useState({
    activity_date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    reflection: '',
    attachment_url: '',
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

      const res = await api.get<{ data: ActivityLog[] }>(
        `/activities.php?user_id=${profile.id}`
      )
      setActivities(res.data || [])
    } catch {
      // fetch error
    } finally {
      setLoading(false)
    }
  }

  const availableLevels = Array.from(new Set(activities.map((a) => a.practicum_level).filter((l): l is AcademicYearLevel => typeof l === 'number'))).sort((a, b) => a - b)

  const filtered = levelFilter === 'all' ? activities : activities.filter((a) => a.practicum_level === levelFilter)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id || !semester) return

    try {
      if (editingId) {
        await api.put(`/activities.php?id=${editingId}`, {
          activity_date: form.activity_date,
          title: form.title,
          description: form.description,
          reflection: form.reflection || null,
          attachment_url: form.attachment_url || null,
          updated_at: new Date().toISOString(),
        })
      } else {
        await api.post('/activities.php', {
          user_id: profile.id,
          semester_id: semester.id,
          unit_id: profile.selected_unit_id,
          practicum_level: profile.academic_year_level,
          activity_date: form.activity_date,
          title: form.title,
          description: form.description,
          reflection: form.reflection || null,
          attachment_url: form.attachment_url || null,
        })
      }
    } catch (err) {
      alert('error: ' + (err as Error).message)
      return
    }

    setShowForm(false)
    setEditingId(null)
    setForm({ activity_date: new Date().toISOString().split('T')[0], title: '', description: '', reflection: '', attachment_url: '' })
    fetchData()
  }

  const handleEdit = (a: ActivityLog) => {
    if (a.mentor_approval_status !== 'pending') {
      alert('ไม่สามารถแก้ไขได้ เนื่องจากอาจารย์พี่เลี้ยงได้ตรวจสอบแล้ว')
      return
    }
    setEditingId(a.id)
    setForm({
      activity_date: a.activity_date,
      title: a.title,
      description: a.description,
      reflection: a.reflection || '',
      attachment_url: a.attachment_url || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบบันทึกนี้ใช่ไหม?')) return
    await api.delete(`/activities.php?id=${id}`)
    fetchData()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">บันทึกกิจกรรม</h1>
          <p className="text-sm text-gray-500 mt-1">
            {profile?.academic_year_level === 1 && 'ฝึกปฏิบัติ 1: เรียนรู้งานครู, E-PLC'}
            {profile?.academic_year_level === 2 && 'ฝึกปฏิบัติ 2: สังเกตการสอน, พฤติกรรมผู้เรียน, โมเดล 4+6'}
            {profile?.academic_year_level === 3 && 'ฝึกปฏิบัติ 3: ผู้ช่วยสอน, แผนการสอน, เทคโนโลยีดิจิทัล'}
          </p>
        </div>
        {!showForm && (
          <button onClick={() => { setEditingId(null); setForm({ activity_date: new Date().toISOString().split('T')[0], title: '', description: '', reflection: '', attachment_url: '' }); setShowForm(true) }} className="btn-primary">
            + บันทึกใหม่
          </button>
        )}
      </div>

      {availableLevels.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">ระดับชั้น:</span>
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1 rounded-full text-sm transition ${levelFilter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            ทั้งหมด
          </button>
          {availableLevels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-3 py-1 rounded-full text-sm transition ${levelFilter === lvl ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              ฝึก {lvl}
            </button>
          ))}
        </div>
      )}

      {getPracticumInfo(profile?.academic_year_level) && (
        <PracticumLevelBanner info={getPracticumInfo(profile?.academic_year_level)!} />
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 animate-scale-in">
          <h2 className="text-lg font-semibold text-gray-700">{editingId ? 'แก้ไขบันทึก' : 'บันทึกกิจกรรมใหม่'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่</label>
              <input type="date" value={form.activity_date} onChange={(e) => setForm({ ...form, activity_date: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">หัวข้อ</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="หัวข้อกิจกรรม" className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">รายละเอียด</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={4} placeholder="อธิบายสิ่งที่ทำในวันนี้" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">การสะท้อนคิด (Reflection)</label>
            <textarea value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} rows={3} placeholder="สิ่งที่ได้เรียนรู้ ปัญหาที่พบ และการปรับปรุง" className="input-field" />
          </div>
          <FileUpload
            kind="activity"
            value={form.attachment_url}
            onChange={(url) => setForm({ ...form, attachment_url: url })}
            label="รูปภาพกิจกรรม"
          />
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary">{editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary">ยกเลิก</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <p>ยังไม่มีบันทึกกิจกรรม กด "+ บันทึกใหม่" เพื่อเริ่มบันทึก</p>
          </div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {typeof a.practicum_level === 'number' && (
                      <span className="badge bg-gray-100 text-gray-500">ฝึก {a.practicum_level}</span>
                    )}
                    <h3 className="font-semibold text-gray-800">{a.title}</h3>
                    <span className={`badge ${
                      a.mentor_approval_status === 'approved' ? 'badge-approved' :
                      a.mentor_approval_status === 'rejected' ? 'badge-rejected' : 'badge-pending'
                    }`}>
                      {a.mentor_approval_status === 'approved' ? 'อนุมัติแล้ว' :
                       a.mentor_approval_status === 'rejected' ? 'ถูกปฏิเสธ' : 'รอตรวจสอบ'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{a.activity_date}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{a.description}</p>
                  {a.reflection && (
                    <p className="text-sm text-gray-500 mt-2 italic line-clamp-2"> reflection: {a.reflection}</p>
                  )}
                  {a.mentor_feedback && (
                    <div className="mt-3 bg-primary-50 rounded-lg p-3 text-sm">
                      <p className="font-medium text-primary-700">ความคิดเห็นอาจารย์พี่เลี้ยง:</p>
                      <p className="text-primary-600">{a.mentor_feedback}</p>
                    </div>
                  )}
                  {a.attachment_url && (
                    <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                      <img src={a.attachment_url} alt="attachment" className="max-h-48 rounded-lg border border-gray-200 object-cover" />
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {a.mentor_approval_status === 'pending' && (
                    <>
                      <button onClick={() => handleEdit(a)} className="text-secondary-600 hover:text-secondary-700 text-sm">แก้ไข</button>
                      <button onClick={() => handleDelete(a.id)} className="text-error-600 hover:text-error-700 text-sm">ลบ</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
