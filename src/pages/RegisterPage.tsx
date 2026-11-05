import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import type { UserRole, AcademicYearLevel, UniversityUnit } from '../types'

interface Mentor {
  id: string
  first_name: string | null
  last_name: string | null
  nickname: string | null
  prefix_name: string | null
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const role: UserRole = 'student'
  const [prefixName, setPrefixName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [nickname, setNickname] = useState('')
  const [major, setMajor] = useState('')
  const [academicYearLevel, setAcademicYearLevel] = useState<AcademicYearLevel>(1)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedMentorId, setSelectedMentorId] = useState('')

  const [units, setUnits] = useState<UniversityUnit[]>([])
  const [mentors, setMentors] = useState<Mentor[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const unitsRes = await api.get<{ data: UniversityUnit[] }>('/units.php')
        setUnits(unitsRes.data)

        const usersRes = await api.get<{ data: Mentor[] }>('/users.php?role=mentor&status=approved')
        setMentors(usersRes.data)
      } catch {
        // ignore
      }
    }
    fetchData()
  }, [])

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!email.endsWith('@rmuti.ac.th')) {
        setError('อีเมลต้องลงท้ายด้วย @rmuti.ac.th เท่านั้น')
        return
      }
      if (password.length < 6) {
        setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        return
      }
      if (password !== confirmPassword) {
        setError('รหัสผ่านไม่ตรงกัน')
        return
      }
    }
    if (step === 2) {
      if (!prefixName || !firstName || !lastName) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน')
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep(step - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (role === 'student' && (!selectedUnitId || !selectedMentorId)) {
      setError('กรุณาเลือกหน่วยงานและอาจารย์พี่เลี้ยง')
      setLoading(false)
      return
    }

    const { error: signUpError } = await signUp(email, password, {
      role,
      prefix_name: prefixName || null,
      first_name: firstName || null,
      last_name: lastName || null,
      nickname: nickname || null,
      major: major || null,
      academic_year_level: role === 'student' ? academicYearLevel : null,
      phone: phone || null,
      address: address || null,
      selected_mentor_id: role === 'student' ? selectedMentorId || null : null,
      selected_unit_id: role === 'student' ? selectedUnitId || null : null,
    })

    if (signUpError) {
      setError(signUpError)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/pending-approval')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
            <img src="/logo.png" alt="RMUTI Logo" className="w-full h-full drop-shadow-lg" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">สมัครสมาชิก</h1>
          <p className="text-sm text-gray-600">ระบบฝึกปฏิบัติวิชาชีพ คณะครุศาสตร์อุตสาหกรรม RMUTI</p>
        </div>

        <div className="flex items-center justify-center mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                step >= s ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-16 h-1 mx-1 rounded ${step > s ? 'bg-primary-500' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className="mb-4 bg-error-50 border border-error-200 text-error-700 rounded-lg px-4 py-3 text-sm animate-fade-in">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">ข้อมูลบัญชี</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมลมหาวิทยาลัย</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@rmuti.ac.th" required className="input-field" />
                <p className="text-xs text-gray-500 mt-1">ใช้อีเมลที่ลงท้ายด้วย @rmuti.ac.th เท่านั้น</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">รหัสผ่าน</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร" required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ยืนยันรหัสผ่าน</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="input-field" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">ข้อมูลส่วนตัว</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">คำนำหน้า</label>
                  <select value={prefixName} onChange={(e) => setPrefixName(e.target.value)} className="input-field">
                    <option value="">เลือก...</option>
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                    <option value="อาจารย์">อาจารย์</option>
                    <option value="ดร.">ดร.</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">นามสกุล</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อเล่น</label>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">สาขาวิชา</label>
                  <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="เช่น คอมพิวเตอร์ศึกษา" className="input-field" />
                </div>
              </div>
              {role === 'student' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชั้นปี</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((y) => (
                      <button key={y} type="button" onClick={() => setAcademicYearLevel(y as AcademicYearLevel)}
                        className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          academicYearLevel === y ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-primary-300'
                        }`}>
                        ปี {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                {role === 'student' ? 'ข้อมูลการฝึกปฏิบัติ' : 'ยืนยันข้อมูล'}
              </h2>

              {role === 'student' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">หน่วยงาน/ตึกฝึกปฏิบัติ (ภายในมหาวิทยาลัย)</label>
                    <select value={selectedUnitId} onChange={(e) => setSelectedUnitId(e.target.value)} className="input-field">
                      <option value="">เลือกหน่วยงาน...</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {units.length === 0 && (
                      <p className="text-xs text-warning-600 mt-1">ยังไม่มีหน่วยงานในระบบ แอดมินต้องเพิ่มก่อน</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">อาจารย์พี่เลี้ยง</label>
                    <select value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)} className="input-field">
                      <option value="">เลือกอาจารย์พี่เลี้ยง...</option>
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.prefix_name} {m.first_name} {m.last_name} ({m.nickname})
                        </option>
                      ))}
                    </select>
                    {mentors.length === 0 && (
                      <p className="text-xs text-warning-600 mt-1">ยังไม่มีอาจารย์พี่เลี้ยงในระบบ แอดมินต้องเพิ่มก่อน</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">อาจารย์พี่เลี้ยง 1 คน รับนักศึกษาได้สูงสุด 3-4 คน</p>
                  </div>
                </>
              ) : (
                <div className="bg-primary-50 rounded-lg p-4 text-sm text-gray-700">
                  <p>ข้อมูลของคุณจะถูกส่งให้แอดมินตรวจสอบและอนุมัติก่อนเปิดใช้งานบัญชี</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">อีเมล:</span><span className="font-medium">{email}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500">บทบาท:</span>
                  <span className="font-medium">นักศึกษา</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">ชื่อ:</span><span className="font-medium">{prefixName} {firstName} {lastName}</span></div>
                {role === 'student' && (
                  <div className="flex justify-between"><span className="text-gray-500">ชั้นปี:</span><span className="font-medium">ปี {academicYearLevel}</span></div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="btn-secondary flex-1">ย้อนกลับ</button>
            )}
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn-primary flex-1">ถัดไป</button>
            ) : (
              <button type="submit" onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            มีบัญชีแล้ว?{' '}
            <a href="/" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">เข้าสู่ระบบ</a>
          </p>
        </div>
      </div>
    </div>
  )
}
