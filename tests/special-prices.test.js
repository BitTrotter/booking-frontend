import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { compileScript, parse } from '@vue/compiler-sfc'
import { computed, reactive, ref, watch } from 'vue'
import { isBookingDate } from '../src/utils/bookingDates.js'
import { weeklyPriceValidator } from '../src/utils/weeklyPrices.js'

const source = await readFile(new URL('../src/components/cabins/SpecialPricesEditor.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const compiled = compileScript(descriptor, { id: 'special-prices-test' }).content
const setup = (api, permissions = ['show_cabin_details', 'edit_cabin'], overrides = {}) => {
  const dependencies = {
    computed, ref, watch, onBeforeUnmount: () => {}, isBookingDate, weeklyPriceValidator,
    $api: api, hasPermission: permission => permissions.includes(permission),
  }
  const component = new Function(...Object.keys(dependencies), compiled.replace(/^import .*$/gm, '').replace('export default', 'return'))(...Object.values(dependencies))
  const props = reactive({ cabinId: 1, active: true, readonly: false, ...overrides })
  const state = component.setup(props, { expose() {} })

  return { state, props }
}
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

test('loads sorted rates, saves zero with PUT, replaces an existing date, and deletes without a body', async () => {
  const calls = []
  const { state } = setup(async (url, options) => {
    calls.push({ url, options })
    if (!options.method) return [
      { date: '2026-12-25', price_per_night: 1800 },
      { date: '2026-12-01', price_per_night: 100 },
    ]
    if (options.method === 'PUT') return { id: 12, cabin_id: 1, date: '2026-12-25', ...options.body }

    return { message: 'Special price deleted' }
  })
  await settle()
  assert.deepEqual(state.sortedPrices.value.map(price => price.date), ['2026-12-01', '2026-12-25'])
  state.edit(state.prices.value[0])
  state.amount.value = '0'
  await state.save()
  assert.equal(state.prices.value.length, 2)
  assert.equal(state.prices.value.find(price => price.date === '2026-12-25').price_per_night, 0)
  assert.deepEqual(calls[1], {
    url: '/cabins/1/special-prices/2026-12-25',
    options: { method: 'PUT', headers: { Accept: 'application/json' }, body: { price_per_night: 0 } },
  })
  state.pendingDelete.value = '2026-12-25'
  await state.remove()
  assert.equal(state.prices.value.length, 1)
  assert.equal(calls[2].options.method, 'DELETE')
  assert.equal('body' in calls[2].options, false)
  assert.equal(calls[0].options.headers.Accept, 'application/json')
})

test('permissions separately gate consultation and mutations, including readonly detail', async () => {
  for (const [permissions, readonly, reads, writes] of [
    [[], false, 0, 0],
    [['show_cabin_details'], false, 1, 0],
    [['edit_cabin'], false, 0, 1],
    [['show_cabin_details', 'edit_cabin'], true, 1, 0],
  ]) {
    const calls = []
    const { state } = setup(async (url, options) => {
      calls.push(options.method || 'GET')

      return options.method ? { date: '2026-12-25', price_per_night: 10 } : []
    }, permissions, { readonly })
    await settle()
    state.date.value = '2026-12-25'
    state.amount.value = '10'
    await state.save()
    assert.equal(calls.filter(method => method === 'GET').length, reads)
    assert.equal(calls.filter(method => method === 'PUT').length, writes)
    state.pendingDelete.value = '2026-12-25'
    if (!writes) {
      await state.remove()
      assert.equal(calls.includes('DELETE'), false)
    }
  }
})

test('rejects invalid dates and amounts and preserves input on validation errors from the API', async () => {
  let writes = 0
  const { state } = setup(async (url, options) => {
    if (!options.method) return []
    writes++
    throw { data: { errors: { price_per_night: ['Importe no válido.'] } } }
  })
  await settle()
  state.date.value = '2026-12-25'
  for (const amount of ['', -1, '1.001', '1000000', '1e2']) {
    state.amount.value = amount
    await state.save()
  }
  state.amount.value = '999999.99'
  state.date.value = '2026-02-29'
  await state.save()
  assert.equal(writes, 0)
  state.date.value = '2026-12-25'
  await state.save()
  assert.equal(writes, 1)
  assert.equal(state.error.value, 'Importe no válido.')
  assert.equal(state.amount.value, '999999.99')
  assert.equal(state.date.value, '2026-12-25')
})

test('ignores stale responses when switching cabins and prevents duplicate writes', async () => {
  let finishLoad
  let finishSave
  let writes = 0
  const { state, props } = setup(async (url, options) => {
    if (options.method) {
      writes++

      return new Promise(resolve => { finishSave = resolve })
    }
    if (url.includes('/1/')) return new Promise(resolve => { finishLoad = resolve })

    return []
  })
  props.cabinId = 2
  await settle()
  finishLoad([{ date: '2026-12-25', price_per_night: 1800 }])
  await settle()
  assert.deepEqual(state.prices.value, [])
  state.date.value = '2026-12-25'
  state.amount.value = '1800'
  const pending = state.save()
  await state.save()
  assert.equal(writes, 1)
  props.active = false
  finishSave({ date: '2026-12-25', price_per_night: 1800 })
  await pending
  assert.deepEqual(state.prices.value, [])
  assert.equal(state.success.value, '')
})

test('load and delete errors remain visible and preserve existing rows', async () => {
  let failLoad = true
  const { state } = setup(async (url, options) => {
    if (options.method === 'DELETE') throw { data: { message: 'No se pudo eliminar.' } }
    if (failLoad) throw { data: { message: 'Sin acceso.' } }

    return [{ date: '2026-12-25', price_per_night: 1800 }]
  })
  await settle()
  assert.equal(state.loadFailed.value, true)
  assert.equal(state.error.value, 'Sin acceso.')
  failLoad = false
  await state.load()
  state.pendingDelete.value = '2026-12-25'
  await state.remove()
  assert.equal(state.prices.value.length, 1)
  assert.equal(state.error.value, 'No se pudo eliminar.')
})
