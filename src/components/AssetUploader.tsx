'use client'

import { useRef, useState } from 'react'

interface Props {
  onAssetChange: (url: string | null, type: string | null) => void
  currentUrl?: string | null
  currentType?: string | null
  className?: string
  label?: string
}

const ACCEPT = '.jpg,.jpeg,.png,.webp,.mp4,.mov'

export default function AssetUploader({ onAssetChange, currentUrl, currentType, className = '', label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/marketing/upload-asset', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json() as { url?: string; asset_type?: string; error?: string }
      if (!res.ok || data.error) {
        setError(data.error ?? 'Upload failed')
      } else {
        onAssetChange(data.url ?? null, data.asset_type ?? null)
      }
    } catch {
      setError('Upload failed — please try again')
    }

    setUploading(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleRemove() {
    onAssetChange(null, null)
    setError(null)
  }

  const hasAsset = !!currentUrl
  const isVideo = currentType === 'video'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {hasAsset ? (
        <div className="relative inline-block">
          {isVideo ? (
            <div className="w-24 h-24 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200">
              <span className="text-3xl">🎬</span>
            </div>
          ) : (
            <img
              src={currentUrl!}
              alt="Post asset"
              className="w-24 h-24 object-cover rounded-xl border border-gray-200"
            />
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm text-xs transition-colors"
            title="Remove"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-2 block text-xs text-[#0D7377] hover:underline text-center w-full"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer
            ${uploading ? 'border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-[#0D7377] hover:bg-teal-50/30'}
          `}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <svg className="animate-spin h-4 w-4 text-[#0D7377]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Uploading…
            </div>
          ) : (
            <>
              <div className="text-2xl mb-1">🖼️</div>
              <p className="text-sm text-gray-500">
                <span className="text-[#0D7377] font-medium">Add image</span> or drag & drop
              </p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP (10 MB) · MP4, MOV (50 MB)</p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
