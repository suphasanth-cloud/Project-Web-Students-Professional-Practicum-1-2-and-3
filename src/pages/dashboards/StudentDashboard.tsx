import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

interface StudentStats {
  totalActivities: number
  pendingActivities: number
  approvedActivities: number
  totalAttendance: number
  lessonPlans: number
}

export default function StudentDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<StudentStats>({
    totalActivities: 0,
    pendingActivities: 0,
    approvedActivities: 0,
    totalAttendance: 0,
    lessonPlans: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return
      const { data: statsData } = await api.get<{ data: { activities?: number; attendance?: number; lesson_plans?: number; evaluations?: number } }>('/stats.php')
      setStats({
        totalActivities: statsData?.activities || 0,
        pendingActivities: 0,
        approvedActivities: 0,
        totalAttendance: statsData?.attendance || 0,
        lessonPlans: statsData?.lesson_plans || 0,
      })
      setLoading(false)
    }
    fetchStats()
  }, [profile?.id])

  const yearLabel = profile?.academic_year_level ? `ปี ${profile.academic_year_level}` : ''
  const practicumInfo: Record<number, { title: string; desc: string }> = {
    1: { title: 'ฝึกปฏิบัติวิชาชีพ 1', desc: 'เน้นเรียนรู้งานครู, E-PLC' },
    2: { title: 'ฝึกปฏิบัติวิชาชีพ 2', desc: 'เน้นสังเกตการสอน, พฤติกรรมผู้เรียน, โมเดล 4+6' },
    3: { title: 'ฝึกปฏิบัติวิชาชีพ 3', desc: 'เน้นผู้ช่วยสอน, แผนการสอน, เทคโนโลยีดิจิทัล' },
  }
  const practicum = profile?.academic_year_level ? practicumInfo[profile.academic_year_level] : null

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">
          สวัสดี, {profile?.first_name || 'นักศึกษา'}!
        </h1>
        <p className="text-primary-100">
          {profile?.major} {yearLabel}
        </p>
        {practicum && (
          <div className="mt-4 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <p className="font-semibold">{practicum.title}</p>
            <p className="text-sm text-primary-100">{practicum.desc}</p>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="บันทึกกิจกรรมทั้งหมด"
          value={loading ? '...' : stats.totalActivities}
          color="bg-blue-50 text-blue-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          }
        />
        <StatCard
          title="รออนุมัติ"
          value={loading ? '...' : stats.pendingActivities}
          color="bg-warning-50 text-warning-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
        />
        <StatCard
          title="อนุมัติแล้ว"
          value={loading ? '...' : stats.approvedActivities}
          color="bg-success-50 text-success-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
        />
        <StatCard
          title="บันทึกเวลา"
          value={loading ? '...' : stats.totalAttendance}
          color="bg-primary-50 text-primary-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          title="บันทึกกิจกรรม"
          desc="บันทึกผลการปฏิบัติงานวันนี้"
          path="/dashboard/activities"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          }
        />
        <QuickAction
          title="บันทึกเวลา"
          desc="ลงเวลาเข้า-ออกการฝึก"
          path="/dashboard/timesheet"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          }
        />
        <QuickAction
          title="ส่งแผนการสอน"
          desc="อัปโหลดหรือแนบลิงก์แผนสอน"
          path="/dashboard/lesson-plans"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          }
        />
      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  )
}

function QuickAction({ title, desc, path, icon }: { title: string; desc: string; path: string; icon: React.ReactNode }) {
  return (
    <a
      href={path}
      onClick={(e) => { e.preventDefault(); window.location.href = path }}
      className="card flex items-center gap-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
    >
      <div className="w-14 h-14 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
    </a>
  )
}
