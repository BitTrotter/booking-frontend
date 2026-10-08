export const weekDays = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
]

export const createWeeklyPrices = (cabin = {}) => Object.fromEntries(
  weekDays.map(({ key }) => [key, cabin.weekly_prices ? cabin.weekly_prices[key] ?? '' : cabin.price_per_night ?? '']),
)

export const weeklyPriceValidator = value => {
  if (value === null || value === undefined || String(value).trim() === '')
    return 'Ingresa una tarifa; puede ser cero.'

  if (!/^\d+(\.\d{1,2})?$/.test(String(value)) || Number(value) > 999999.99)
    return 'Usa un importe entre 0 y 999999.99, con hasta dos decimales.'

  return true
}

export const validWeeklyPrices = prices => weekDays.every(({ key }) => weeklyPriceValidator(prices[key]) === true)

export const weeklyPricesPayload = prices => Object.fromEntries(weekDays.map(({ key }) => [key, Number(prices[key])]))

export const sameWeeklyPrices = (prices, original) => weekDays.every(({ key }) => String(prices[key]) === String(original[key]))
