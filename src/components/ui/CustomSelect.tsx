import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
}

export function CustomSelect({ options, value, onChange, placeholder, error }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${error ? '#EF4444' : open ? '#FF3D00' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '12px',
          padding: '14px 16px',
          color: selected ? '#F5F0EB' : '#A0A0A0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: open ? '0 0 0 2px rgba(255,61,0,0.15)' : 'none',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          fontSize: '14px',
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', flexShrink: 0 }}
        >
          <ChevronDown size={16} color={open ? '#FF3D00' : '#A0A0A0'} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#1a1a1f',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              zIndex: 50,
              overflow: 'hidden',
              maxHeight: '200px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#FF3D00 transparent',
            }}
          >
            {options.map(opt => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isSelected ? 'rgba(255,61,0,0.1)' : 'transparent',
                    color: isSelected ? '#FF3D00' : '#A0A0A0',
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    textAlign: 'left',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,61,0,0.08)'
                      ;(e.currentTarget as HTMLButtonElement).style.color = '#F5F0EB'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                      ;(e.currentTarget as HTMLButtonElement).style.color = '#A0A0A0'
                    }
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
