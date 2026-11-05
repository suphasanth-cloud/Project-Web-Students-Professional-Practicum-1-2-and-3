import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

interface HeadStats {
  students: number
  evaluations: number
  final_evaluations: number
  pending_evaluations: number
}

export default function HeadDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<HeadStats>({ students: 0, evaluations: 0, final_evaluations: 0, pending_evaluations: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await api.get<{ data: Record<string, number> }>('/stats.php')
      setStats({
        students: data?.students || 0,
        evaluations: data?.evaluations || 0,
        final_evaluations: data?.final_evaluations || 0,
        pending_evaluations: data?.pending_evaluations || 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [profile?.id])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">สวัสดี, อาจารย์ {profile?.first_name}!</h1>
        <p className="text-primary-100">อาจารย์หัวหน้าสาขา ระบบฝึกปฏิบัติวิชาชีพ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="นักศึกษาทั้งหมด" value={loading ? '...' : stats.students} color="bg-blue-50 text-blue-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
        />
        <StatCard title="การประเมินทั้งหมด" value={loading ? '...' : stats.evaluations} color="bg-primary-50 text-primary-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
        />
        <StatCard title="ยืนยันผลขั้นสุดท้าย" value={loading ? '...' : stats.final_evaluations} color="bg-success-50 text-success-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard title="รอยืนยันผล" value={loading ? '...' : stats.pending_evaluations} color="bg-warning-50 text-warning-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">บทบาทของคุณ</h2>
        <p className="text-gray-600 text-sm">
          อาจารย์หัวหน้าสาขาเป็นผู้ตรวจสอบข้อมูลและผลการดำเนินงานของนักศึกษา ลงข้อเสนอแนะ
          และประเมินผลหรือยืนยันผลในขั้นตอนสุดท้าย
        </p>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  )
}
