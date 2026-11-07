import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './components/hotel/HomePage'
import AuthReturn from './components/auth/AuthReturn'
import PaymentReturn from './components/payments/PaymentReturn'
import AccommodationPage from './components/accommodation/AccommodationPage'
import AccommodationSearch from './components/accommodation/AccommodationSearch'
import MyBookings from './components/profile/MyBookings'
import AccountPageLayout from './components/profile/AccountPageLayout'
import SettingsPage from './components/profile/SettingsPage'
import ProfilePage from './components/profile/ProfilePage'
import NotificationsPage from './components/profile/NotificationsPage'
import MyFavourites from './components/profile/MyFavourites'
import AdminReservations from './components/admin/AdminReservations'
import AdminAccommodations from './components/admin/AdminAccommodations'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import { AdminProfile, AdminSettings } from './components/admin/AdminAccount'
import AdminUpdates from './components/admin/AdminUpdates'

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
          <Route path="updates" element={<AdminUpdates />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App