import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Subject {
  id: string
  subject_code: string
  subject_name: string
  credits: number
  practicum_level: number
  description: string | null
}

interface CourseSection {
  id: string
  subject_id: string
  section_name: string
  semester_id: string | null
  instructor_id: string | null
  subject_code?: string
  subject_name?: string
  practicum_level?: number
  credits?: number
  instructor_prefix?: string
  instructor_first?: string
  instructor_last?: string
  year?: number
  semester?: number
}

export default function AdminSubjectsPage() {
  const [tab, setTab] = useState<'subjects' | 'sections'>('subjects')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sections, setSections] = useState<CourseSection[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ type: 'subject' | 'section'; item?: Subject | CourseSection } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // form state
  const [subjectCode, setSubjectCode] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [credits, setCredits] = useState(3)
  const [practicumLevel, setPracticumLevel] = useState(1)
  const [description, setDescription] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [sectionSubjectId, setSectionSubjectId] = useState('')
  const [sectionSemesterId, setSectionSemesterId] = useState('')
  const [sectionInstructorId, setSectionInstructorId] = useState('')

  const [instructors, setInstructors] = useState<{ id: string; prefix_name: string | null; first_name: string | null; last_name: string | null }[]>([])

  useEffect(() => {
    fetchSubjects()
    fetchSections()
    fetchInstructors()
  }, [])

  const fetchSubjects = async () => {
    const res = await api.get<{ data: Subject[] }>('/subjects.php')
    setSubjects(res.data || [])
    setLoading(false)
  }

  const fetchSections = async () => {
    const res = await api.get<{ data: CourseSection[] }>('/subjects.php?sections=1')
    setSections(res.data || [])
  }

  const fetchInstructors = async () => {
    const res = await api.get<{ data: { id: string; prefix_name: string | null; first_name: string | null; last_name: string | null }[] }>('/users.php?role=instructor&status=approved')
    setInstructors(res.data || [])
  }

  const resetForm = () => {
    setSubjectCode('')
    setSubjectName('')
    setCredits(3)
    setPracticumLevel(1)
    setDescription('')
    setSectionName('')
    setSectionSubjectId('')
    setSectionSemesterId('')
    setSectionInstructorId('')
  }

  const handleSubmit = async () => {
    if (!modal) return
    setSubmitting(true)
    try {
      if (modal.type === 'subject') {
        if (modal.item) {
          await api.put(`/subjects.php?id=${modal.item.id}`, {
            subject_code: subjectCode,
            subject_name: subjectName,
            credits,
            practicum_level: practicumLevel,
            description: description || null,
          })
        } else {
          await api.post('/subjects.php', {
            subject_code: subjectCode,
            subject_name: subjectName,
            credits,
            practicum_level: practicumLevel,
            description: description || null,
          })
        }
      } else {
        if (modal.item) {
          await api.put(`/subjects.php?id=${modal.item.id}`, {
            type: 'section',
            section_name: sectionName,
            semester_id: sectionSemesterId || null,
            instructor_id: sectionInstructorId || null,
          })
        } else {
          await api.post('/subjects.php', {
            type: 'section',
            subject_id: sectionSubjectId,
            section_name: sectionName,
            semester_id: sectionSemesterId || null,
            instructor_id: sectionInstructorId || null,
          })
        }
      }
    } catch (err) {
      alert('error: ' + (err as Error).message)
      setSubmitting(false)
      return
    }
    setModal(null)
    resetForm()
    setSubmitting(false)
    fetchSubjects()
    fetchSections()
  }

  const handleDelete = async (id: string, type: 'subject' | 'section') => {
    if (!confirm('ต้องการลบใช่หรือไม่?')) return
    try {
      await api.delete(`/subjects.php?id=${id}&type=${type}`)
      fetchSubjects()
      fetchSections()
    } catch (err) {
      alert('error: ' + (err as Error).message)
    }
  }

  const openEdit = (item: Subject | CourseSection, type: 'subject' | 'section') => {
    if (type === 'subject') {
      const s = item as Subject
      setSubjectCode(s.subject_code)
      setSubjectName(s.subject_name)
      setCredits(s.credits)
      setPracticumLevel(s.practicum_level)
      setDescription(s.description || '')
    } else {
      const sec = item as CourseSection
      setSectionName(sec.section_name)
      setSectionSubjectId(sec.subject_id)
      setSectionSemesterId(sec.semester_id || '')
      setSectionInstructorId(sec.instructor_id || '')
    }
    setModal({ type, item })
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">รายวิชาและกลุ่มเรียน</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการรายวิชาและกลุ่มเรียนฝึกปฏิบัติวิชาชีพ</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('subjects')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'subjects' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          รายวิชา
        </button>
        <button onClick={() => setTab('sections')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'sections' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
          กลุ่มเรียน
        </button>
      </div>

      {tab === 'subjects' ? (
        <>
          <button onClick={() => { resetForm(); setModal({ type: 'subject' }) }} className="btn-primary">เพิ่มรายวิชา</button>
          {subjects.length === 0 ? (
            <div className="card text-center py-12 text-gray-500"><p>ยังไม่มีรายวิชา</p></div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-3 px-4">รหัสวิชา</th>
                    <th className="text-left py-3 px-4">ชื่อวิชา</th>
                    <th className="text-left py-3 px-4">หน่วยกิต</th>
                    <th className="text-left py-3 px-4">ฝึกปฏิบัติ</th>
                    <th className="text-right py-3 px-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-700">{s.subject_code}</td>
                      <td className="py-3 px-4">{s.subject_name}</td>
                      <td className="py-3 px-4">{s.credits}</td>
                      <td className="py-3 px-4">ปี {s.practicum_level}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => openEdit(s, 'subject')} className="text-primary-600 hover:underline mr-3">แก้ไข</button>
                        <button onClick={() => handleDelete(s.id, 'subject')} className="text-error-600 hover:underline">ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <button onClick={() => { resetForm(); setModal({ type: 'section' }) }} className="btn-primary">เพิ่มกลุ่มเรียน</button>
          {sections.length === 0 ? (
            <div className="card text-center py-12 text-gray-500"><p>ยังไม่มีกลุ่มเรียน</p></div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-3 px-4">รหัสวิชา</th>
                    <th className="text-left py-3 px-4">ชื่อวิชา</th>
                    <th className="text-left py-3 px-4">กลุ่ม</th>
                    <th className="text-left py-3 px-4">อาจารย์ผู้สอน</th>
                    <th className="text-right py-3 px-4">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-700">{s.subject_code}</td>
                      <td className="py-3 px-4">{s.subject_name}</td>
                      <td className="py-3 px-4">{s.section_name}</td>
                      <td className="py-3 px-4">{s.instructor_prefix} {s.instructor_first} {s.instructor_last}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => openEdit(s, 'section')} className="text-primary-600 hover:underline mr-3">แก้ไข</button>
                        <button onClick={() => handleDelete(s.id, 'section')} className="text-error-600 hover:underline">ลบ</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4" onClick={() => { setModal(null); resetForm() }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {modal.item ? 'แก้ไข' : 'เพิ่ม'}{modal.type === 'subject' ? 'รายวิชา' : 'กลุ่มเรียน'}
            </h2>
            {modal.type === 'subject' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสวิชา</label>
                  <input value={subjectCode} onChange={e => setSubjectCode(e.target.value)} className="input-field" placeholder="เช่น 0101231" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อวิชา</label>
                  <input value={subjectName} onChange={e => setSubjectName(e.target.value)} className="input-field" placeholder="เช่น ฝึกปฏิบัติวิชาชีพ 1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">หน่วยกิต</label>
                    <input type="number" min="1" max="6" value={credits} onChange={e => setCredits(parseInt(e.target.value) || 3)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ฝึกปฏิบัติปี</label>
                    <select value={practicumLevel} onChange={e => setPracticumLevel(parseInt(e.target.value))} className="input-field">
                      <option value={1}>ปี 1</option>
                      <option value={2}>ปี 2</option>
                      <option value={3}>ปี 3</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">รายละเอียด</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input-field" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!modal.item && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">รายวิชา</label>
                    <select value={sectionSubjectId} onChange={e => setSectionSubjectId(e.target.value)} className="input-field">
                      <option value="">เลือกรายวิชา...</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อกลุ่มเรียน</label>
                  <input value={sectionName} onChange={e => setSectionName(e.target.value)} className="input-field" placeholder="เช่น กลุ่ม 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">อาจารย์ผู้สอน</label>
                  <select value={sectionInstructorId} onChange={e => setSectionInstructorId(e.target.value)} className="input-field">
                    <option value="">เลือกอาจารย์...</option>
                    {instructors.map(i => (
                      <option key={i.id} value={i.id}>{i.prefix_name} {i.first_name} {i.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button onClick={() => { setModal(null); resetForm() }} className="btn-secondary">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
