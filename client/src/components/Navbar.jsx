import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

const ROLE_CONFIG = {
  customer:   { color: '#ff5252', emoji: '👤', badge: 'Customer' },
  restaurant: { color: '#ff9800', emoji: '🏪', badge: 'Shopkeeper' },
  delivery:   { color: '#4caf50', emoji: '🛵', badge: 'Driver' },
  admin:      { color: '#9c27b0', emoji: '⚙️', badge: 'Admin' },
}

export default function Navbar() {
  const { user, isAuth, logout } = useAuth()
  const { cartCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link'
  const role = user?.role || 'customer'
  const roleConf = ROLE_CONFIG[role] || ROLE_CONFIG.customer

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <span className="logo-icon">🍔</span>
          <span className="brand-text">Foodie</span>
        </Link>

        <div className="navbar-links">
          {/* Role-specific nav */}
          {!isAuth && (
            <Link to="/" className={isActive('/')}>
              <span>🏠</span><span>Home</span>
            </Link>
          )}

          {isAuth && role === 'customer' && (
            <>
              <Link to="/" className={isActive('/')}><span>🏠</span><span>Home</span></Link>
              <Link to="/orders" className={isActive('/orders')}><span>📋</span><span>Orders</span></Link>
              <Link to="/cart" className="nav-cart-btn">
                <span>🛒</span><span>Cart</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            </>
          )}

          {isAuth && role === 'restaurant' && (
            <>
              <Link to="/shopkeeper" className={isActive('/shopkeeper')}>
                <span>🏪</span><span>Dashboard</span>
              </Link>
              <Link to="/" className={isActive('/')}><span>🏠</span><span>Browse</span></Link>
            </>
          )}

          {isAuth && role === 'delivery' && (
            <Link to="/driver" className={isActive('/driver')}>
              <span>🛵</span><span>My Deliveries</span>
            </Link>
          )}

          {isAuth ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Role badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                background: `${roleConf.color}15`, border: `1px solid ${roleConf.color}30`,
                fontSize: '0.78rem', fontWeight: 700, color: roleConf.color
              }}>
                {roleConf.emoji} {user?.name?.split(' ')[0]}
              </div>
              <button id="logout-btn" className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login" className={isActive('/login')}>Login</Link>
              <Link to="/register">
                <button className="btn btn-primary btn-sm">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
