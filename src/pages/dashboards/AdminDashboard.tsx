import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { UserProfile } from '../../types'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    year1: 0,
    year2: 0,
    year3: 0,
    totalMentors: 0,
    totalInstructors: 0,
    totalSupervisors: 0,
    totalHeads: 0,
    pendingApprovals: 0,
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data: users } = await api.get<{ data: UserProfile[] }>('/users.php')
      if (users) {
        const students = users.filter(u => u.role === 'student' && u.status === 'approved')
        setStats({
          totalStudents: students.length,
          year1: students.filter(s => s.academic_year_level === 1).length,
          year2: students.filter(s => s.academic_year_level === 2).length,
          year3: students.filter(s => s.academic_year_level === 3).length,
          totalMentors: users.filter(u => u.role === 'mentor' && u.status === 'approved').length,
          totalInstructors: users.filter(u => u.role === 'instructor' && u.status === 'approved').length,
          totalSupervisors: users.filter(u => u.role === 'supervisor' && u.status === 'approved').length,
          totalHeads: users.filter(u => u.role === 'head' && u.status === 'approved').length,
          pendingApprovals: users.filter(u => u.status === 'pending').length,
          totalUsers: users.length,
        })
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-primary-100">ภาพรวมระบบฝึกปฏิบัติวิชาชีพ คณะครุศาสตร์อุตสาหกรรม RMUTI</p>
      </div>

      {/* Pending approval alert */}
      {stats.pendingApprovals > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-warning-800">มีบัญชีรออนุมัติ {stats.pendingApprovals} รายการ</p>
            <p className="text-sm text-warning-600">กรุณาตรวจสอบและอนุมัติบัญชีที่สมัครใหม่</p>
          </div>
          <a href="/dashboard/approvals" className="btn-primary text-sm whitespace-nowrap">ตรวจสอบ</a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard title="ผู้ใช้ทั้งหมด" value={loading ? '...' : stats.totalUsers} color="bg-blue-50 text-blue-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <AdminStatCard title="นักศึกษา" value={loading ? '...' : stats.totalStudents} color="bg-primary-50 text-primary-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>}
        />
        <AdminStatCard title="อาจารย์พี่เลี้ยง" value={loading ? '...' : stats.totalMentors} color="bg-success-50 text-success-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <AdminStatCard title="รออนุมัติ" value={loading ? '...' : stats.pendingApprovals} color="bg-warning-50 text-warning-600"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Students by year level */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">นักศึกษาแยกตามชั้นปี</h2>
        <div className="grid grid-cols-3 gap-4">
          <YearLevelCard year={1} count={stats.year1} loading={loading} />
          <YearLevelCard year={2} count={stats.year2} loading={loading} />
          <YearLevelCard year={3} count={stats.year3} loading={loading} />
        </div>
      </div>
    </div>
  )
}

function AdminStatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: React.ReactNode }) {
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

function YearLevelCard({ year, count, loading }: { year: number; count: number; loading: boolean }) {
  const colors: Record<number, string> = {
    1: 'from-blue-400 to-blue-500',
    2: 'from-primary-400 to-primary-500',
    3: 'from-success-400 to-success-500',
  }
  return (
    <div className={`bg-gradient-to-br ${colors[year]} rounded-xl p-4 text-white text-center`}>
      <p className="text-sm opacity-90">ชั้นปีที่ {year}</p>
      <p className="text-3xl font-bold mt-1">{loading ? '...' : count}</p>
      <p className="text-xs opacity-80">คน</p>
    </div>
  )
}
