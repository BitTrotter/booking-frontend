import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { compileScript, parse } from '@vue/compiler-sfc'
import { computed, ref, watch, reactive, nextTick } from 'vue'
import * as groups from '../src/utils/reservationGroups.js'
import { validBookingDates } from '../src/utils/bookingDates.js'

// Run the actual SFC setup functions with mocked transport, without a browser or a live API.
const setupComponent = async (name, props, api, extra = {}) => {
  const source = await readFile(new URL(`../src/components/booking/${name}.vue`, import.meta.url), 'utf8')
  const { descriptor } = parse(source)
  const compiled = compileScript(descriptor, { id: name }).content
  const dependencies = {
    ...groups, validBookingDates, computed, ref, watch, $api: api,
    NightlyPrices: {}, CreatedReservations: {}, ReservationDetail: {}, LinkReservations: {},
    hasPermission: () => true, confirm: () => true,
    emailValidator: value => !value || value.includes('@') || 'Invalid email', ...extra,
  }
  const component = new Function(...Object.keys(dependencies), compiled.replace(/^import .*$/gm, '').replace('export default', 'return'))(...Object.values(dependencies))
  const events = []
  const state = component.setup(reactive(props), { expose() {}, emit: (...args) => events.push(args) })
  return { state, events }
}
const settle = async () => {
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}
const fillCreation = async state => {
  state.cabinItems.value = [{ id: 1, capacity: 4 }, { id: 2, capacity: 2 }]
  state.selectedCabinIds.value = [1, 2]
  state.startDate.value = '2026-12-01'
  state.endDate.value = '2026-12-03'
  state.fullName.value = 'Ana Perez'
  state.phone.value = '5551234567'
  await settle()
  state.cabinRows.value[0].guestNumber = 4
  state.cabinRows.value[0].amountPaid = 500
  state.cabinRows.value[1].guestNumber = 2
  state.cabinRows.value[1].amountPaid = 300
  state.groupAmountPaid.value = 1000
}

test('batch creation queries every cabin, sums prices, rejects duplicate submissions, and shows created objects', async () => {
  const calls = []
  let finish
  const api = async (url, options) => {
    calls.push({ url, options })
    if (!options) return { available: true, total_price: 100, currency: 'USD' }
    return new Promise(resolve => { finish = resolve })
  }
  const { state, events } = await setupComponent('AddReservation', { isDialogVisible: false, initialReservation: null }, api)
  await fillCreation(state)
  assert.equal(calls.filter(call => call.url.includes('availability')).length, 2)
  assert.equal(state.priceSummary.value, '$200.00')
  const pending = state.submitReservation()
  await state.submitReservation()
  const posts = calls.filter(call => call.options?.method === 'POST')
  assert.equal(posts.length, 1)
  assert.equal(posts[0].options.body.group_amount_paid, 1000)
  assert.deepEqual(posts[0].options.body.cabins, [{ cabin_id: 1, guest_number: 4 }, { cabin_id: 2, guest_number: 2 }])
  for (const field of ['cabin_id', 'guest_number', 'amount_paid', 'reservation_group_id'])
    assert.equal(field in posts[0].options.body, false)
  finish({ reservation_group_id: 'backend-generated', reservations: [{ id: 101 }, { id: 102 }] })
  await pending
  assert.deepEqual(state.created.value, [{ id: 101 }, { id: 102 }])
  assert.equal(state.resultsVisible.value, true)
  assert.ok(events.some(event => event[0] === 'reservationCreated'))
})

test('409 and nested 422 failures preserve all form values and map cabin field errors', async () => {
  for (const status of [409, 422]) {
    const error = { status, data: { message: 'Cannot create.', errors: status === 422 ? { 'cabins.1.guest_number': ['Too many guests.'] } : {} } }
    const { state, events } = await setupComponent('AddReservation', { isDialogVisible: false, initialReservation: null }, async (url, options) => {
      if (options) throw error
      return { available: true, total_price: 100 }
    })
    await fillCreation(state)
    await state.submitReservation()
    assert.equal(state.groupAmountPaid.value, 1000)
    assert.equal(state.fullName.value, 'Ana Perez')
    assert.equal(state.cabinRows.value[0].amountPaid, 500)
    assert.equal(state.cabinRows.value[1].amountPaid, 300)
    assert.equal(state.resultsVisible.value, false)
    assert.equal(state.isSubmitting.value, false)
    assert.ok(!events.some(event => event[0] === 'reservationCreated'))
    if (status === 422) assert.deepEqual(state.errorsFor(1, 'guest_number'), ['Too many guests.'])
  }
})

