import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingView from './views/LandingView'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
