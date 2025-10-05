export default [
  {
    title: 'Dashboard',
    to: { name: 'dashboard' },
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
        to: 'second-page',
        permission: 'register_veterinary',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
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
        to: 'second-page',
        permission: 'register_pet',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
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
        to: 'second-page',
        permission: 'register_appointment',
        icon: { icon: 'ri-computer-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
        permission: 'list_appointment',
        icon: { icon: 'ri-bar-chart-line' },
      },
    ],
  },
  {
    title: 'Calendario',
    icon: { icon: 'ri-calendar-line' },
    permission: 'calendar',
    to: 'second-page',
  },
  {
    title: 'Pagos',
    icon: { icon: 'ri-coins-line' },
    permission: 'show_payment',
    to: 'second-page',
  },
  {
    title: 'Vacunas',
    icon: { icon: 'ri-syringe-line' },
    children: [
      {
        title: 'Registrar',
        to: 'second-page',
        permission: 'register_vaccionation',
        icon: { icon: 'ri-computer-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
        permission: 'list_vaccionation',
        icon: { icon: 'ri-bar-chart-line' },
      },
    ],
  },
  {
    title: 'Procedimientos quirúrgicos',
    icon: { icon: 'ri-microscope-line' },
    children: [
      {
        title: 'Registrar',
        to: 'second-page',
        permission: 'register_surgeries',
        icon: { icon: 'ri-computer-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
        permission: 'list_surgeries',
        icon: { icon: 'ri-bar-chart-line' },
      },
    ],
  },
  {
    title: 'Historial Medico',
    to: { name: 'second-page' },
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
