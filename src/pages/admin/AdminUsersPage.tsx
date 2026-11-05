import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UserProfile } from '../../types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'instructor' | 'mentor' | 'supervisor' | 'head' | 'student'>('all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await api.get<{ data: UserProfile[] }>('/users.php')
    setUsers(res.data || [])
    setLoading(false)
  }

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await api.put(`/users.php?id=${id}`, { status })
    } catch (err) {
      alert('error: ' + (err as Error).message)
      return
    }
    fetchUsers()
  }

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return u.email?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.nickname?.toLowerCase().includes(q)
    }
    return true
  })

  const roleLabels: Record<string, string> = { admin: 'แอดมิน', instructor: 'อาจารย์ผู้สอน', mentor: 'อาจารย์พี่เลี้ยง', supervisor: 'อาจารย์นิเทศ', head: 'อาจารย์หัวหน้าสาขา', student: 'นักศึกษา' }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>
        <p className="text-sm text-gray-500 mt-1">ผู้ใช้ทั้งหมดในระบบ ({filtered.length} คน)</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล..." className="input-field max-w-xs" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as 'all' | 'admin' | 'instructor' | 'mentor' | 'supervisor' | 'head' | 'student')} className="input-field max-w-xs">
          <option value="all">ทุกบทบาท</option>
          <option value="admin">แอดมิน</option>
          <option value="instructor">อาจารย์ผู้สอน</option>
          <option value="mentor">อาจารย์พี่เลี้ยง</option>
          <option value="supervisor">อาจารย์นิเทศ</option>
          <option value="head">อาจารย์หัวหน้าสาขา</option>
          <option value="student">นักศึกษา</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
              <th className="py-3 px-2">ชื่อ</th>
              <th className="py-3 px-2">อีเมล</th>
              <th className="py-3 px-2">บทบาท</th>
              <th className="py-3 px-2">สถานะ</th>
              <th className="py-3 px-2">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-gray-100 text-sm">
                <td className="py-3 px-2 text-gray-700 font-medium">
                  {u.prefix_name} {u.first_name} {u.last_name}
                  {u.role === 'student' && <span className="text-xs text-gray-400 block">ปี {u.academic_year_level} - {u.major}</span>}
                </td>
                <td className="py-3 px-2 text-gray-600">{u.email}</td>
                <td className="py-3 px-2"><span className="badge bg-primary-100 text-primary-700">{roleLabels[u.role]}</span></td>
                <td className="py-3 px-2">
                  <span className={`badge ${u.status === 'approved' ? 'badge-approved' : u.status === 'pending' ? 'badge-pending' : 'badge-rejected'}`}>
                    {u.status === 'approved' ? 'อนุมัติ' : u.status === 'pending' ? 'รอตรวจ' : 'ปฏิเสธ'}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <select
                    value={u.status}
                    onChange={e => handleStatusChange(u.id, e.target.value as 'approved' | 'rejected' | 'pending')}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-300"
                  >
                    <option value="approved">อนุมัติ</option>
                    <option value="pending">รอตรวจ</option>
                    <option value="rejected">ปฏิเสธ</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
