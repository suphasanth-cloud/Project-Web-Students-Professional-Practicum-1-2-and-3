import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UserProfile } from '../../types'

export default function AdminApprovalsPage() {
  const [pending, setPending] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = async () => {
    const res = await api.get<{ data: UserProfile[] }>('/users.php?status=pending')
    setPending(res.data || [])
    setLoading(false)
  }

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      await api.put(`/users.php?id=${id}`, { status: 'approved' })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      setProcessing(null)
      return
    }
    setProcessing(null)
    fetchPending()
  }

  const handleReject = async (id: string) => {
    if (!confirm('ต้องการปฏิเสธบัญชีนี้ใช่ไหม?')) return
    setProcessing(id)
    try {
      await api.put(`/users.php?id=${id}`, { status: 'rejected' })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      setProcessing(null)
      return
    }
    setProcessing(null)
    fetchPending()
  }

  const roleLabels: Record<string, string> = { admin: 'แอดมิน', instructor: 'อาจารย์ผู้สอน', mentor: 'อาจารย์พี่เลี้ยง', supervisor: 'อาจารย์นิเทศ', head: 'อาจารย์หัวหน้าสาขา', student: 'นักศึกษา' }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">อนุมัติสมาชิก</h1>
        <p className="text-sm text-gray-500 mt-1">ตรวจสอบและอนุมัติบัญชีที่สมัครใหม่ ({pending.length} รายการ)</p>
      </div>

      {pending.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>ไม่มีบัญชีรออนุมัติ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(u => (
            <div key={u.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                    {u.first_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{u.prefix_name} {u.first_name} {u.last_name}</h3>
                    <p className="text-sm text-gray-500 truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="badge bg-primary-100 text-primary-700">{roleLabels[u.role]}</span>
                      {u.role === 'student' && <span className="text-xs text-gray-400">ปี {u.academic_year_level} - {u.major}</span>}
                      {u.phone && <span className="text-xs text-gray-400">{u.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(u.id)} disabled={processing === u.id}
                    className="bg-success-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-success-600 transition-colors disabled:opacity-50">
                    {processing === u.id ? 'กำลัง...' : 'อนุมัติ'}
                  </button>
                  <button onClick={() => handleReject(u.id)} disabled={processing === u.id}
                    className="bg-error-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-error-600 transition-colors disabled:opacity-50">
                    ปฏิเสธ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
