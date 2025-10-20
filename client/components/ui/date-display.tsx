import React from 'react'

interface DateDisplayProps {
  date: string
  className?: string
}

export function DateDisplay({ date, className = "" }: DateDisplayProps) {
  if (!date) {
    return <span className={className}>-</span>
  }

  // Parse the date string
  const dateObj = new Date(date)
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return <span className={className}>-</span>
  }

  // Format date only (YYYY-MM-DD)
  const dateOnly = dateObj.toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD format
  
  // Format full datetime for tooltip
  const fullDateTime = dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  })

  return (
    <span 
      className={`cursor-help ${className}`}
      title={fullDateTime}
    >
      {dateOnly}
    </span>
  )
}