test('single creation preserves the old body and send_email requires an email', async () => {
  let body
  const { state } = await setupComponent('AddReservation', { isDialogVisible: false, initialReservation: null }, async (url, options) => {
    if (!options) return { available: true, total_price: 100 }
    body = options.body
    return { id: 101 }
  })
  await fillCreation(state)
  state.selectedCabinIds.value = [1]
  await settle()
  state.sendEmail.value = true
  assert.equal(state.canSubmit.value, false)
  state.email.value = 'ana@example.com'
  assert.equal(state.canSubmit.value, true)
  await state.submitReservation()
  assert.equal(body.cabin_id, 1)
  assert.equal(body.guest_number, 4)
  assert.equal(body.amount_paid, 500)
  assert.equal('cabins' in body, false)
  assert.equal('group_amount_paid' in body, false)
  assert.deepEqual(state.created.value, [{ id: 101 }])
})

test('unlink patches only the current group field, with cancelled and permission guards', async () => {
  for (const [status, permitted, expected] of [['pending', true, 1], ['cancelled', true, 0], ['pending', false, 0]]) {
    const calls = []
    const { state } = await setupComponent('ReservationDetail', { isDialogVisible: true, reservation: { id: 1, reservation_group_id: 'uuid', status }, payment: null }, async (url, options) => calls.push({ url, options }), { hasPermission: () => permitted })
    await state.unlink()
    assert.equal(calls.length, expected)
    if (expected) assert.deepEqual(calls[0], { url: 'reservations/1', options: { method: 'PATCH', body: { reservation_group_id: null } } })
  }
})

test('related detail keeps cancelled reservations, excludes self, and navigation fetches fresh detail', async () => {
  const { state: detail } = await setupComponent('ReservationDetail', { isDialogVisible: true, reservation: { id: 1, related_reservations: [{ id: 1 }, { id: 2, status: 'cancelled' }] }, payment: null }, async () => {})
  assert.deepEqual(detail.relatedReservations.value, [{ id: 2, status: 'cancelled' }])
  const calls = []
  const { state } = await setupComponent('CreatedReservations', {}, async url => {
    calls.push(url)
    return { id: 2, related_reservations: [{ id: 1 }] }
  })
  await state.openDetail({ id: 2 })
  assert.deepEqual(calls, ['reservations/2'])
  assert.equal(state.selected.value.id, 2)
  assert.equal(state.detailVisible.value, true)
})

test('link dialog generates one UUID, preserves pending selections, refreshes after partial failure, and retries', async () => {
  const reservations = { 1: { id: 1 }, 2: { id: 2 }, 3: { id: 3 } }
  const patches = []
  let fail = true
  let generated = 0
  const groupId = 'a175eb6b-5a6f-4a9e-a3ac-2e7784886015'
  const { state, events } = await setupComponent('LinkReservations', { isDialogVisible: false, reservation: reservations[1] }, async (url, options) => {
    if (url === 'reservations') return Object.values(reservations)
    const id = Number(url.split('/').at(-1))
    if (!options) return { ...reservations[id] }
    patches.push(id)
    if (id === 3 && fail) throw { data: { message: 'Failed.' } }
    Object.assign(reservations[id], options.body)
  }, { crypto: { randomUUID: () => { generated++; return groupId } } })
  state.selectedIds.value = [2, 3]
  await state.save()
  assert.deepEqual(state.selectedIds.value, [3])
  assert.deepEqual(state.savedIds.value, [1, 2])
  assert.equal(state.failures.value[0].id, 3)
  assert.ok(events.some(event => event[0] === 'reservationUpdated'))
  fail = false
  await state.save()
  assert.deepEqual(state.selectedIds.value, [])
  assert.deepEqual(patches, [1, 2, 3, 3])
  assert.equal(generated, 1)
})

test('link dialog blocks mutations without edit permission or on a cancelled anchor', async () => {
  for (const [status, permitted] of [['cancelled', true], ['pending', false]]) {
    let calls = 0
    const { state } = await setupComponent('LinkReservations', { isDialogVisible: false, reservation: { id: 1, status } }, async () => { calls++ }, { hasPermission: () => permitted })
    state.selectedIds.value = [2]
    await state.save()
    assert.equal(calls, 0)
  }
})
