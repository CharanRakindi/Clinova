/** Role → default home path after login/register */
export function roleHome(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'doctor') return '/doctor/dashboard';
  if (role === 'receptionist') return '/receptionist/dashboard';
  if (role === 'lab_technician') return '/labtech/dashboard';
  return '/patient/dashboard';
}
