export default [
  {
    title: 'Home',
    to: { name: 'dashboard' },
    icon: { icon: 'ri-bar-chart-2-line' },
  },
  { heading: 'Super Admin' },
  {
    title: 'Roles y Permisos',
    to: { name: 'roles' },
    icon: { icon: 'ri-lock-password-line' },
    permission: 'list_role',
  },
  {
    title: 'Users',
    to: { name: 'users' },
    icon: { icon: 'ri-group-line' },
    permission: 'list_staff',
  },
  { heading: 'Gestion' },
  {
    title: 'Cabins',
    to: { name: 'cabins' },
    icon: { icon: 'ri-home-line' },
    permission: 'list_cabin',
  },
  {
    title: 'Reservations',
    to: { name: 'booking' },
    icon: { icon: 'ri-bookmark-3-line' },
    permission: 'list_reservation',
  },
  {
    title: 'Calendar',
    to: { name: 'calendar' },
    icon: { icon: 'ri-calendar-line' },
    permission: 'list_reservation',
  },
]
