import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { useState } from 'react'

export default function Cart() {
  const { cartItems, cartTotal, cartLoading, updateQty, removeFromCart, clearCart, fetchCart } = useCart()
  const navigate = useNavigate()
  const [placing, setPlacing] = useState(false)

  const DELIVERY_FEE = cartTotal > 0 ? 40 : 0
  const TAXES = cartTotal > 0 ? Math.round(cartTotal * 0.05) : 0
  const GRAND_TOTAL = cartTotal + DELIVERY_FEE + TAXES

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return toast.error('Your cart is empty!')
    // Check all same restaurant
    const restaurantIds = [...new Set(cartItems.map(i => i.restaurant_id))]
    if (restaurantIds.length > 1) {
      return toast.error('You can only order from one restaurant at a time!')
    }
    setPlacing(true)
    try {
      const res = await api.post('/orders')
      await clearCart()
      toast.success('Order placed successfully! 🎉')
      navigate(`/orders/${res.data.order_id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (cartLoading) return <div className="loading-spinner" style={{ paddingTop: '120px' }}><div className="spinner" /></div>

  return (
    <div className="page-wrapper page-enter">
      <div className="container">
        <div className="section-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 className="section-title">🛒 Your Cart</h1>
            <p className="section-subtitle">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''} from {cartItems[0]?.restaurant_name || '—'}</p>
          </div>
          {cartItems.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={async () => { await clearCart(); toast.success('Cart cleared') }}>
              🗑️ Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <div className="empty-title">Your cart is empty</div>
            <div className="empty-desc">Looks like you haven't added anything yet. Explore our restaurants!</div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Restaurants</button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div className="card">
              {cartItems.map(item => (
                <div key={item.cart_id} className="cart-item" id={`cart-item-${item.cart_id}`}>
                  <div className="menu-item-img-placeholder" style={{ width: 64, height: 64, borderRadius: 8 }}>🍽️</div>
                  <div style={{ flex: 1 }}>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">₹{item.price} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => updateQty(item.cart_id, item.quantity - 1)}>−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.cart_id, item.quantity + 1)}>+</button>
                    </div>
                    <span style={{ fontWeight: 700, minWidth: 64, textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeFromCart(item.cart_id)}
                      style={{ padding: '6px 10px' }}
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="cart-summary">
              <div className="cart-summary-title">Order Summary</div>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>₹{DELIVERY_FEE}</span>
              </div>
              <div className="summary-row">
                <span>Taxes (5%)</span>
                <span>₹{TAXES}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>₹{GRAND_TOTAL.toFixed(2)}</span>
              </div>
              <button
                id="place-order-btn"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '20px' }}
                onClick={handlePlaceOrder}
                disabled={placing}
              >
                {placing ? '⏳ Placing Order...' : '🚀 Place Order'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ width: '100%', marginTop: '8px' }}
                onClick={() => navigate('/')}
              >
                Add More Items
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
