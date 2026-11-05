import type { PracticumLevelInfo } from '../lib/practicum'

interface Props {
  info: PracticumLevelInfo
  compact?: boolean
}

export default function PracticumLevelBanner({ info, compact = false }: Props) {
  return (
    <div className="rounded-xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
          {info.short.replace('ฝึก ', '')}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-primary-800">{info.title}</h3>
          <p className="text-sm text-primary-700">{info.focus}</p>
          {!compact && (
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {info.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-gray-500 italic">{info.recordHint}</p>
        </div>
      </div>
    </div>
  )
}
