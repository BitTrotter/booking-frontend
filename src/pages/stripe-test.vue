<script setup>
import { $api } from '@/utils/api'

definePage({
  meta: {
    action: 'read',
    subject: 'all',
  },
})

// ---------- Stripe Public Key ----------
const stripePublicKey = ref('')

// ---------- Payment Intent ----------
const reservationId = ref('')
const paymentIntent = ref(null)
const isLoadingIntent = ref(false)

// ---------- Stripe Elements ----------
let stripe = null
let cardElement = null
const isStripeReady = ref(false)
const isLoadingStripe = ref(false)
const isPayLoading = ref(false)
const cardElementMounted = ref(false)

// ---------- Logs ----------
const logs = ref([])

function addLog(message, type = 'info') {
  logs.value.unshift({ message, type, time: new Date().toLocaleTimeString() })
}

// ---------- Load Stripe.js ----------
function loadStripeJs() {
  return new Promise((resolve, reject) => {
    if (window.Stripe) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Stripe.js'))
    document.head.appendChild(script)
  })
}

// ---------- Step 1: Create Payment Intent ----------
async function createPaymentIntent() {
  if (!stripePublicKey.value.startsWith('pk_')) {
    addLog('Stripe Public Key inválida. Debe empezar con pk_test_ o pk_live_', 'error')
    return
  }
  if (!reservationId.value) {
    addLog('Ingresa un reservation_id', 'error')
    return
  }

  try {
    isLoadingIntent.value = true
    addLog(`Creando Payment Intent para reservation_id: ${reservationId.value}…`, 'info')

    const data = await $api('payments/intent', {
      method: 'POST',
      body: { reservation_id: Number(reservationId.value) },
    })

    paymentIntent.value = data
    addLog(`Payment Intent creado ✓  |  id: ${data.payment_intent_id}  |  monto: ${data.amount} ${data.currency.toUpperCase()}`, 'success')

    await mountCardElement()
  } catch (err) {
    addLog(`Error al crear Payment Intent: ${err.message ?? err}`, 'error')
  } finally {
    isLoadingIntent.value = false
  }
}

// ---------- Step 2: Mount Card Element ----------
async function mountCardElement() {
  try {
    isLoadingStripe.value = true
    addLog('Cargando Stripe.js…', 'info')

    await loadStripeJs()
    stripe = window.Stripe(stripePublicKey.value)

    const elements = stripe.elements()
    cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#424770',
          '::placeholder': { color: '#aab7c4' },
        },
        invalid: { color: '#9e2146' },
      },
    })

    await nextTick()
    const mountTarget = document.getElementById('card-element')
    if (mountTarget) {
      cardElement.mount('#card-element')
      cardElementMounted.value = true
      isStripeReady.value = true
      addLog('Stripe Elements montado ✓ — ingresa los datos de la tarjeta', 'success')
    }
  } catch (err) {
    addLog(`Error montando Stripe: ${err.message ?? err}`, 'error')
  } finally {
    isLoadingStripe.value = false
  }
}

// ---------- Step 3: Confirm Payment ----------
async function pay() {
  if (!stripe || !cardElement || !paymentIntent.value) return

  try {
    isPayLoading.value = true
    addLog('Confirmando pago con Stripe…', 'info')

    const { paymentIntent: pi, error } = await stripe.confirmCardPayment(
      paymentIntent.value.client_secret,
      { payment_method: { card: cardElement } },
    )

    if (error) {
      addLog(`Error de pago: ${error.message}`, 'error')
    } else if (pi.status === 'succeeded') {
      addLog(`Pago exitoso ✓  |  status: ${pi.status}  |  id: ${pi.id}`, 'success')
    } else if (pi.status === 'requires_action') {
      addLog(`Acción requerida (3D Secure)  |  status: ${pi.status}`, 'warning')
    } else {
      addLog(`Status: ${pi.status}`, 'info')
    }
  } catch (err) {
    addLog(`Error inesperado: ${err.message ?? err}`, 'error')
  } finally {
    isPayLoading.value = false
  }
}

