import assert from 'node:assert/strict'
import test from 'node:test'
import { createWeeklyPrices, sameWeeklyPrices, validWeeklyPrices, weekDays, weeklyPriceValidator, weeklyPricesPayload } from '../src/utils/weeklyPrices.js'
import { isBookingDate, validBookingDates } from '../src/utils/bookingDates.js'

test('weekly rates accept zero, cents, and the maximum; reject invalid amounts', () => {
  for (const value of [0, '0.00', 10.25, '999999.99'])
    assert.equal(weeklyPriceValidator(value), true)

  for (const value of [null, undefined, '', ' ', -1, '1.001', 1000000, NaN, Infinity, '1e2'])
    assert.notEqual(weeklyPriceValidator(value), true)
})

test('weekly rates take precedence over a legacy minimum, including free nights', () => {
  const prices = Object.fromEntries(weekDays.map(({ key }, index) => [key, index === 0 ? 0 : '20.25']))
  assert.deepEqual(createWeeklyPrices({ weekly_prices: prices, price_per_night: 5 }), prices)
  assert.equal(validWeeklyPrices(prices), true)
  assert.equal(weeklyPricesPayload(prices).monday, 0)
  assert.equal(weeklyPricesPayload(prices).tuesday, 20.25)
})

test('legacy cabins populate seven equal rates and incomplete maps stay invalid', () => {
  assert.equal(Object.keys(createWeeklyPrices({ price_per_night: 0 })).length, 7)
  assert.equal(validWeeklyPrices(createWeeklyPrices({ price_per_night: 0 })), true)
  assert.equal(validWeeklyPrices(createWeeklyPrices()), false)
  assert.equal(validWeeklyPrices(createWeeklyPrices({ weekly_prices: { monday: 10 }, price_per_night: 10 })), false)
})

test('editing one day sends all seven keys without changing the original snapshot', () => {
  const original = createWeeklyPrices({ price_per_night: 10 })
  const edited = { ...original, friday: '20.50', unexpected: 99 }
  assert.equal(sameWeeklyPrices({ ...original }, original), true)
  assert.equal(sameWeeklyPrices(edited, original), false)
  const payload = weeklyPricesPayload(edited)
  assert.deepEqual(Object.keys(payload), weekDays.map(({ key }) => key))
  assert.equal(payload.friday, 20.5)
  assert.equal(original.friday, 10)
})

test('booking dates require real calendar dates and a later checkout', () => {
  assert.equal(validBookingDates('2026-10-08', '2026-10-10'), true)
  assert.equal(isBookingDate('2028-02-29'), true)
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-10-08T00:00:00Z', '2026-1-8', ''])
    assert.equal(isBookingDate(date), false)
  assert.equal(validBookingDates('2026-10-08', '2026-10-08'), false)
  assert.equal(validBookingDates('2026-10-10', '2026-10-08'), false)
})
