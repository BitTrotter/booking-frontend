export const isBookingDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || '')))
    return false

  const date = new Date(`${value}T00:00:00Z`)

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const validBookingDates = (start, end) => isBookingDate(start) && isBookingDate(end) && end > start
