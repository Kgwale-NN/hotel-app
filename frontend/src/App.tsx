import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './components/hotel/HomePage'
import AccommodationPage from './components/accommodation/AccommodationPage'
import MyBookings from './components/profile/MyBookings'
import MyFavourites from './components/profile/MyFavourites'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/accommodations/:id" element={<AccommodationPage />} />
        <Route path="/profile/bookings" element={<MyBookings />} />
        <Route path="/profile/favourites" element={<MyFavourites />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App