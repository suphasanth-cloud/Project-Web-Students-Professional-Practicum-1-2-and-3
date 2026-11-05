import { useNavigate } from 'react-router-dom'

export default function PendingApprovalPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4 py-8">
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-3">
            <img src="/logo.png" alt="RMUTI Logo" className="w-full h-full drop-shadow-lg" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">รอตรวจสอบบัญชี</h2>
          <p className="text-sm text-gray-600 mb-6">
            บัญชีของคุณได้รับการสมัครสมาชิกสำเร็จแล้ว ขณะนี้อยู่ในสถานะ "รอตรวจสอบ"
            แอดมินของมหาวิทยาลัยจะตรวจสอบและอนุมัติบัญชีของคุณก่อนเปิดใช้งาน
          </p>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-warning-700">
              เมื่อแอดมินอนุมัติบัญชีแล้ว คุณจะสามารถเข้าสู่ระบบและใช้งานได้ทันที
            </p>
          </div>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            กลับสู่หน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
