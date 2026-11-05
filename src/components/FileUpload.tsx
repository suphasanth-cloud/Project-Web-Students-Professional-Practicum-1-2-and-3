
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'

// URL ของ Backend API
// สามารถกำหนดใหม่ได้ในไฟล์ .env
const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost/api'
).replace(/\/$/, '')

// ประเภทไฟล์ที่รองรับ
type UploadKind = 'avatar' | 'activity' | 'lessonplan'

interface FileUploadProps {
  kind: UploadKind
  value: string
  onChange: (url: string) => void
  label?: string
}

interface UploadConfig {
  accept: string
  allowedExtensions: string[]
  allowedMime: string[]
  minMB: number
  maxMB: number
  hint: string
}

// กำหนดเงื่อนไขการอัปโหลดของแต่ละประเภท
const KIND_CONFIG: Record<UploadKind, UploadConfig> = {
  avatar: {
    accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
    allowedExtensions: ['jpg', 'jpeg', 'png'],
    allowedMime: ['image/jpeg', 'image/png'],
    minMB: 0.01,
    maxMB: 5,
    hint: 'รูปภาพ JPG/PNG ขนาดไม่เกิน 5 MB',
  },

  activity: {
    accept: '.jpg,.jpeg,.png,image/jpeg,image/png',
    allowedExtensions: ['jpg', 'jpeg', 'png'],
    allowedMime: ['image/jpeg', 'image/png'],
    minMB: 1,
    maxMB: 5,
    hint: 'รูปภาพ JPG/PNG ขนาด 1–5 MB',
  },

  lessonplan: {
    accept: '.pdf,.doc,.docx',
    allowedExtensions: ['pdf', 'doc', 'docx'],
    allowedMime: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    minMB: 0.01,
    maxMB: 10,
    hint: 'ไฟล์ PDF/Word ขนาดไม่เกิน 10 MB',
  },
}

export default function FileUpload({
  kind,
  value,
  onChange,
  label,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const config = KIND_CONFIG[kind]
  const isImage = kind !== 'lessonplan'

  // ตรวจสอบนามสกุลไฟล์
  const getExtension = (name: string) => {
    return name.split('.').pop()?.toLowerCase() || ''
  }

  // ตรวจสอบไฟล์ก่อนอัปโหลด
  const validateFile = (file: File): string | null => {
    const extension = getExtension(file.name)
    const sizeMB = file.size / (1024 * 1024)

    if (!config.allowedExtensions.includes(extension)) {
      return `ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์ ${config.allowedExtensions.join(', ')}`
    }

    // ตรวจสอบ MIME Type หากเบราว์เซอร์ระบุมา
    if (file.type && !config.allowedMime.includes(file.type)) {
      return 'ประเภทไฟล์ไม่ถูกต้อง'
    }

    if (sizeMB < config.minMB) {
      return `ไฟล์มีขนาดเล็กเกินไป ต้องมีขนาดอย่างน้อย ${config.minMB} MB`
    }

    if (sizeMB > config.maxMB) {
      return `ไฟล์มีขนาดใหญ่เกินไป ต้องไม่เกิน ${config.maxMB} MB`
    }

    return null
  }

  // เลือกและอัปโหลดไฟล์
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    setError(null)

    const validationError = validateFile(file)

    if (validationError) {
      setError(validationError)
      event.target.value = ''
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('kind', kind)

      const token = localStorage.getItem('auth_token')

      const response = await fetch(`${API_URL}/upload.php`, {
        method: 'POST',
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : undefined,
        body: formData,
      })

      // อ่านผลลัพธ์จาก API
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.error || `อัปโหลดไม่สำเร็จ (HTTP ${response.status})`,
        )
      }

      if (!data?.url) {
        throw new Error('เซิร์ฟเวอร์ไม่ได้ส่ง URL ของไฟล์กลับมา')
      }

      // ส่ง URL กลับไปยัง Component ที่เรียกใช้งาน
      onChange(data.url)
      setFileName(file.name)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์'

      setError(message)
    } finally {
      setUploading(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  // เปิดหน้าต่างเลือกไฟล์
  const openFileDialog = () => {
    if (!uploading) {
      inputRef.current?.click()
    }
  }

  // ลบไฟล์ที่เลือก
  const handleRemove = () => {
    if (uploading) return

    onChange('')
    setFileName(null)
    setError(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  // ชื่อไฟล์สำหรับกรณีมี URL อยู่แล้ว
  const displayedFileName =
    fileName || value.split('/').pop()?.split('?')[0] || 'ไฟล์ที่อัปโหลด'

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* กรณีมีไฟล์แล้ว */}
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          {/* Preview */}
          {isImage ? (
            <img
              src={value}
              alt="ตัวอย่างไฟล์"
              className="h-16 w-16 shrink-0 rounded-lg border border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          )}

          {/* File information */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">
              {displayedFileName}
            </p>

            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-blue-600 hover:underline"
            >
              เปิดดูไฟล์
            </a>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="ลบไฟล์"
            className="rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        /* กรณียังไม่มีไฟล์ */
        <button
          type="button"
          onClick={openFileDialog}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <div className="mb-2 h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm font-medium text-blue-600">
                กำลังอัปโหลดไฟล์...
              </span>
            </>
          ) : (
            <>
              {isImage ? (
                <ImageIcon className="mb-2 h-9 w-9 text-gray-400" />
              ) : (
                <FileText className="mb-2 h-9 w-9 text-gray-400" />
              )}

              <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Upload className="h-4 w-4" />
                คลิกเพื่ออัปโหลด{isImage ? 'รูปภาพ' : 'ไฟล์'}
              </span>

              <span className="mt-2 text-xs text-gray-400">
                {config.hint}
              </span>
            </>
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        onChange={handleFile}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-md bg-red-50 p-2 text-sm text-red-600"
        >
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
