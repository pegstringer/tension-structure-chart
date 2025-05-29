'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ResizableLayoutProps {
  children: React.ReactNode[]
  direction: 'horizontal' | 'vertical'
  initialSizes?: number[]
  minSizes?: number[]
  className?: string
}

export default function ResizableLayout({
  children,
  direction,
  initialSizes = [],
  minSizes = [],
  className = ''
}: ResizableLayoutProps) {
  const [sizes, setSizes] = useState<number[]>(() => {
    if (initialSizes.length === children.length) {
      return initialSizes
    }
    return new Array(children.length).fill(100 / children.length)
  })

  const [isDragging, setIsDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef(0)
  const startSizesRef = useRef<number[]>([])

  const handleMouseDown = useCallback((index: number, event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
    setDragIndex(index)
    startPosRef.current = direction === 'horizontal' ? event.clientX : event.clientY
    startSizesRef.current = [...sizes]
  }, [sizes, direction])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || dragIndex === -1 || !containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height
    const currentPos = direction === 'horizontal' ? event.clientX : event.clientY
    const delta = currentPos - startPosRef.current
    const deltaPercent = (delta / containerSize) * 100

    const newSizes = [...startSizesRef.current]
    const leftIndex = dragIndex
    const rightIndex = dragIndex + 1

    if (rightIndex >= newSizes.length) return

    const leftMinSize = minSizes[leftIndex] || 10
    const rightMinSize = minSizes[rightIndex] || 10

    const newLeftSize = Math.max(leftMinSize, newSizes[leftIndex] + deltaPercent)
    const newRightSize = Math.max(rightMinSize, newSizes[rightIndex] - deltaPercent)

    // 最小サイズ制限のチェック
    if (newLeftSize >= leftMinSize && newRightSize >= rightMinSize) {
      newSizes[leftIndex] = newLeftSize
      newSizes[rightIndex] = newRightSize
      setSizes(newSizes)
    }
  }, [isDragging, dragIndex, minSizes, direction])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragIndex(-1)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = 'auto'
        document.body.style.userSelect = 'auto'
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp, direction])

  const containerClass = direction === 'horizontal' ? 'flex flex-row h-full' : 'flex flex-col h-full'

  return (
    <div ref={containerRef} className={`${containerClass} ${className}`}>
      {children.map((child, index) => (
        <div key={index} className="flex">
          <div
            className="flex-shrink-0 overflow-hidden"
            style={{
              [direction === 'horizontal' ? 'width' : 'height']: `${sizes[index]}%`
            }}
          >
            {child}
          </div>
          {index < children.length - 1 && (
            <div
              className={`flex-shrink-0 ${
                direction === 'horizontal'
                  ? 'w-1 cursor-col-resize bg-gray-300 hover:bg-blue-400 transition-colors'
                  : 'h-1 cursor-row-resize bg-gray-300 hover:bg-blue-400 transition-colors'
              }`}
              onMouseDown={(e) => handleMouseDown(index, e)}
            />
          )}
        </div>
      ))}
    </div>
  )
}