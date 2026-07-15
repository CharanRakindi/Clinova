/**
 * Seeded demo accounts for portfolio walkthroughs.
 * Password is always password123 after seed.
 */
export const DEMO_PASSWORD = 'password123';

export const DEMO_ACCOUNTS = [
  {
    role: 'patient',
    label: 'Patient',
    email: 'john@example.com',
    description: 'Book visits & view records',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    email: 'sarah@clinova.com',
    description: "Today's queue & charts",
  },
  {
    role: 'receptionist',
    label: 'Reception',
    email: 'receptionist@clinova.com',
    description: 'Register & schedule',
  },
  {
    role: 'lab_technician',
    label: 'Lab tech',
    email: 'labtech@clinova.com',
    description: 'Process lab orders',
  },
  {
    role: 'admin',
    label: 'Admin',
    email: 'admin@clinova.com',
    description: 'Users & audit logs',
  },
];
