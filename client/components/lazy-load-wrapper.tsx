"use client"

import { useState, useEffect, useRef, ReactNode } from "react"

interface LazyLoadWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
}

export function LazyLoadWrapper({ 
  children, 
  fallback = <div className="h-32 bg-muted rounded animate-pulse" />,
  rootMargin = "50px",
  threshold = 0.1
}: LazyLoadWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          setHasLoaded(true)
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [rootMargin, threshold]) // Removed hasLoaded from dependencies

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}