// ---------- Reset ----------
function reset() {
  paymentIntent.value = null
  isStripeReady.value = false
  cardElementMounted.value = false
  if (cardElement) { cardElement.unmount(); cardElement = null }
  stripe = null
  logs.value = []
  addLog('Reset completado — listo para una nueva prueba', 'info')
}
function fillKey() {
  stripePublicKey.value = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
}
function copyTestCard() {
  const testCard = '4242 4242 4242 4242'
  navigator.clipboard.writeText(testCard)
    .then(() => addLog('Número de tarjeta de prueba copiado al portapapeles ✓', 'success'))
    .catch(err => addLog(`Error al copiar tarjeta: ${err.message ?? err}`, 'error'))
}

const logColor = { success: 'success', error: 'error', warning: 'warning', info: 'info' }
</script>

<template>
  <VRow>
    <VCol cols="12">
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <div class="text-h4 font-weight-bold">Stripe Payment Test</div>
          <div class="text-body-2 text-medium-emphasis">
            Prueba el flujo completo de pagos: Payment Intent → Card Element → Confirm
          </div>
        </div>
        <VBtn variant="tonal" color="secondary" prepend-icon="ri-refresh-line" @click="reset">
          Reset
        </VBtn>
      </div>
    </VCol>

    <!-- ── Left column: steps ── -->
    <VCol cols="12" md="7">

      <!-- Step 0: Stripe Key -->
      <VCard class="mb-4">
        <VCardItem>
          <template #prepend>
            <VAvatar color="primary" variant="tonal" rounded>
              <VIcon icon="ri-key-line" />
            </VAvatar>
          </template>
          <div>
            <div>

              <VCardTitle>Stripe Public Key</VCardTitle>
              <VCardSubtitle>Ingresa tu clave pk_test_… para no hardcodearla</VCardSubtitle>
            </div>
            <VBtn color="primary" @click="fillKey()">fill key</VBtn>
          </div>
        </VCardItem>
        <VCardText>
          <VTextField v-model="stripePublicKey" label="Public Key" placeholder="pk_test_xxxxxxxxxxxxxxxxxxxx"
            prepend-inner-icon="ri-lock-password-line" :type="stripePublicKey.length > 20 ? 'password' : 'text'"
            hide-details density="comfortable" />
        </VCardText>
      </VCard>

      <!-- Step 1: Payment Intent -->
      <VCard class="mb-4">
        <VCardItem>
          <template #prepend>
            <VAvatar color="info" variant="tonal" rounded>
              <span class="text-body-1 font-weight-bold">1</span>
            </VAvatar>
          </template>
          <VCardTitle>Crear Payment Intent</VCardTitle>
          <VCardSubtitle>POST /api/payments/intent</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VRow align="center">
            <VCol cols="12" sm="8">
              <VTextField v-model="reservationId" label="reservation_id" placeholder="ej. 12" type="number"
                prepend-inner-icon="ri-calendar-check-line" hide-details density="comfortable"
                :disabled="!!paymentIntent" />
            </VCol>
            <VCol cols="12" sm="4">
              <VBtn block color="info" :loading="isLoadingIntent" :disabled="!!paymentIntent"
                @click="createPaymentIntent">
                Crear Intent
              </VBtn>
            </VCol>
          </VRow>

          <VAlert v-if="paymentIntent" class="mt-4" type="success" variant="tonal" density="compact">
            <div class="text-caption">
              <strong>ID:</strong> {{ paymentIntent.payment_intent_id }}<br>
              <strong>Monto:</strong> {{ paymentIntent.amount }} {{ paymentIntent.currency.toUpperCase() }}<br>
              <strong>Reservación:</strong> {{ paymentIntent.reservation_id }}
            </div>
          </VAlert>
        </VCardText>
      </VCard>

      <!-- Step 2: Card Element -->
      <VCard class="mb-4">
        <VCardItem>
          <template #prepend>
            <VAvatar color="warning" variant="tonal" rounded>
              <span class="text-body-1 font-weight-bold">2</span>
            </VAvatar>
          </template>
          <VCardTitle>Datos de Tarjeta</VCardTitle>
          <VCardSubtitle>Stripe Card Element</VCardSubtitle>

          <VBtn variant="plain" @click="copyTestCard()" class="ms-auto">
            copy test card
          </VBtn>
        </VCardItem>
        <VCardText>
          <div v-if="!paymentIntent" class="text-medium-emphasis text-body-2">
            Completa el paso 1 primero.
          </div>

          <div v-else>
            <VProgressLinear v-if="isLoadingStripe" indeterminate color="warning" class="mb-3" />

            <!-- Stripe mounts the card input here -->
            <div id="card-element" class="stripe-card-element" :class="{ 'stripe-card-ready': cardElementMounted }" />

            <div v-if="cardElementMounted" class="text-caption text-medium-emphasis mt-2">
              Tarjeta de prueba: <strong>4242 4242 4242 4242</strong> — cualquier fecha futura y CVC
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Step 3: Pay button -->
      <VCard class="mb-4">
        <VCardItem>
          <template #prepend>
            <VAvatar color="success" variant="tonal" rounded>
              <span class="text-body-1 font-weight-bold">3</span>
            </VAvatar>
          </template>
          <VCardTitle>Confirmar Pago</VCardTitle>
          <VCardSubtitle>stripe.confirmCardPayment(clientSecret, { card })</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VBtn block color="success" size="large" prepend-icon="ri-secure-payment-line" :loading="isPayLoading"
            :disabled="!isStripeReady" @click="pay">
            Pagar
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>

    <!-- ── Right column: log panel ── -->
    <VCol cols="12" md="5">
      <VCard height="100%">
        <VCardItem>
          <template #prepend>
            <VAvatar color="secondary" variant="tonal" rounded>
              <VIcon icon="ri-terminal-box-line" />
            </VAvatar>
          </template>
          <VCardTitle>Panel de Estado</VCardTitle>
          <VCardSubtitle>Logs en tiempo real</VCardSubtitle>
        </VCardItem>
        <VCardText class="pa-2" style="max-block-size: 520px; overflow-y: auto;">
          <div v-if="logs.length === 0" class="text-medium-emphasis text-body-2 pa-3">
            Los eventos aparecerán aquí…
          </div>
          <VList density="compact">
            <VListItem v-for="(log, i) in logs" :key="i" class="rounded mb-1 log-item" :class="`log-${log.type}`">
              <template #prepend>
                <VIcon :icon="log.type === 'success' ? 'ri-checkbox-circle-line'
                  : log.type === 'error' ? 'ri-error-warning-line'
                    : log.type === 'warning' ? 'ri-alert-line'
                      : 'ri-information-line'" :color="logColor[log.type]" size="18" class="me-2" />
              </template>
              <VListItemTitle class="text-body-2 text-wrap">{{ log.message }}</VListItemTitle>
              <VListItemSubtitle class="text-caption">{{ log.time }}</VListItemSubtitle>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.stripe-card-element {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 14px 12px;
  background: rgb(var(--v-theme-surface));
  min-block-size: 48px;
  transition: border-color 0.2s;
}

.stripe-card-ready {
  border-color: rgba(var(--v-theme-primary), 0.6);
}

.log-success {
  background: rgba(var(--v-theme-success), 0.08);
}

.log-error {
  background: rgba(var(--v-theme-error), 0.08);
}

.log-warning {
  background: rgba(var(--v-theme-warning), 0.08);
}

.log-info {
  background: rgba(var(--v-theme-info), 0.06);
}
</style>
