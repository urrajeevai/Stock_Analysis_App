import { useState, useRef, useEffect, useCallback } from 'react'
import { PhotoIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import { uploadAnalysisImage, deleteAnalysisImage } from '../../services/analysis.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

// Custom event name used to coordinate "only one slot selected at a time"
const SLOT_SELECT_EVENT = 'chartSlot:select'

// ── File helpers ──────────────────────────────────────────────────────────────

function fileFromClipboard(clipboardData) {
  if (!clipboardData?.items) return null
  for (const item of Array.from(clipboardData.items)) {
    if (item.kind === 'file' && ALLOWED_MIME.has(item.type)) return item.getAsFile()
  }
  return null
}

function fileFromDrop(dataTransfer) {
  const file = dataTransfer?.files?.[0]
  return file && ALLOWED_MIME.has(file.type) ? file : null
}

// ── ChartImageSlot ────────────────────────────────────────────────────────────
//
// Renders one chart-image slot (1-4).  Supports three upload paths:
//   1. Browse   — clicking the empty slot / "Replace" button opens the file picker
//   2. Drag-drop — drag any image file onto the slot (empty or filled → replace)
//   3. Paste    — click the slot to select it, then Ctrl+V / ⌘V to paste
//
// Only one slot can be "selected" (paste-ready) at a time, coordinated via
// a CustomEvent on window so siblings deselect automatically.

export default function ChartImageSlot({ slot, currentUrl, analysisId, canEdit, onUpdated }) {
  const [uploading, setUploading] = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSelected, setIsSelected] = useState(false)
  const [errorMsg,   setErrorMsg]   = useState('')

  const containerRef = useRef(null)
  const inputRef     = useRef(null)

  // ── Core upload ─────────────────────────────────────────────────────────────

  const upload = useCallback(async (file) => {
    if (!file) return
    if (!ALLOWED_MIME.has(file.type)) {
      setErrorMsg('Only JPG, PNG, or WEBP images are supported')
      return
    }
    if (!analysisId) {
      setErrorMsg('Save the analysis first before uploading images')
      return
    }
    setErrorMsg('')
    setUploading(true)
    try {
      const res = await uploadAnalysisImage(analysisId, slot, file)
      onUpdated(res.data)
      setIsSelected(false)
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [analysisId, slot, onUpdated])

  // ── Selection (paste-ready state) ──────────────────────────────────────────

  const select = useCallback(() => {
    if (!canEdit || !analysisId) return
    setIsSelected(true)
    setErrorMsg('')
    // Notify siblings to deselect
    window.dispatchEvent(new CustomEvent(SLOT_SELECT_EVENT, { detail: slot }))
  }, [canEdit, analysisId, slot])

  // Deselect when another slot fires the select event
  useEffect(() => {
    const handler = (e) => { if (e.detail !== slot) setIsSelected(false) }
    window.addEventListener(SLOT_SELECT_EVENT, handler)
    return () => window.removeEventListener(SLOT_SELECT_EVENT, handler)
  }, [slot])

  // Deselect on Escape or click outside this slot
  useEffect(() => {
    if (!isSelected) return
    const onKey = (e) => { if (e.key === 'Escape') setIsSelected(false) }
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsSelected(false)
      }
    }
    document.addEventListener('keydown',   onKey)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown',   onKey)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [isSelected])

  // ── Paste handler (only active while this slot is selected) ────────────────

  useEffect(() => {
    if (!isSelected || !canEdit) return
    const onPaste = async (e) => {
      const file = fileFromClipboard(e.clipboardData)
      if (!file) return
      e.preventDefault()
      await upload(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [isSelected, canEdit, upload])

  // ── Drag handlers ───────────────────────────────────────────────────────────

  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (canEdit) setIsDragOver(true)
  }

  const onDragLeave = (e) => {
    // Only clear when the mouse truly leaves this slot's container
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const onDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (!canEdit) return
    const file = fileFromDrop(e.dataTransfer)
    if (!file) { setErrorMsg('Only JPG, PNG, or WEBP images are supported'); return }
    await upload(file)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!window.confirm('Remove this chart image?')) return
    setDeleting(true)
    setErrorMsg('')
    try {
      const res = await deleteAnalysisImage(analysisId, slot)
      onUpdated(res.data)
    } catch (err) {
      setErrorMsg(err.response?.data?.message ?? 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  // ── File input (browse) ─────────────────────────────────────────────────────

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    await upload(file)
    e.target.value = ''
  }

  // Clicking an empty slot → select for paste AND open the file browser
  const handleEmptyClick = () => {
    select()
    if (analysisId) inputRef.current?.click()
  }

  // ── Derived style helpers ───────────────────────────────────────────────────

  const ringClass = isDragOver
    ? 'border-brand ring-2 ring-brand/30 shadow-sm'
    : isSelected
    ? 'border-brand ring-2 ring-brand/20'
    : 'border-slate-200'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="relative group">

      {/* Error banner — click to dismiss */}
      {errorMsg && (
        <div
          className="absolute -top-9 left-0 right-0 z-20 flex justify-center"
          onClick={() => setErrorMsg('')}
        >
          <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[11px] font-medium rounded-lg px-3 py-1.5 cursor-pointer shadow-md select-none">
            {errorMsg}
            <span className="opacity-70">✕</span>
          </span>
        </div>
      )}

      {currentUrl ? (
        /* ── Filled slot ─────────────────────────────────────────────────── */
        <div
          className={`relative rounded-xl overflow-hidden border aspect-video bg-slate-50 cursor-pointer transition-all duration-150 ${ringClass}`}
          onClick={select}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <img
            src={currentUrl}
            alt={`Chart ${slot}`}
            className="w-full h-full object-cover"
            draggable={false}
          />

          {/* Slot label */}
          <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none select-none">
            Chart {slot}
          </span>

          {/* Drag-over overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-brand/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <span className="bg-brand text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg">
                Drop to replace
              </span>
            </div>
          )}

          {/* Paste-ready indicator */}
          {isSelected && !isDragOver && (
            <div className="absolute bottom-0 left-0 right-0 bg-brand/85 text-white text-[11px] font-medium text-center py-1.5 pointer-events-none select-none">
              Ctrl+V / ⌘V to replace · Esc to cancel
            </div>
          )}

          {/* Hover action overlay */}
          {canEdit && !isDragOver && !isSelected && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); window.open(currentUrl, '_blank') }}
                className="bg-white/90 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white transition-colors flex items-center gap-1"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                View
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                disabled={uploading}
                className="bg-white/90 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white transition-colors"
              >
                {uploading ? 'Uploading…' : 'Replace'}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                disabled={deleting}
                className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
              >
                {deleting ? '…' : 'Remove'}
              </button>
            </div>
          )}

          {/* Selected-state hover overlay (shows paste hint + controls) */}
          {canEdit && isSelected && !isDragOver && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 gap-1.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); window.open(currentUrl, '_blank') }}
                className="bg-white/90 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-white transition-colors flex items-center gap-1"
              >
                <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                disabled={uploading}
                className="bg-white/90 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
              >
                {uploading ? '…' : 'Browse'}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                disabled={deleting}
                className="bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-lg hover:bg-red-600 transition-colors"
              >
                {deleting ? '…' : 'Remove'}
              </button>
            </div>
          )}
        </div>
      ) : canEdit ? (
        /* ── Empty slot ──────────────────────────────────────────────────── */
        <div
          onClick={handleEmptyClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={[
            'w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 select-none transition-all duration-150',
            !analysisId
              ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
              : isDragOver
              ? 'border-brand bg-brand/5 scale-[1.01] shadow-sm cursor-copy'
              : isSelected
              ? 'border-brand bg-brand/5 cursor-pointer'
              : 'border-slate-200 bg-slate-50 hover:border-brand hover:bg-brand/5 cursor-pointer',
          ].join(' ')}
        >
          {uploading ? (
            <span className="text-sm text-slate-500">Uploading…</span>
          ) : isDragOver ? (
            <>
              <PhotoIcon className="h-7 w-7 text-brand" />
              <span className="text-sm font-semibold text-brand">Drop image here</span>
            </>
          ) : (
            <>
              <PhotoIcon className={`h-6 w-6 ${isSelected ? 'text-brand' : 'text-slate-400'}`} />
              <span className={`text-xs font-semibold ${isSelected ? 'text-brand' : 'text-slate-500'}`}>
                {analysisId ? `Chart ${slot}` : 'Save first to upload'}
              </span>
              {analysisId && (
                <span className={`text-[10px] leading-tight text-center px-3 ${isSelected ? 'text-brand font-medium' : 'text-slate-400'}`}>
                  {isSelected
                    ? 'Ctrl+V / ⌘V to paste · Esc to cancel'
                    : 'Click to browse · drag or paste'}
                </span>
              )}
            </>
          )}
        </div>
      ) : null}

      {/* Hidden file input — shared for browse and replace */}
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
