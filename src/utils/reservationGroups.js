/* eslint-disable camelcase -- API field names follow the existing backend contract. */
export const normalizeReservationGroupId = value => String(value || '').trim().toLowerCase() || null

export const validReservationGroupId = value => !normalizeReservationGroupId(value)
  || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalizeReservationGroupId(value))

export const reservationCabinPayload = (rows, groupAmountPaid = 0) => {
  const cabins = rows.map(row => ({
    cabin_id: row.cabinId,
    guest_number: Number(row.guestNumber),
  }))

  return cabins.length === 1
    ? { ...cabins[0], amount_paid: Number(rows[0].amountPaid || 0) }
    : { group_amount_paid: Number(groupAmountPaid || 0), cabins }
}

export const reservationErrorMessage = (error, fallback) => {
  const data = error?.data || error?.response?._data
  const messages = Object.values(data?.errors || {}).flat().filter(Boolean)

  return messages.length ? messages.join(' ') : data?.message || error?.message || fallback
}

/** @typedef {{ id: number, reservation_group_id: string|null, related_reservations?: Reservation[] }} Reservation */
/** @typedef {Reservation|{reservation_group_id: string, reservations: Reservation[]}} ReservationCreationResponse */

export const reservationFromResponse = response => response?.data || response?.reservation || response
export const createdReservations = response => {
  const result = reservationFromResponse(response)

  return Array.isArray(result?.reservations) ? result.reservations : result?.id ? [result] : []
}

export const reservationFieldErrors = error => error?.data?.errors || error?.response?._data?.errors || {}

export const eligibleLinkReservation = (reservation, currentId) => reservation.id !== currentId
  && reservation.status !== 'cancelled' && !reservation.reservation_group_id

// Each PATCH is independent. Assign the anchor first, then keep individual results for retry.
export const linkReservationGroup = async (api, currentId, targetIds, groupId) => {
  const saved = []
  const failed = []
  try {
    const current = reservationFromResponse(await api(`reservations/${currentId}`))
    if (current.status === 'cancelled') throw new Error('A cancelled reservation cannot be edited.')
    if (current.reservation_group_id && normalizeReservationGroupId(current.reservation_group_id) !== groupId)
      throw new Error('The reservation group has changed. Refresh the data before linking.')
    if (!current.reservation_group_id)
      await api(`reservations/${currentId}`, { method: 'PATCH', body: { reservation_group_id: groupId } })
    saved.push(currentId)
  } catch (error) {
    return { saved, failed: [{ id: currentId, message: reservationErrorMessage(error, 'Unable to save the group.') }], pending: targetIds }
  }
  for (const id of [...new Set(targetIds)].filter(id => id !== currentId)) {
    try {
      const candidate = reservationFromResponse(await api(`reservations/${id}`))
      if (candidate.status === 'cancelled') throw new Error('The reservation is cancelled.')
      if (candidate.reservation_group_id && normalizeReservationGroupId(candidate.reservation_group_id) !== groupId)
        throw new Error('The reservation already belongs to another group.')
      if (!candidate.reservation_group_id)
        await api(`reservations/${id}`, { method: 'PATCH', body: { reservation_group_id: groupId } })
      saved.push(id)
    } catch (error) {
      failed.push({ id, message: reservationErrorMessage(error, 'Unable to link the reservation.') })
    }
  }

  return { saved, failed, pending: failed.map(item => item.id) }
}
