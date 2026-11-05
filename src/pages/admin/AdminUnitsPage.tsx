import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UniversityUnit } from '../../types'

export default function AdminUnitsPage() {
  const [units, setUnits] = useState<UniversityUnit[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', location: '' })

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    const res = await api.get<{ data: UniversityUnit[] }>('/units.php')
    setUnits(res.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/units.php?id=${editingId}`, {
          name: form.name, description: form.description || null, location: form.location || null,
        })
      } else {
        await api.post('/units.php', {
          name: form.name, description: form.description || null, location: form.location || null,
        })
      }
    } catch (err) {
      alert('error: ' + (err as Error).message)
      return
    }
    setShowForm(false); setEditingId(null); setForm({ name: '', description: '', location: '' })
    fetchUnits()
  }

  const handleEdit = (u: UniversityUnit) => {
    setEditingId(u.id)
    setForm({ name: u.name, description: u.description || '', location: u.location || '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบหน่วยงานนี้ใช่ไหม?')) return
    await api.delete(`/units.php?id=${id}`)
    fetchUnits()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">หน่วยงาน/ตึกฝึกปฏิบัติ</h1>
          <p className="text-sm text-gray-500 mt-1">หน่วยงานภายในมหาวิทยาลัยสำหรับฝึกปฏิบัติ</p>
        </div>
        {!showForm && <button onClick={() => { setEditingId(null); setForm({ name: '', description: '', location: '' }); setShowForm(true) }} className="btn-primary">+ เพิ่มหน่วยงาน</button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 animate-scale-in">
          <h2 className="text-lg font-semibold text-gray-700">{editingId ? 'แก้ไข' : 'เพิ่ม'}หน่วยงาน</h2>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อหน่วยงาน</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">คำอธิบาย</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">สถานที่</label><input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input-field" /></div>
          <div className="flex gap-3"><button type="submit" className="btn-primary">{editingId ? 'บันทึก' : 'เพิ่ม'}</button><button type="button" onClick={() => { setShowForm(false); setEditingId(null) }} className="btn-secondary">ยกเลิก</button></div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {units.map(u => (
          <div key={u.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div><h3 className="font-semibold text-gray-800">{u.name}</h3>{u.description && <p className="text-sm text-gray-500 mt-1">{u.description}</p>}{u.location && <p className="text-xs text-gray-400 mt-2">สถานที่: {u.location}</p>}</div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(u)} className="text-secondary-600 hover:text-secondary-700 text-sm">แก้ไข</button>
                <button onClick={() => handleDelete(u.id)} className="text-error-600 hover:text-error-700 text-sm">ลบ</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
