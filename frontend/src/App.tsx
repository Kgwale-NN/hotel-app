import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './components/hotel/HomePage'
import AccommodationPage from './components/accommodation/AccommodationPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/accommodations/:id" element={<AccommodationPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App