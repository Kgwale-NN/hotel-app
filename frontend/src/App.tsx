import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './components/hotel/HomePage'
import AccommodationPage from './components/accommodation/AccommodationPage'
import AccommodationSearch from './components/accommodation/AccommodationSearch'
import MyBookings from './components/profile/MyBookings'
import ProfilePage from './components/profile/ProfilePage'
import MyFavourites from './components/profile/MyFavourites'
import AdminReservations from './components/admin/AdminReservations'
import AdminAccommodations from './components/admin/AdminAccommodations'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/accommodations" element={<AccommodationSearch />} />
        <Route path="/accommodations/:id" element={<AccommodationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/bookings" element={<MyBookings />} />
        <Route path="/profile/favourites" element={<MyFavourites />} />
        <Route path="/admin/reservations" element={<AdminReservations />} />
        <Route path="/admin/accommodations" element={<AdminAccommodations />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App