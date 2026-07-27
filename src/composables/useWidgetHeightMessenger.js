import { nextTick, onBeforeUnmount, onMounted, ref, unref } from 'vue'

const MESSAGE_TYPE = 'widget-height'
const WIDGET_PARENT_ORIGIN = import.meta.env.VITE_WIDGET_PARENT_ORIGIN

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const getParentOrigin = () => {
  if (WIDGET_PARENT_ORIGIN)
    return WIDGET_PARENT_ORIGIN

  if (isBrowser())
    return window.location.origin

  return ''
}

const getVisibleRectBottom = element => {
  if (!element || !element.getBoundingClientRect)
    return 0

  const rect = element.getBoundingClientRect()
  if (!Number.isFinite(rect.bottom))
    return 0

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden')
    return 0

  if (rect.width === 0 && rect.height === 0)
    return 0

  return rect.bottom + window.scrollY
}

const collectMeasuredElements = widgetRoot => {
  const elements = []
  const rootElement = unref(widgetRoot)

  if (rootElement) {
    elements.push(rootElement)
    elements.push(...rootElement.querySelectorAll('*'))
  }

  for (const calendarElement of document.querySelectorAll('.flatpickr-calendar')) {
    elements.push(calendarElement)
    elements.push(...calendarElement.querySelectorAll('*'))
  }

  return elements
}

const measureWidgetHeight = widgetRoot => {
  if (!isBrowser())
    return 0

  const rootElement = unref(widgetRoot)

  const candidates = [
    rootElement?.scrollHeight,
    rootElement?.offsetHeight,
    getVisibleRectBottom(rootElement),
  ].filter(value => Number.isFinite(value) && value > 0)

  for (const element of collectMeasuredElements(widgetRoot))
    candidates.push(getVisibleRectBottom(element))

  return Math.ceil(Math.max(0, ...candidates))
}

export const useWidgetHeightMessenger = widgetRoot => {
  const lastSentHeight = ref(0)
  const resizeObserver = ref(null)
  const mutationObserver = ref(null)
  const rafHandle = ref(0)

  const postHeight = height => {
    if (!isBrowser())
      return

    if (window.parent === window)
      return

    if (height <= 0 || height === lastSentHeight.value)
      return

    lastSentHeight.value = height
    window.parent.postMessage(
      {
        type: MESSAGE_TYPE,
        height,
      },
      getParentOrigin(),
    )
  }

  const sendWidgetHeight = () => {
    postHeight(measureWidgetHeight(widgetRoot))
  }

  const scheduleWidgetHeightSend = () => {
    if (!isBrowser())
      return

    if (rafHandle.value)
      cancelAnimationFrame(rafHandle.value)

    rafHandle.value = requestAnimationFrame(() => {
      rafHandle.value = requestAnimationFrame(() => {
        nextTick(() => {
          sendWidgetHeight()
        })
      })
    })
  }

  const stopObservers = () => {
    resizeObserver.value?.disconnect()
    mutationObserver.value?.disconnect()

    if (rafHandle.value)
      cancelAnimationFrame(rafHandle.value)

    resizeObserver.value = null
    mutationObserver.value = null
    rafHandle.value = 0
  }

  onMounted(() => {
    if (!isBrowser())
      return

    sendWidgetHeight()

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver.value = new ResizeObserver(() => {
        scheduleWidgetHeightSend()
      })

      const observedElements = [
        unref(widgetRoot),
        document.body,
        document.documentElement,
      ].filter(Boolean)

      observedElements.forEach(element => {
        resizeObserver.value.observe(element)
      })
    }

    if (typeof MutationObserver !== 'undefined') {
      mutationObserver.value = new MutationObserver(() => {
        scheduleWidgetHeightSend()
      })

      if (document.body) {
        mutationObserver.value.observe(document.body, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: ['class', 'style'],
        })
      }
    }

    window.addEventListener('resize', scheduleWidgetHeightSend, { passive: true })

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        scheduleWidgetHeightSend()
      }).catch(() => {})
    }

    scheduleWidgetHeightSend()
  })

  onBeforeUnmount(() => {
    stopObservers()

    if (isBrowser())
      window.removeEventListener('resize', scheduleWidgetHeightSend)
  })

  return {
    sendWidgetHeight,
    scheduleWidgetHeightSend,
  }
}
