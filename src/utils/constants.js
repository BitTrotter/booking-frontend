export const COOKIE_MAX_AGE_1_YEAR = 365 * 24 * 60 * 60

export const PERMISOS = [
  {
    name: 'Dashboard',
    permisos: [
      {
        name: 'Charts & Reports',
        permiso: 'show_dashboard_reports',
      }
    ],
  },
  {
    name: 'Roles & Permissions',
    permisos: [
      {
        name: 'Create',
        permiso: 'create_role'
      },
      {
        name: 'List',
        permiso: 'list_role'
      },
      {
        name: 'Edit',
        permiso: 'edit_role'
      },
      {
        name: 'Delete',
        permiso: 'delete_role'
      }
    ]
  },
  {
    name: 'Users / Staff',
    permisos: [
      {
        name: 'Create',
        permiso: 'create_staff'
      },
      {
        name: 'List',
        permiso: 'list_staff'
      },
      {
        name: 'Edit',
        permiso: 'edit_staff'
      },
      {
        name: 'Delete',
        permiso: 'delete_staff'
      }
    ]
  },
  {
    name: 'Cabins',
    permisos: [
      {
        name: 'Create',
        permiso: 'create_cabin'
      },
      {
        name: 'List',
        permiso: 'list_cabin'
      },
      {
        name: 'Edit',
        permiso: 'edit_cabin'
      },
      {
        name: 'Delete',
        permiso: 'delete_cabin'
      },
      {
        name: 'Details',
        permiso: 'show_cabin_details'
      }
    ]
  },
  {
    name: 'Reservations',
    permisos: [
      {
        name: 'Create',
        permiso: 'create_reservation'
      },
      {
        name: 'List',
        permiso: 'list_reservation'
      },
      {
        name: 'Edit',
        permiso: 'edit_reservation'
      },
      {
        name: 'Cancel',
        permiso: 'cancel_reservation'
      },
      {
        name: 'View Details',
        permiso: 'show_reservation_details'
      }
    ]
  },
  {
    name: 'Guests',
    permisos: [
      {
        name: 'Create',
        permiso: 'create_guest'
      },
      {
        name: 'List',
        permiso: 'list_guest'
      },
      {
        name: 'Edit',
        permiso: 'edit_guest'
      },
      {
        name: 'Delete',
        permiso: 'delete_guest'
      },
      {
        name: 'Profile',
        permiso: 'show_guest_profile'
      }
    ]
  },
  {
    name: 'Payments',
    permisos: [
      {
        name: 'List',
        permiso: 'list_payment'
      },
      {
        name: 'Refund',
        permiso: 'refund_payment'
      },
      {
        name: 'Details',
        permiso: 'show_payment_details'
      }
    ]
  }
];
