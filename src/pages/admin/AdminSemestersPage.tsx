import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { AcademicSemester } from '../../types'

export default function AdminSemestersPage() {
  const [semesters, setSemesters] = useState<AcademicSemester[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ year: new Date().getFullYear() + 543, semester: 1 as 1 | 2 | 3, start_date: '', end_date: '' })

  useEffect(() => { fetchSemesters() }, [])

  const fetchSemesters = async () => {
    const res = await api.get<{ data: AcademicSemester[] }>('/semesters.php')
    setSemesters(res.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/semesters.php', {
        year: form.year, semester: form.semester, is_current: false,
        start_date: form.start_date || null, end_date: form.end_date || null,
      })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      return
    }
    setShowForm(false); setForm({ year: new Date().getFullYear() + 543, semester: 1, start_date: '', end_date: '' })
    fetchSemesters()
  }

  const setCurrent = async (id: string) => {
    await api.put(`/semesters.php?id=${id}`, { is_current: true })
    fetchSemesters()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบปีการศึกษานี้ใช่ไหม?')) return
    await api.delete(`/semesters.php?id=${id}`)
    fetchSemesters()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">ปีการศึกษา</h1><p className="text-sm text-gray-500 mt-1">จัดการปีการศึกษาและภาคเรียน</p></div>
        {!showForm && <button onClick={() => setShowForm(true)} className="btn-primary">+ เพิ่มปีการศึกษา</button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 animate-scale-in">
          <h2 className="text-lg font-semibold text-gray-700">เพิ่มปีการศึกษา</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">ปีการศึกษา (พ.ศ.)</label><input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} required className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">ภาคเรียน</label><select value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) as 1 | 2 | 3 })} className="input-field"><option value={1}>ภาคเรียนที่ 1</option><option value={2}>ภาคเรียนที่ 2</option><option value={3}>ภาคเรียนที่ 3</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">วันเริ่มต้น</label><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">วันสิ้นสุด</label><input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input-field" /></div>
          </div>
          <div className="flex gap-3"><button type="submit" className="btn-primary">เพิ่ม</button><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">ยกเลิก</button></div>
        </form>
      )}

      <div className="space-y-3">
        {semesters.map(s => (
          <div key={s.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              {s.is_current && <span className="badge bg-success-100 text-success-700">กำลังใช้งาน</span>}
              <div>
                <p className="font-semibold text-gray-800">ปีการศึกษา {s.year} ภาคเรียนที่ {s.semester}</p>
                {s.start_date && s.end_date && <p className="text-xs text-gray-400">{s.start_date} - {s.end_date}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {!s.is_current && <button onClick={() => setCurrent(s.id)} className="text-success-600 hover:text-success-700 text-sm font-medium">ตั้งเป็นปีปัจจุบัน</button>}
              <button onClick={() => handleDelete(s.id)} className="text-error-600 hover:text-error-700 text-sm">ลบ</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
