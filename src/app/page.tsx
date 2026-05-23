import { redirect } from 'next/navigation';

/*
 * Root route. The (auth) and (app) groups own the real surfaces, so /
 * just bounces to /home — AuthGate handles the redirect to /login when
 * the user is unauthenticated.
 */
export default function RootPage() {
  redirect('/employee/home');
}
