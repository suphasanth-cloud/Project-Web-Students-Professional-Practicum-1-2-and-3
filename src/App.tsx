import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PendingApprovalPage from './pages/PendingApprovalPage'
import DashboardLayout from './pages/DashboardLayout'
import StudentDashboard from './pages/dashboards/StudentDashboard'
import MentorDashboard from './pages/dashboards/MentorDashboard'
import InstructorDashboard from './pages/dashboards/InstructorDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'
import SupervisorDashboard from './pages/dashboards/SupervisorDashboard'
import HeadDashboard from './pages/dashboards/HeadDashboard'
import ProfilePage from './pages/ProfilePage'
import ActivitiesPage from './pages/student/ActivitiesPage'
import TimesheetPage from './pages/student/TimesheetPage'
import LessonPlansPage from './pages/student/LessonPlansPage'
import ResultsPage from './pages/student/ResultsPage'
import MentorStudentsPage from './pages/mentor/MentorStudentsPage'
import MentorReviewPage from './pages/mentor/MentorReviewPage'
import MentorTimesheetPage from './pages/mentor/MentorTimesheetPage'
import InstructorReviewPage from './pages/instructor/InstructorReviewPage'
import InstructorEvaluationsPage from './pages/instructor/InstructorEvaluationsPage'
import InstructorSummaryPage from './pages/instructor/InstructorSummaryPage'
import AdminApprovalsPage from './pages/admin/AdminApprovalsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminUnitsPage from './pages/admin/AdminUnitsPage'
import AdminSemestersPage from './pages/admin/AdminSemestersPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage'
import AdminSubjectsPage from './pages/admin/AdminSubjectsPage'
import SupervisorReviewPage from './pages/supervisor/SupervisorReviewPage'
import HeadReviewPage from './pages/head/HeadReviewPage'

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/" replace />
  if (profile?.status === 'pending') return <Navigate to="/pending-approval" replace />

  if (profile?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-error-50 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-error-700 mb-2">บัญชีของคุณถูกปฏิเสธ</h2>
          <p className="text-gray-600">กรุณาติดต่อแอดมินเพื่อสอบถามข้อมูลเพิ่มเติม</p>
        </div>
      </div>
    )
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function DashboardRouter() {
  const { profile } = useAuth()
  if (!profile) return null
  switch (profile.role) {
    case 'student': return <StudentDashboard />
    case 'mentor': return <MentorDashboard />
    case 'instructor': return <InstructorDashboard />
    case 'admin': return <AdminDashboard />
    case 'supervisor': return <SupervisorDashboard />
    case 'head': return <HeadDashboard />
    default: return <Navigate to="/" replace />
  }
}

function TimesheetRouter() {
  const { profile } = useAuth()
  if (!profile) return null
  return profile.role === 'student' ? <TimesheetPage /> : <MentorTimesheetPage />
}

function ReviewRouter() {
  const { profile } = useAuth()
  if (!profile) return null
  if (profile.role === 'mentor') return <MentorReviewPage />
  if (profile.role === 'supervisor') return <SupervisorReviewPage />
  if (profile.role === 'head') return <HeadReviewPage />
  return <InstructorReviewPage />
}

function AppRoutes() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={session ? (profile?.status === 'pending' ? <Navigate to="/pending-approval" /> : <Navigate to="/dashboard" />) : <LoginPage />} />
      <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardRouter /></DashboardLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><DashboardLayout><ProfilePage /></DashboardLayout></ProtectedRoute>} />

      <Route path="/dashboard/activities" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><ActivitiesPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/timesheet" element={<ProtectedRoute allowedRoles={['student', 'mentor']}><DashboardLayout><TimesheetRouter /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/lesson-plans" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><LessonPlansPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/results" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout><ResultsPage /></DashboardLayout></ProtectedRoute>} />

      <Route path="/dashboard/students" element={<ProtectedRoute allowedRoles={['mentor']}><DashboardLayout><MentorStudentsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/review" element={<ProtectedRoute allowedRoles={['mentor', 'instructor', 'supervisor', 'head']}><DashboardLayout><ReviewRouter /></DashboardLayout></ProtectedRoute>} />

      <Route path="/dashboard/evaluations" element={<ProtectedRoute allowedRoles={['instructor', 'head']}><DashboardLayout><InstructorEvaluationsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/summary" element={<ProtectedRoute allowedRoles={['instructor', 'supervisor', 'head']}><DashboardLayout><InstructorSummaryPage /></DashboardLayout></ProtectedRoute>} />

      <Route path="/dashboard/approvals" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminApprovalsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/users" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminUsersPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/units" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminUnitsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/semesters" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminSemestersPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/reports" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminReportsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminAuditLogsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/subjects" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout><AdminSubjectsPage /></DashboardLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
