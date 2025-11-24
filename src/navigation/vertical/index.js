export default [
  {
    title: 'Home',
    to: { name: 'index' },
    icon: { icon: 'ri-bar-chart-2-line' },
  },
  { heading: 'Super Admin' },
  {
    title: 'Roles y Permisos',
    to: { name: 'roles' },
    icon: { icon: 'ri-lock-password-line' },
  },
  {
    title: 'Users',
    to: { name: 'users' },
    icon: { icon: 'ri-group-line' },
  },
  { heading: 'Gestion' },
  {
    title: 'Cabins',
    to: { name: 'cabins' },
    icon: { icon: 'ri-home-line' },
  },
  {
    title: 'Booking',
    icon: { icon: 'ri-calendar-line' },
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
    title: 'Calendar',
    to: { name: 'users' },
    icon: { icon: 'ri-calendar-line' },
  },
    {
    title: 'Payments',
    to: { name: 'users' },
    icon: { icon: 'ri-coins-line' },
  },
 
]
