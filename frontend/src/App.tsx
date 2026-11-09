import { lazy, Suspense } from 'react'
import ToastViewport from './components/common/ToastViewport'
import EmptyState from './components/common/EmptyState'
import LoadingSkeleton from './components/common/LoadingSkeleton'
import { PageHistory } from './components/layout/NavigationHistory'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import HomePage from './components/hotel/HomePage'
const AuthReturn = lazy(() => import('./components/auth/AuthReturn'))
const PaymentReturn = lazy(() => import('./components/payments/PaymentReturn'))
const AccommodationPage = lazy(() => import('./components/accommodation/AccommodationPage'))
const AccommodationSearch = lazy(() => import('./components/accommodation/AccommodationSearch'))
const MyBookings = lazy(() => import('./components/profile/MyBookings'))
const AccountPageLayout = lazy(() => import('./components/profile/AccountPageLayout'))
const SettingsPage = lazy(() => import('./components/profile/SettingsPage'))
const ProfilePage = lazy(() => import('./components/profile/ProfilePage'))
const NotificationsPage = lazy(() => import('./components/profile/NotificationsPage'))
const MyFavourites = lazy(() => import('./components/profile/MyFavourites'))
const AdminReservations = lazy(() => import('./components/admin/AdminReservations'))
const AdminAccommodations = lazy(() => import('./components/admin/AdminAccommodations'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))
const AdminProfile = lazy(() => import('./components/admin/AdminAccount').then(module => ({ default: module.AdminProfile })))
const AdminSettings = lazy(() => import('./components/admin/AdminAccount').then(module => ({ default: module.AdminSettings })))
const AdminUpdates = lazy(() => import('./components/admin/AdminUpdates'))

function App() {
  return (
    <BrowserRouter>
      <PageHistory />
      <ToastViewport />
      <Suspense fallback={<main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}><LoadingSkeleton label="Opening page" /></main>}><Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/return" element={<AuthReturn />} />
        <Route path="/payments/return" element={<PaymentReturn />} />
        <Route path="/accommodations" element={<AccommodationSearch />} />
        <Route path="/accommodations/:id" element={<AccommodationPage />} />
        <Route path="/profile" element={<AccountPageLayout />}>
          <Route index element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="favourites" element={<MyFavourites />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="accommodations" element={<AdminAccommodations />} />
          <Route path="notifications" element={<NotificationsPage admin />} />
          <Route path="updates" element={<AdminUpdates />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<main style={{ maxWidth: 850, margin: "80px auto", padding: 20 }}><EmptyState title="This page could not be found." action={<Link to="/">Back to home</Link>}>Follow a link from the hotel homepage to continue exploring.</EmptyState></main>} />
      </Routes></Suspense>
    </BrowserRouter>
  )
}

export default App