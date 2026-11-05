export type UserRole = 'admin' | 'instructor' | 'mentor' | 'supervisor' | 'head' | 'student'
export type UserStatus = 'pending' | 'approved' | 'rejected'
export type AcademicYearLevel = 1 | 2 | 3
export type PracticumResult = 'pass' | 'fail' | 'withdrawn' | 'pending'
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface UserProfile {
  id: string
  role: UserRole
  status: UserStatus
  email: string
  prefix_name: string | null
  first_name: string | null
  last_name: string | null
  nickname: string | null
  major: string | null
  academic_year_level: AcademicYearLevel | null
  phone: string | null
  address: string | null
  profile_image_url: string | null
  selected_mentor_id: string | null
  selected_unit_id: string | null
  created_at: string
  updated_at: string
}

export interface UniversityUnit {
  id: string
  name: string
  description: string | null
  location: string | null
  created_at: string
}

export interface AcademicSemester {
  id: string
  year: number
  semester: number
  is_current: boolean
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  semester_id: string
  unit_id: string | null
  practicum_level: AcademicYearLevel
  activity_date: string
  title: string
  description: string
  reflection: string | null
  attachment_url: string | null
  mentor_approval_status: ApprovalStatus
  mentor_feedback: string | null
  mentor_approved_at: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceLog {
  id: string
  user_id: string
  semester_id: string
  unit_id: string | null
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: AttendanceStatus
  notes: string | null
  mentor_approval_status: ApprovalStatus
  mentor_approved_at: string | null
  created_at: string
}

export interface LessonPlan {
  id: string
  user_id: string
  semester_id: string
  practicum_level: AcademicYearLevel
  subject_name: string
  topic: string
  plan_url: string
  plan_type: 'url' | 'file'
  instructor_feedback: string | null
  instructor_approval_status: ApprovalStatus
  instructor_approved_at: string | null
  created_at: string
  updated_at: string
}

export interface Evaluation {
  id: string
  user_id: string
  semester_id: string
  practicum_level: AcademicYearLevel
  evaluator_id: string
  evaluator_role: string
  score: number
  comments: string | null
  result: PracticumResult
  is_final: number
  evaluated_at: string
  created_at: string
}
