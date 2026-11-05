import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const roleLabels: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  instructor: 'อาจารย์ผู้สอน',
  mentor: 'อาจารย์พี่เลี้ยง',
  supervisor: 'อาจารย์นิเทศ',
  head: 'อาจารย์หัวหน้าสาขา',
  student: 'นักศึกษา',
}

const roleMenus: Record<string, { label: string; path: string; icon: string }[]> = {
  admin: [
    { label: 'แดชบอร์ด', path: '/dashboard', icon: 'dashboard' },
    { label: 'อนุมัติสมาชิก', path: '/dashboard/approvals', icon: 'check' },
    { label: 'จัดการผู้ใช้', path: '/dashboard/users', icon: 'users' },
    { label: 'รายวิชา', path: '/dashboard/subjects', icon: 'book' },
    { label: 'หน่วยงาน', path: '/dashboard/units', icon: 'building' },
    { label: 'ปีการศึกษา', path: '/dashboard/semesters', icon: 'calendar' },
    { label: 'รายงาน', path: '/dashboard/reports', icon: 'chart' },
    { label: 'บันทึกระบบ', path: '/dashboard/audit-logs', icon: 'log' },
  ],
  instructor: [
    { label: 'แดชบอร์ด', path: '/dashboard', icon: 'dashboard' },
    { label: 'ตรวจสอบงาน', path: '/dashboard/review', icon: 'check' },
    { label: 'ประเมินผล', path: '/dashboard/evaluations', icon: 'star' },
    { label: 'รายงาน', path: '/dashboard/summary', icon: 'chart' },
  ],
  supervisor: [
    { label: 'แดชบอร์ด', path: '/dashboard', icon: 'dashboard' },
    { label: 'ตรวจสอบงาน', path: '/dashboard/review', icon: 'check' },
    { label: 'รายงาน', path: '/dashboard/summary', icon: 'chart' },
  ],
  head: [
    { label: 'แดชบอร์ด', path: '/dashboard', icon: 'dashboard' },
    { label: 'ตรวจสอบงาน', path: '/dashboard/review', icon: 'check' },
    { label: 'ประเมินผล', path: '/dashboard/evaluations', icon: 'star' },
    { label: 'รายงาน', path: '/dashboard/summary', icon: 'chart' },
  ],
  mentor: [
    { label: 'แดชบอร์ด', path: '/dashboard', icon: 'dashboard' },
    { label: 'นักศึกษาในความดูแล', path: '/dashboard/students', icon: 'users' },
    { label: 'ตรวจสอบงาน', path: '/dashboard/review', icon: 'check' },
    { label: 'อนุมัติเวลา', path: '/dashboard/timesheet', icon: 'clock' },
  ],
  student: [
    { label: 'แดชบอร์ด', path: '/dashboard', icon: 'dashboard' },
    { label: 'บันทึกกิจกรรม', path: '/dashboard/activities', icon: 'edit' },
    { label: 'บันทึกเวลา', path: '/dashboard/timesheet', icon: 'clock' },
    { label: 'แผนการสอน', path: '/dashboard/lesson-plans', icon: 'book' },
    { label: 'ผลการประเมิน', path: '/dashboard/results', icon: 'star' },
  ],
}

const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
  ),
  building: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  ),
  log: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
  ),
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  ),
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!profile) return null

  const menus = roleMenus[profile.role] || []
  const displayName = [profile.prefix_name, profile.first_name, profile.last_name].filter(Boolean).join(' ')

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar header with logo */}
        <div className="bg-primary-500 p-4 flex items-center gap-3">
          <img src="/logo.png" alt="RMUTI" className="w-10 h-10 flex-shrink-0 object-contain" />
          <div className="text-white min-w-0">
            <p className="text-sm font-semibold truncate">ระบบฝึกปฏิบัติวิชาชีพ</p>
            <p className="text-xs opacity-90 truncate">คณะครุศาสตร์อุตสาหกรรม</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
                {profile.first_name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">{displayName || profile.email}</p>
              <p className="text-xs text-primary-600">{roleLabels[profile.role]}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menus.map((menu) => {
              const isActive = location.pathname === menu.path
              return (
                <li key={menu.path}>
                  <a
                    href={menu.path}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(menu.path)
                      setSidebarOpen(false)
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                    }`}
                  >
                    {icons[menu.icon]}
                    <span>{menu.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3">
          <a
            href="/profile"
            onClick={(e) => {
              e.preventDefault()
              navigate('/profile')
              setSidebarOpen(false)
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span>โปรไฟล์</span>
          </a>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50 transition-all mt-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="RMUTI" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-gray-700">RMUTI Practicum</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
