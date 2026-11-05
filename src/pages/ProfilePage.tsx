import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    prefix_name: profile?.prefix_name || '',
    first_name: profile?.first_name || '',
    last_name: profile?.last_name || '',
    nickname: profile?.nickname || '',
    major: profile?.major || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  })

  if (!profile) return null

  const displayName = [profile.prefix_name, profile.first_name, profile.last_name].filter(Boolean).join(' ')
  const roleLabel = profile.role === 'admin' ? 'ผู้ดูแลระบบ' : profile.role === 'instructor' ? 'อาจารย์ผู้สอน' : profile.role === 'mentor' ? 'อาจารย์พี่เลี้ยง' : profile.role === 'supervisor' ? 'อาจารย์นิเทศ' : profile.role === 'head' ? 'อาจารย์หัวหน้าสาขา' : 'นักศึกษา'

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setMessage({ type: 'error', text: 'อัปโหลดได้เฉพาะไฟล์ JPG, JPEG, PNG เท่านั้น' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = api.token()
      const res = await fetch(`${API_URL}/upload.php`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      await refreshProfile()
      setMessage({ type: 'success', text: 'อัปโหลดรูปโปรไฟล์สำเร็จ' })
    } catch (err) {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการอัปโหลด: ' + (err as Error).message })
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      await api.put('/me.php', {
        prefix_name: form.prefix_name || null,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        nickname: form.nickname || null,
        major: form.major || null,
        phone: form.phone || null,
        address: form.address || null,
      })
      await refreshProfile()
      setMessage({ type: 'success', text: 'บันทึกข้อมูลสำเร็จ' })
      setEditing(false)
    } catch (err) {
      setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ: ' + (err as Error).message })
    }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-5">
          <div className="relative">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white/30" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-4 border-white/30">
                {profile.first_name?.charAt(0) || 'U'}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 bg-white text-primary-600 rounded-full p-2 shadow-lg hover:bg-primary-50 transition-all disabled:opacity-50"
              title="เปลี่ยนรูปโปรไฟล์"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleUploadAvatar} className="hidden" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{displayName || profile.email}</h1>
            <p className="text-primary-100">{roleLabel}</p>
            <p className="text-sm text-primary-200 mt-1">{profile.email}</p>
            <span className={`badge mt-2 ${profile.status === 'approved' ? 'badge-approved' : profile.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>
              {profile.status === 'approved' ? 'อนุมัติแล้ว' : profile.status === 'pending' ? 'รอตรวจสอบ' : 'ถูกปฏิเสธ'}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm animate-fade-in ${
          message.type === 'success' ? 'bg-success-50 border border-success-200 text-success-700' : 'bg-error-50 border border-error-200 text-error-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-700">ข้อมูลส่วนตัว</h2>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm">แก้ไข</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-secondary text-sm">ยกเลิก</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="คำนำหน้า" value={profile.prefix_name} editing={editing}
            editValue={form.prefix_name} onChange={(v) => setForm({ ...form, prefix_name: v })}
            type="select" options={['', 'นาย', 'นางสาว', 'นาง', 'อาจารย์', 'ดร.']} />
          <Field label="ชื่อเล่น" value={profile.nickname} editing={editing}
            editValue={form.nickname} onChange={(v) => setForm({ ...form, nickname: v })} />
          <Field label="ชื่อ" value={profile.first_name} editing={editing}
            editValue={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} />
          <Field label="นามสกุล" value={profile.last_name} editing={editing}
            editValue={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} />
          <Field label="สาขาวิชา" value={profile.major} editing={editing}
            editValue={form.major} onChange={(v) => setForm({ ...form, major: v })} />
          {profile.role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">ชั้นปี</label>
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700">
                ปี {profile.academic_year_level}
              </div>
            </div>
          )}
          <Field label="เบอร์โทรศัพท์" value={profile.phone} editing={editing}
            editValue={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="ที่อยู่" value={profile.address} editing={editing}
            editValue={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, editing, editValue, onChange, type = 'text', options }: {
  label: string
  value: string | null
  editing: boolean
  editValue: string
  onChange: (v: string) => void
  type?: 'text' | 'select'
  options?: string[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      {editing ? (
        type === 'select' ? (
          <select value={editValue} onChange={(e) => onChange(e.target.value)} className="input-field">
            {options?.map(o => <option key={o} value={o}>{o || 'เลือก...'}</option>)}
          </select>
        ) : (
          <input type="text" value={editValue} onChange={(e) => onChange(e.target.value)} className="input-field" />
        )
      ) : (
        <div className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-700">
          {value || '-'}
        </div>
      )}
    </div>
  )
}
