import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface AuditLog {
  id: string
  action: string
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
  actor_name?: string
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await api.get<{ data: AuditLog[] }>('/audit_logs.php')
      const data = res.data || []
      if (data.length === 0) { setLogs([]); setLoading(false); return }

      const actorIds = [...new Set(data.map(l => l.actor_id).filter(Boolean))] as string[]
      let actorMap = new Map<string, string>()
      if (actorIds.length > 0) {
        const usersRes = await api.get<{ data: { id: string; first_name: string | null; last_name: string | null }[] }>('/users.php')
        usersRes.data.forEach(a => actorMap.set(a.id, `${a.first_name || ''} ${a.last_name || ''}`.trim()))
      }

      setLogs(data.map(l => ({ ...l, actor_name: l.actor_id ? actorMap.get(l.actor_id) || 'ไม่ทราบ' : 'ระบบ' })))
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const filtered = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.action?.toLowerCase().includes(q) || l.actor_name?.toLowerCase().includes(q)
  })

  const actionLabels: Record<string, string> = {
    approve_user: 'อนุมัติผู้ใช้',
    reject_user: 'ปฏิเสธผู้ใช้',
    login: 'เข้าสู่ระบบ',
    logout: 'ออกจากระบบ',
    update_profile: 'แก้ไขโปรไฟล์',
    create_activity: 'สร้างบันทึกกิจกรรม',
    approve_activity: 'อนุมัติบันทึกกิจกรรม',
    reject_activity: 'ปฏิเสธบันทึกกิจกรรม',
    create_evaluation: 'สร้างการประเมิน',
    update_user: 'แก้ไขผู้ใช้',
    delete_user: 'ลบผู้ใช้',
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">บันทึกระบบ</h1>
        <p className="text-sm text-gray-500 mt-1">ประวัติการดำเนินการในระบบ ({filtered.length} รายการ)</p>
      </div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." className="input-field max-w-xs" />

      <div className="card overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-8">ไม่มีบันทึก</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                <th className="py-3 px-2">เวลา</th>
                <th className="py-3 px-2">ผู้ดำเนินการ</th>
                <th className="py-3 px-2">การกระทำ</th>
                <th className="py-3 px-2">ประเภทเป้าหมาย</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-gray-100 text-sm">
                  <td className="py-3 px-2 text-gray-600 whitespace-nowrap">{new Date(l.created_at).toLocaleString('th-TH')}</td>
                  <td className="py-3 px-2 text-gray-700 font-medium">{l.actor_name}</td>
                  <td className="py-3 px-2 text-gray-600">{actionLabels[l.action] || l.action}</td>
                  <td className="py-3 px-2 text-gray-400">{l.target_type || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
