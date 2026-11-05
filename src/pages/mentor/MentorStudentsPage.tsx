import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { UserProfile } from '../../types'

export default function MentorStudentsPage() {
  const { profile } = useAuth()
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudents = async () => {
      if (!profile?.id) return
      const { data } = await api.get<{ data: UserProfile[] }>('/users.php?role=student&status=approved')
      setStudents(data || [])
      setLoading(false)
    }
    fetchStudents()
  }, [profile?.id])

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">นักศึกษาในความดูแล</h1>
        <p className="text-sm text-gray-500 mt-1">นักศึกษาที่คุณเป็นอาจารย์พี่เลี้ยง ({students.length}/4 คน)</p>
      </div>

      {students.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>ยังไม่มีนักศึกษาในความดูแล</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((s) => (
            <div key={s.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                {s.profile_image_url ? (
                  <img src={s.profile_image_url} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-lg">
                    {s.first_name?.charAt(0) || 'S'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {s.prefix_name} {s.first_name} {s.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{s.nickname || '-'} - {s.major || '-'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge bg-primary-100 text-primary-700">ปี {s.academic_year_level}</span>
                    <span className="text-xs text-gray-400">{s.phone || 'ไม่มีเบอร์'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
