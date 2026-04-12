import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Restaurant from './pages/Restaurant'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import ShopkeeperDashboard from './pages/ShopkeeperDashboard'
import DriverDashboard from './pages/DriverDashboard'

function PrivateRoute({ children, roles }) {
  const { isAuth, user, loading } = useAuth()
  if (loading) return <div className="loading-spinner"><div className="spinner"/></div>
  if (!isAuth) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { isAuth, user } = useAuth()

  const defaultRedirect = () => {
    if (!isAuth) return '/login'
    if (user?.role === 'restaurant') return '/shopkeeper'
    if (user?.role === 'delivery')   return '/driver'
    return '/'
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login"    element={isAuth ? <Navigate to={defaultRedirect()} /> : <Login />} />
        <Route path="/register" element={isAuth ? <Navigate to={defaultRedirect()} /> : <Register />} />
        <Route path="/restaurant/:id" element={<Restaurant />} />
        <Route path="/cart"     element={<PrivateRoute roles={['customer','admin']}><Cart /></PrivateRoute>} />
        <Route path="/orders"   element={<PrivateRoute roles={['customer','admin']}><Orders /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute roles={['customer','admin']}><OrderDetail /></PrivateRoute>} />
        <Route path="/shopkeeper" element={<PrivateRoute roles={['restaurant']}><ShopkeeperDashboard /></PrivateRoute>} />
        <Route path="/driver"     element={<PrivateRoute roles={['delivery']}><DriverDashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}
