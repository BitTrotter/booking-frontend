export const weekDays = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export const createWeeklyPrices = (cabin = {}) => Object.fromEntries(
  weekDays.map(({ key }) => [key, cabin.weekly_prices ? cabin.weekly_prices[key] ?? '' : cabin.price_per_night ?? '']),
)

export const weeklyPriceValidator = value => {
  if (value === null || value === undefined || String(value).trim() === '')
    return 'Enter a rate; zero is allowed.'

  if (!/^\d+(\.\d{1,2})?$/.test(String(value)) || Number(value) > 999999.99)
    return 'Enter an amount from 0 to 999999.99, with up to two decimal places.'

  return true
}

export const validWeeklyPrices = prices => weekDays.every(({ key }) => weeklyPriceValidator(prices[key]) === true)

export const weeklyPricesPayload = prices => Object.fromEntries(weekDays.map(({ key }) => [key, Number(prices[key])]))

export const sameWeeklyPrices = (prices, original) => weekDays.every(({ key }) => String(prices[key]) === String(original[key]))
