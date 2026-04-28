import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useConfigStore } from '@core/stores/config'
import { useCalendarStore } from '@/plugins/calendar/useCalendarStore'

export const blankEvent = {
  title: '',
  start: '',
  end: '',
  allDay: false,
  url: '',
  extendedProps: {
    /*
          ℹ️ We have to use undefined here because if we have blank string as value then select placeholder will be active (moved to top).
          Hence, we need to set it to undefined or null
        */
    calendar: undefined,
    guests: [],
    location: '',
    description: '',
  },
}

const date = new Date()
const nextDay = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
const nextMonth = date.getMonth() === 11 ? new Date(date.getFullYear() + 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() + 1, 1)
const prevMonth = date.getMonth() === 11 ? new Date(date.getFullYear() - 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() - 1, 1)
// start: '2024-07-11T18:50:00',
    // end: '2024-07-15T18:50:00',
export const events = [
  {
    id: 1,
    url: '',
    title: 'Design Review',
    start: date,
    end: nextDay,
    allDay: false,
    extendedProps: {
      calendar: 'Business',
    },
  },
  {
    id: 2,
    url: '',
    title: 'Meeting With Client',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
    allDay: true,
    extendedProps: {
      calendar: 'Business',
    },
  },
  {
    id: 3,
    url: '',
    title: 'Family Trip',
    allDay: true,
    start: new Date('2024-11-21 10:00:00'),//date.getFullYear(), date.getMonth() + 1, -9
    end: new Date('2024-11-25 10:15:00'),//date.getFullYear(), date.getMonth() + 1, -7
    extendedProps: {
      calendar: 'Holiday',
    },
  },
  {
    id: 4,
    url: '',
    title: 'Doctor\'s Appointment',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -11),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -10),
    allDay: true,
    extendedProps: {
      calendar: 'Personal',
    },
  },
  {
    id: 5,
    url: '',
    title: 'Dart Game?',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'ETC',
    },
  },
  {
    id: 6,
    url: '',
    title: 'Meditation',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Personal',
    },
  },
  {
    id: 7,
    url: '',
    title: 'Dinner',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Family',
    },
  },
  {
    id: 8,
    url: '',
    title: 'Product Review',
    start: new Date(date.getFullYear(), date.getMonth() + 1, -13),
    end: new Date(date.getFullYear(), date.getMonth() + 1, -12),
    allDay: true,
    extendedProps: {
      calendar: 'Business',
    },
  },
  {
    id: 9,
    url: '',
    title: 'Monthly Meeting',
    start: nextMonth,
    end: nextMonth,
    allDay: true,
    extendedProps: {
      calendar: 'Business',
    },
  },
  {
    id: 10,
    url: '',
    title: 'Monthly Checkup',
    start: prevMonth,
    end: prevMonth,
    allDay: true,
    extendedProps: {
      calendar: 'Personal',
    },
  },
];
export const useCalendar = (event, isEventHandlerSidebarActive, isLeftSidebarOpen) => {
  const configStore = useConfigStore()

  // 👉 Store
  const store = useCalendarStore()

  // 👉 Calendar template ref
  const refCalendar = ref()

  const isDateOnlyString = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  const isMidnightIsoLike = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[T ]00:00(:00(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.test(value)
  const isDateTimeNoTz = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/.test(value) && !/(Z|[+-]\d{2}:\d{2})$/.test(value)

  // `new Date('YYYY-MM-DD')` is parsed as UTC in JS, which shifts the day
  // for negative offsets (e.g. America/Mexico_City). Parse date-only strings
  // as local dates to keep the intended calendar day.
  const parseToLocalDate = value => {
    if (!value)
      return null

    if (isDateOnlyString(value) || isMidnightIsoLike(value)) {
      const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
      const dt = new Date(year, month - 1, day)

      return Number.isNaN(dt.getTime()) ? null : dt
    }

    // Handle `YYYY-MM-DD HH:mm:ss` and `YYYY-MM-DDTHH:mm:ss` without timezone reliably as local time
    if (isDateTimeNoTz(value)) {
      const normalized = String(value).replace('T', ' ')
      const [datePart, timePart] = normalized.split(' ')
      const [year, month, day] = datePart.split('-').map(Number)
      const [hour, minute, second = '0'] = timePart.split(':')
      const dt = new Date(year, month - 1, day, Number(hour), Number(minute), Number(second))

      return Number.isNaN(dt.getTime()) ? null : dt
    }

    const dt = new Date(value)

    return Number.isNaN(dt.getTime()) ? null : dt
  }


  // 👉 Calendar colors
  const calendarsColor = {
    Business: 'primary',
    Holiday: 'success',
    Personal: 'error',
    Family: 'warning',
    ETC: 'info',
  }


  // ℹ️ Extract event data from event API
  const extractEventDataFromEventApi = eventApi => {
        
    const { id, title, start, end, url, extendedProps: { calendar, guests, location, description }, allDay } = eventApi
    
    return {
      id,
      title,
      start,
      end,
      url,
      extendedProps: {
        calendar,
        guests,
        location,
        description,
      },
      allDay,
    }
  }
    
  if (typeof process !== 'undefined' && process.server)
    store.fetchEvents()


  // 👉 Fetch events
  const fetchEvents = (info, successCallback) => {
    // If there's no info => Don't make useless API call
    // if (!info)
    //   return

    // console.log(events);
    // successCallback(events.map(e => ({
    //   ...e,

    //   // Convert string representation of date to Date object
    //   start: new Date(e.start),
    //   end: new Date(e.end),
    // })))
    store.fetchEvents()
      .then(response => {
        const rawEvents = Array.isArray(response)
          ? response
          : (response?.data ?? response?.reservations ?? [])

        if (!Array.isArray(rawEvents)) {
          console.error('Calendar events response is not an array:', response)
          successCallback([])

          return
        }

        const normalizedEvents = rawEvents.map(e => {
          const start = e?.start ?? e?.start_date ?? e?.startDate
          const end = e?.end ?? e?.end_date ?? e?.endDate

          const startDate = parseToLocalDate(start)
          const endDate = parseToLocalDate(end)

          const isAllDayFromDates = (isDateOnlyString(start) || isMidnightIsoLike(start)) && (isDateOnlyString(end) || isMidnightIsoLike(end))
          const allDay = e?.allDay ?? isAllDayFromDates

          // FullCalendar treats `end` as exclusive for all-day events.
          // If API dates are inclusive (common for date ranges), add 1 day to `end`.
          const endForCalendar = allDay && endDate
            ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1)
            : endDate

          return {
            ...e,
            title: e?.title ?? e?.name ?? (e?.cabin?.name ? `Cabin: ${e.cabin.name}` : null) ?? (e?.id ? `Reservation #${e.id}` : 'Reservation'),
            start: startDate ?? start,
            end: endForCalendar ?? end,
            allDay,
            extendedProps: {
              ...(e?.extendedProps ?? {}),
              calendar: e?.extendedProps?.calendar ?? e?.calendar ?? 'Business',
            },
          }
        })

        successCallback(normalizedEvents)
      })
      .catch(e => {
        console.error('Error occurred while fetching calendar events', e)
      })
  }


  // 👉 Calendar API
  const calendarApi = ref(null)


  // 👉 Update event in calendar [UI]
  const updateEventInCalendar = (updatedEventData, propsToUpdate, extendedPropsToUpdate) => {
    const existingEvent = calendarApi.value?.getEventById(String(updatedEventData.id))
    if (!existingEvent) {
      console.warn('Can\'t found event in calendar to update')
      
      return
    }

    // ---Set event properties except date related
    // Docs: https://fullcalendar.io/docs/Event-setProp
    // dateRelatedProps => ['start', 'end', 'allDay']
    for (let index = 0; index < propsToUpdate.length; index++) {
      const propName = propsToUpdate[index]

      existingEvent.setProp(propName, updatedEventData[propName])
    }

    // --- Set date related props
    // ? Docs: https://fullcalendar.io/docs/Event-setDates
    existingEvent.setDates(updatedEventData.start, updatedEventData.end, { allDay: updatedEventData.allDay })

    // --- Set event's extendedProps
    // ? Docs: https://fullcalendar.io/docs/Event-setExtendedProp
    for (let index = 0; index < extendedPropsToUpdate.length; index++) {
      const propName = extendedPropsToUpdate[index]

      existingEvent.setExtendedProp(propName, updatedEventData.extendedProps[propName])
    }
  }


  // 👉 Remove event in calendar [UI]
  const removeEventInCalendar = eventId => {
    const _event = calendarApi.value?.getEventById(eventId)
    if (_event)
      _event.remove()
  }


  // 👉 refetch events
  const refetchEvents = () => {
    calendarApi.value?.refetchEvents()
  }

  watch(() => store.selectedCalendars, refetchEvents)


  // 👉 Add event
  const addEvent = _event => {
    store.addEvent(_event)
      .then(() => {
        refetchEvents()
      })
  }


  // 👉 Update event
  const updateEvent = _event => {
    // ℹ️ Making API call using $api('', { method: ... })
    store.updateEvent(_event)
      .then(r => {
        const propsToUpdate = ['id', 'title', 'url']
        const extendedPropsToUpdate = ['calendar', 'guests', 'location', 'description']

        updateEventInCalendar(r, propsToUpdate, extendedPropsToUpdate)
      })
    refetchEvents()
  }


  // 👉 Remove event
  const removeEvent = eventId => {
    store.removeEvent(eventId).then(() => {
      removeEventInCalendar(eventId)
    })
  }

  // 👉 Calendar options
  const calendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'drawerToggler,prev,next title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
    },
    events: fetchEvents,

    // ❗ We need this to be true because when its false and event is allDay event and end date is same as start data then Full calendar will set end to null
    forceEventDuration: true,

    /*
        Enable dragging and resizing event
        Docs: https://fullcalendar.io/docs/editable
      */
    editable: true,

    /*
        Enable resizing event from start
        Docs: https://fullcalendar.io/docs/eventResizableFromStart
      */
    eventResizableFromStart: true,

    /*
        Automatically scroll the scroll-containers during event drag-and-drop and date selecting
        Docs: https://fullcalendar.io/docs/dragScroll
      */
    dragScroll: true,

    /*
        Max number of events within a given day
        Docs: https://fullcalendar.io/docs/dayMaxEvents
      */
    dayMaxEvents: 2,

    /*
        Determines if day names and week names are clickable
        Docs: https://fullcalendar.io/docs/navLinks
      */
    navLinks: true,
    eventClassNames({ event: calendarEvent }) {
      const colorName = calendarsColor[calendarEvent._def.extendedProps.calendar]
      
      return [
        // Background Color
        `bg-light-${colorName} text-${colorName}`,
      ]
    },
    eventClick({ event: clickedEvent, jsEvent }) {
      // Prevent the default action
      jsEvent.preventDefault()
      if (clickedEvent.url) {
        // Open the URL in a new tab
        window.open(clickedEvent.url, '_blank')
      }

      // * Only grab required field otherwise it goes in infinity loop
      // ! Always grab all fields rendered by form (even if it get `undefined`) otherwise due to Vue3/Composition API you might get: "object is not extensible"
      event.value = extractEventDataFromEventApi(clickedEvent)
      isEventHandlerSidebarActive.value = true
    },

    // customButtons
    dateClick(info) {
      event.value = { ...event.value, start: info.date }
      isEventHandlerSidebarActive.value = true
    },

    /*
          Handle event drop (Also include dragged event)
          Docs: https://fullcalendar.io/docs/eventDrop
          We can use `eventDragStop` but it doesn't return updated event so we have to use `eventDrop` which returns updated event
        */
    eventDrop({ event: droppedEvent }) {
      updateEvent(extractEventDataFromEventApi(droppedEvent))
    },

    /*
          Handle event resize
          Docs: https://fullcalendar.io/docs/eventResize
        */
    eventResize({ event: resizedEvent }) {
      if (resizedEvent.start && resizedEvent.end)
        updateEvent(extractEventDataFromEventApi(resizedEvent))
    },
    customButtons: {
      drawerToggler: {
        text: 'calendarDrawerToggler',
        click() {
          isLeftSidebarOpen.value = true
        },
      },
    },
  }


  // 👉 onMounted
  onMounted(() => {
    calendarApi.value = refCalendar.value.getApi()
  })


  // 👉 Jump to date on sidebar(inline) calendar change
  const jumpToDate = currentDate => {
    calendarApi.value?.gotoDate(new Date(currentDate))
  }

  watch(() => configStore.isAppRTL, val => {
    calendarApi.value?.setOption('direction', val ? 'rtl' : 'ltr')
  }, { immediate: true })
  
  return {
    refCalendar,
    calendarOptions,
    refetchEvents,
    fetchEvents,
    addEvent,
    updateEvent,
    removeEvent,
    jumpToDate,
  }
}
