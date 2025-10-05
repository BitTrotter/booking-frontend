export default [
  {
    title: 'Dashboard',
    to: { name: 'dashboard' },
    permission: "all",
    icon: { icon: 'ri-bar-chart-2-line' },
  },
  { heading: 'Accesos',permissions: ['list_rol','list_staff'] },
  {
    title: 'Roles y Permisos',
    to: { name: 'roles-y-permisos' },
    permission: 'list_rol',
    icon: { icon: 'ri-lock-password-line' },
  },
  {
    title: 'Staffs',
    to: { name: 'staffs' },
    permission: 'list_staff',
    icon: { icon: 'ri-group-line' },
  },
  { heading: 'Gestion',permissions: ['register_veterinary','list_veterinary','register_pet','list_pet'] },
  {
    title: 'Veterinario',
    icon: { icon: 'ri-nurse-fill' },
    children: [
      {
        title: 'Registrar',
        to: 'veterinarie-add',
        permission: 'register_veterinary',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'veterinarie-list',
        permission: 'list_veterinary',
        icon: { icon: 'ri-radio-button-line' },
      },
    ],
  },
  {
    title: 'Mascotitas',
    icon: { icon: 'ri-skull-2-line' },
    children: [
      {
        title: 'Registrar',
        to: 'pet-add',
        permission: 'register_pet',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'pet-list',
        permission: 'list_pet',
        icon: { icon: 'ri-radio-button-line' },
      },
    ],
  },
  { heading: 'Agenda',permissions: ['register_appointment','list_appointment','calendar','show_payment','register_vaccionation','list_vaccionation','register_surgeries','list_surgeries','show_medical_records'] },
  {
    title: 'Citas Medicas',
    icon: { icon: 'ri-list-check-3' },
    children: [
      {
        title: 'Registrar',
        to: 'appointment-add',
        permission: 'register_appointment',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'appointment-list',
        permission: 'list_appointment',
        icon: { icon: 'ri-radio-button-line' },
      },
    ],
  },
  {
    title: 'Calendario',
    icon: { icon: 'ri-calendar-line' },
    permission: 'calendar',
    to: 'medical-record-calendar',
  },
  {
    title: 'Vacunas',
    icon: { icon: 'ri-syringe-line' },
    children: [
      {
        title: 'Registrar',
        to: 'vaccination-add',
        permission: 'register_vaccionation',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'vaccination-list',
        permission: 'list_vaccionation',
        icon: { icon: 'ri-radio-button-line' },
      },
    ],
  },
  {
    title: 'Cirugías',
    icon: { icon: 'ri-microscope-line' },
    children: [
      {
        title: 'Registrar',
        to: 'surgerie-add',
        permission: 'register_surgeries',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'surgerie-list',
        permission: 'list_surgeries',
        icon: { icon: 'ri-radio-button-line' },
      },
    ],
  },
  {
    title: 'Pagos',
    icon: { icon: 'ri-coins-line' },
    permission: 'show_payment',
    to: 'payments-list',
  },
  {
    title: 'Historial Medico',
    to: { name: 'medical-record' },
    icon: { icon: 'ri-draft-line' },
    permission: 'show_medical_records',
  },

  // {
  //   title: 'Dashboards',
  //   icon: { icon: 'ri-home-smile-line' },
  //   children: [
  //     {
  //       title: 'CRM',
  //       to: 'dashboard',
  //       icon: { icon: 'ri-computer-line' },
  //     },
  //     {
  //       title: 'Analytics',
  //       to: 'second-page',
  //       icon: { icon: 'ri-bar-chart-line' },
  //     },
  //     {
  //       title: 'eCommerce',
  //       to: 'second-page',
  //       icon: { icon: 'ri-shopping-cart-2-line' },
  //     },
  //     {
  //       title: 'Academy',
  //       to: 'second-page',
  //       icon: { icon: 'ri-book-open-line' },
  //     },
  //     {
  //       title: 'Logistics',
  //       to: 'second-page',
  //       icon: { icon: 'ri-truck-line' },
  //     },
  //   ],
  // },
]
