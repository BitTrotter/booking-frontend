export default [
  {
    title: 'Dashboard',
    to: { name: 'dashboard' },
    icon: { icon: 'ri-bar-chart-2-line' },
  },
  { heading: 'Accesos' },
  {
    title: 'Roles y Permisos',
    to: { name: 'roles' },
    icon: { icon: 'ri-lock-password-line' },
  },
  {
    title: 'Staffs',
    to: { name: 'second-page' },
    icon: { icon: 'ri-group-line' },
  },
  { heading: 'Gestion' },
  {
    title: 'Veterinario',
    icon: { icon: 'ri-nurse-fill' },
    children: [
      {
        title: 'Registrar',
        to: 'second-page',
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
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
        icon: { icon: 'ri-radio-button-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
        icon: { icon: 'ri-radio-button-line' },
      },
    ],
  },
  { heading: 'Agenda' },
  {
    title: 'Citas Medicas',
    icon: { icon: 'ri-list-check-3' },
    children: [
      {
        title: 'Registrar',
        to: 'second-page',
        icon: { icon: 'ri-computer-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
        icon: { icon: 'ri-bar-chart-line' },
      },
    ],
  },
  {
    title: 'Calendario',
    icon: { icon: 'ri-calendar-line' },
    to: 'second-page',
  },
  {
    title: 'Pagos',
    icon: { icon: 'ri-coins-line' },
    to: 'second-page',
  },
  {
    title: 'Vacunas',
    icon: { icon: 'ri-syringe-line' },
    children: [
      {
        title: 'Registrar',
        to: 'second-page',
        icon: { icon: 'ri-computer-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
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
        icon: { icon: 'ri-computer-line' },
      },
      {
        title: 'Listado',
        to: 'second-page',
        icon: { icon: 'ri-bar-chart-line' },
      },
    ],
  },
  {
    title: 'Historial Medico',
    to: { name: 'second-page' },
    icon: { icon: 'ri-draft-line' },
  },

  // {
  //   title: 'second-pages',
  //   icon: { icon: 'ri-home-smile-line' },
  //   children: [
  //     {
  //       title: 'CRM',
  //       to: 'second-page',
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
