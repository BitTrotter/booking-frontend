import { $api } from '@/utils/api'

export const useCalendarStore = defineStore('calendar', {
  // arrow function recommended for full type inference
  state: () => ({
    availableCalendars: [
      {
        color: 'error',
        label: 'Personal',
      },
      {
        color: 'primary',
        label: 'Business',
      },
      {
        color: 'warning',
        label: 'Family',
      },
      {
        color: 'success',
        label: 'Holiday',
      },
      {
        color: 'info',
        label: 'ETC',
      },
    ],
    selectedCalendars: ['Personal', 'Business', 'Family', 'Holiday', 'ETC'],
  }),
  actions: {
    async fetchEvents(search = '') {
      return await $api(`/reservations?search=${encodeURIComponent(search ?? '')}`, {
        method: 'GET',
      })
    },
    async addEvent(event) {
      await $api('/reservations', {
        method: 'POST',
        body: event,
      })
    },
    async updateEvent(event) {
      return await $api(`/reservations/${event.id}`, {
        method: 'PUT',
        body: event,
      })
    },
    async removeEvent(eventId) {
      return await $api(`/reservations/${eventId}`, {
        method: 'DELETE',
      })
    },
  },
})
