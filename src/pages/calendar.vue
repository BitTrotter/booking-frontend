<script setup>
import FullCalendar from '@fullcalendar/vue3'
import {
  blankEvent,
  useCalendar,
} from '@/plugins/calendar/useCalendar'

// Components
import CalendarEventHandler from '@/components/CalendarEventHandler.vue'
import AddReservation from '@/components/booking/AddReservation.vue'
import EditReservation from '@/components/booking/EditReservation.vue'

// 👉 Event
const event = ref(structuredClone(blankEvent))
const isEventHandlerSidebarActive = ref(false)
const isAddReservationDialogVisible = ref(false)
const isEditReservationDialogVisible = ref(false)
const selectedReservation = ref(null)
const addReservationInitial = ref({})
const currentDate = ref(new Date())

watch(isEventHandlerSidebarActive, val => {
  if (!val)
    event.value = structuredClone(blankEvent)
})

const { isLeftSidebarOpen } = useResponsiveLeftSidebar()

const openReservationForDate = info => {
  addReservationInitial.value = {
    start_date: info.date,
    end_date: info.date,
  }
  isAddReservationDialogVisible.value = true
}

const openReservationForEvent = reservation => {
  selectedReservation.value = reservation
  isEditReservationDialogVisible.value = true
}

const jumpToToday = () => {
  if (refCalendar.value?.getApi())
    refCalendar.value.getApi().today()
}

// 👉 useCalendar
const { refCalendar, calendarOptions, addEvent, updateEvent, removeEvent, jumpToDate, refetchEvents } = useCalendar(
  event,
  isEventHandlerSidebarActive,
  isLeftSidebarOpen,
  {
    onEventClick: openReservationForEvent,
    onDateClick: openReservationForDate,
  },
)

</script>
<template>
  <div class="calendar-page">
    <VCard class="border-0 shadow-none mb-4">
      <VCardText class="pb-0">
        <div class="d-flex flex-wrap justify-space-between align-center gap-4 pb-4">
          <div>
            <div class="text-h4 font-weight-bold">Calendar</div>
            <div class="text-body-2 text-medium-emphasis">
              Visualize all reservations and manage availability at a glance.
            </div>
          </div>

          <div class="d-flex gap-3 align-center flex-wrap">
            <VBtn variant="tonal" prepend-icon="ri-calendar-today-line" @click="jumpToToday">
              Today
            </VBtn>

            <VBtn color="primary" prepend-icon="ri-add-line" @click="isAddReservationDialogVisible = true">
              New Reservation
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <VCard>
      <VLayout style="z-index: 0;">
        <VMain>
          <VCard flat>
            <FullCalendar ref="refCalendar" :options="calendarOptions" />
          </VCard>
        </VMain>
      </VLayout>
    </VCard>

    <CalendarEventHandler v-model:isDrawerOpen="isEventHandlerSidebarActive" :event="event" @add-event="addEvent"
      @update-event="updateEvent" @remove-event="removeEvent" />

    <AddReservation v-model:isDialogVisible="isAddReservationDialogVisible" :initial-reservation="addReservationInitial"
      @reservation-created="refetchEvents" />

    <EditReservation v-model:isDialogVisible="isEditReservationDialogVisible" :reservation="selectedReservation"
      @reservation-updated="refetchEvents" />
  </div>
</template>
<style lang="scss">
@use "@core/scss/template/libs/full-calendar";

.calendars-checkbox {
  .v-label {
    color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
    opacity: var(--v-high-emphasis-opacity);
  }
}

.calendar-add-event-drawer {
  &.v-navigation-drawer:not(.v-navigation-drawer--temporary) {
    border-end-start-radius: 0.375rem;
    border-start-start-radius: 0.375rem;
  }
}

.calendar-date-picker {
  display: none;

  +.flatpickr-input {
    +.flatpickr-calendar.inline {
      border: none;
      box-shadow: none;

      .flatpickr-months {
        border-block-end: none;
      }
    }
  }

  &~.flatpickr-calendar .flatpickr-weekdays {
    margin-block: 0 4px;
  }
}
</style>

<style lang="scss" scoped>
.v-layout {
  overflow: visible !important;

  .v-card {
    overflow: visible;
  }
}
</style>