import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeReservationGroupId, validReservationGroupId, reservationCabinPayload, reservationErrorMessage, createdReservations, reservationFieldErrors, eligibleLinkReservation, linkReservationGroup } from '../src/utils/reservationGroups.js'

test('group IDs normalize uppercase UUIDs and clear to null', () => {
  const uuid = 'A175EB6B-5A6F-4A9E-A3AC-2E7784886015'
  assert.equal(normalizeReservationGroupId(` ${uuid} `), uuid.toLowerCase())
  assert.equal(validReservationGroupId(uuid), true)
  for (const value of [null, undefined, '', '   ']) {
    assert.equal(normalizeReservationGroupId(value), null)
    assert.equal(validReservationGroupId(value), true)
  }
  for (const value of ['invalid', 'a175eb6b-5a6f-4a9e-a3ac', 'g175eb6b-5a6f-4a9e-a3ac-2e7784886015'])
    assert.equal(validReservationGroupId(value), false)
})

test('one cabin preserves the individual API contract', () => {
  assert.deepEqual(reservationCabinPayload([{ cabinId: 1, guestNumber: '4', amountPaid: '500' }]), {
    cabin_id: 1, guest_number: 4, amount_paid: 500,
  })
})

test('batch payload sends only the group deposit and cabin guest counts', () => {
  const rows = [
    { cabinId: 1, guestNumber: '4', amountPaid: '500' },
    { cabinId: 2, guestNumber: '2', amountPaid: '300.50' },
    { cabinId: 3, guestNumber: 1, amountPaid: null },
  ]
  const snapshot = structuredClone(rows)
  const payload = reservationCabinPayload(rows, '1000')
  assert.deepEqual(payload, {
    group_amount_paid: 1000,
    cabins: [
      { cabin_id: 1, guest_number: 4 },
      { cabin_id: 2, guest_number: 2 },
      { cabin_id: 3, guest_number: 1 },
    ],
  })
  assert.equal('amount_paid' in payload, false)
  assert.equal('cabin_id' in payload, false)
  assert.equal('guest_number' in payload, false)
  assert.deepEqual(rows, snapshot)
})

test('API validation and availability errors retain useful messages', () => {
  assert.equal(reservationErrorMessage({ data: { errors: { 'cabins.1.guest_number': ['Capacity exceeded.'] } } }, 'Fallback'), 'Capacity exceeded.')
  assert.equal(reservationErrorMessage({ response: { _data: { message: 'Cabin unavailable.' } } }, 'Fallback'), 'Cabin unavailable.')
  assert.equal(reservationErrorMessage({}, 'Fallback'), 'Fallback')
})

test('individual and batch creation responses expose every created reservation', () => {
  assert.deepEqual(createdReservations({ id: 1 }), [{ id: 1 }])
  assert.deepEqual(createdReservations({ reservation_group_id: 'uuid', reservations: [{ id: 1 }, { id: 2 }] }), [{ id: 1 }, { id: 2 }])
  assert.deepEqual(createdReservations({ data: { id: 3 } }), [{ id: 3 }])
})

test('nested 422 errors keep their field paths for inline errors', () => {
  const errors = { 'cabins.1.guest_number': ['Capacity exceeded.'], group_amount_paid: ['Invalid deposit.'] }
  assert.deepEqual(reservationFieldErrors({ status: 422, data: { errors } }), errors)
  assert.deepEqual(reservationFieldErrors({ status: 409 }), {})
})

test('link selection excludes self, grouped and cancelled reservations', () => {
  assert.equal(eligibleLinkReservation({ id: 1 }, 1), false)
  assert.equal(eligibleLinkReservation({ id: 2, status: 'cancelled' }, 1), false)
  assert.equal(eligibleLinkReservation({ id: 2, reservation_group_id: 'another' }, 1), false)
  assert.equal(eligibleLinkReservation({ id: 2, reservation_group_id: null, status: 'pending' }, 1), true)
})

const groupId = 'a175eb6b-5a6f-4a9e-a3ac-2e7784886015'
const mockGroupApi = (reservations, failIds = new Set()) => {
  const patches = []
  const api = async (url, options) => {
    const id = Number(url.split('/').at(-1))
    if (!options) return { ...reservations[id] }
    assert.equal(options.method, 'PATCH')
    patches.push({ id, body: options.body })
    if (failIds.has(id)) throw { data: { message: 'No permission.' } }
    Object.assign(reservations[id], options.body)
    return { ...reservations[id] }
  }
  return { api, patches }
}

test('partial linking preserves successes and retries only the pending reservation', async () => {
  const reservations = { 1: { id: 1 }, 2: { id: 2 }, 3: { id: 3 } }
  const failIds = new Set([3])
  const { api, patches } = mockGroupApi(reservations, failIds)
  const result = await linkReservationGroup(api, 1, [2, 3], groupId)
  assert.deepEqual(result.saved, [1, 2])
  assert.deepEqual(result.pending, [3])
  assert.equal(result.failed[0].message, 'No permission.')
  assert.deepEqual(patches.map(item => item.id), [1, 2, 3])
  assert.ok(patches.every(item => Object.keys(item.body).join() === 'reservation_group_id'))
  failIds.clear()
  const retried = await linkReservationGroup(api, 1, result.pending, groupId)
  assert.deepEqual(retried.failed, [])
  assert.deepEqual(patches.map(item => item.id), [1, 2, 3, 3])
  assert.equal(reservations[3].reservation_group_id, groupId)
})

test('existing groups are reused and another group or cancelled target is never moved', async () => {
  const reservations = { 1: { id: 1, reservation_group_id: groupId }, 2: { id: 2, reservation_group_id: 'other' }, 3: { id: 3, status: 'cancelled' }, 4: { id: 4 } }
  const { api, patches } = mockGroupApi(reservations)
  const result = await linkReservationGroup(api, 1, [2, 3, 4], groupId)
  assert.deepEqual(result.saved, [1, 4])
  assert.deepEqual(result.pending, [2, 3])
  assert.deepEqual(patches.map(item => item.id), [4])
})

test('anchor failure prevents creating unrelated links and keeps every target pending', async () => {
  for (const current of [{ id: 1 }, { id: 1, status: 'cancelled' }, { id: 1, reservation_group_id: 'other' }]) {
    const { api, patches } = mockGroupApi({ 1: current, 2: { id: 2 } }, new Set([1]))
    const result = await linkReservationGroup(api, 1, [2], groupId)
    assert.deepEqual(result.saved, [])
    assert.deepEqual(result.pending, [2])
    assert.equal(result.failed[0].id, 1)
    assert.ok(patches.every(item => item.id === 1))
  }
})
