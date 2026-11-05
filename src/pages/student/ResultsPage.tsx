import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import type { Evaluation } from '../../types'

export default function ResultsPage() {
  const { profile } = useAuth()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!profile?.id) return
      const res = await api.get<{ data: Evaluation[] }>(`/evaluations.php?user_id=${profile.id}`)
      setEvaluations(res.data || [])
      setLoading(false)
    }
    fetchEvaluations()
  }, [profile?.id])

  const resultLabels: Record<string, string> = {
    pass: 'ผ่าน',
    fail: 'ไม่ผ่าน',
    withdrawn: 'ยุติการฝึกปฏิบัติ',
    pending: 'รอประเมิน',
  }

  const resultBadges: Record<string, string> = {
    pass: 'bg-success-100 text-success-700',
    fail: 'bg-error-100 text-error-700',
    withdrawn: 'bg-warning-100 text-warning-700',
    pending: 'bg-gray-100 text-gray-600',
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div></div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ผลการประเมิน</h1>
        <p className="text-sm text-gray-500 mt-1">ผลการฝึกปฏิบัติวิชาชีพ</p>
      </div>

      {evaluations.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>ยังไม่มีผลการประเมิน</p>
        </div>
      ) : (
        <div className="space-y-4">
          {evaluations.map((ev) => (
            <div key={ev.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">ฝึกปฏิบัติวิชาชีพ {ev.practicum_level}</h3>
                  <p className="text-xs text-gray-400">{new Date(ev.evaluated_at).toLocaleDateString('th-TH')}</p>
                </div>
                <span className={`badge text-base px-4 py-1.5 ${resultBadges[ev.result]}`}>
                  {resultLabels[ev.result]}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-primary-600">{ev.score}</p>
                  <p className="text-sm text-gray-500">คะแนน</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">ความคิดเห็นอาจารย์</p>
                  <p className="text-sm text-gray-600">{ev.comments || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
