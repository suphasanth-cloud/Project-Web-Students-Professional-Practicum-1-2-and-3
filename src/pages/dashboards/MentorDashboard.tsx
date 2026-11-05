import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function MentorDashboard() {
  const { profile } = useAuth()
  const [studentCount, setStudentCount] = useState(0)
  const [pendingApprovals, setPendingApprovals] = useState(0)
  const [pendingTimesheets, setPendingTimesheets] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile?.id) return
      const { data: statsData } = await api.get<{ data: { students?: number; pending_activities?: number; pending_attendance?: number } }>('/stats.php')
      setStudentCount(statsData?.students || 0)
      setPendingApprovals(statsData?.pending_activities || 0)
      setPendingTimesheets(statsData?.pending_attendance || 0)
      setLoading(false)
    }
    fetchStats()
  }, [profile?.id])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-1">สวัสดี, อาจารย์พี่เลี้ยง {profile?.first_name}!</h1>
        <p className="text-primary-100">ภายในมหาวิทยาลัย RMUTI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : studentCount}/4</p>
            <p className="text-sm text-gray-500">นักศึกษาในความดูแล</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning-50 text-warning-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : pendingApprovals}</p>
            <p className="text-sm text-gray-500">กิจกรรมรออนุมัติ</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{loading ? '...' : pendingTimesheets}</p>
            <p className="text-sm text-gray-500">เวลารออนุมัติ</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">คำแนะนำ</h2>
        <p className="text-gray-600 text-sm">
          อาจารย์พี่เลี้ยงสามารถรับนักศึกษาได้สูงสุด 3-4 คน หน้าที่ของคุณคือตรวจสอบและอนุมัติ
          บันทึกกิจกรรมและบันทึกเวลาของนักศึกษาในความดูแล
        </p>
      </div>
    </div>
  )
}
