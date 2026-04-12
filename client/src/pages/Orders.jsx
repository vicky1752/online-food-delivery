import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const STATUS_STYLES = {
  placed: 'status-placed', confirmed: 'status-confirmed',
  preparing: 'status-preparing', out_for_delivery: 'status-out_for_delivery',
  delivered: 'status-delivered'
}

const STATUS_EMOJI = {
  placed: '📝', confirmed: '✅', preparing: '👨‍🍳',
  out_for_delivery: '🛵', delivered: '🎉'
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/orders/my').then(r => setOrders(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-spinner" style={{ paddingTop: '120px' }}><div className="spinner" /></div>

  return (
    <div className="page-wrapper page-enter">
      <div className="container">
        <div className="section-header" style={{ marginBottom: '32px' }}>
          <div>
            <h1 className="section-title">📋 Your Orders</h1>
            <p className="section-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No orders yet</div>
            <div className="empty-desc">Your order history will appear here once you place your first order.</div>
            <button className="btn btn-primary" onClick={() => navigate('/')}>Order Now</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map(order => (
              <div
                key={order.order_id}
                id={`order-${order.order_id}`}
                className="order-card"
                onClick={() => navigate(`/orders/${order.order_id}`)}
              >
                <div className="order-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      {order.restaurant_image && (
                        <img src={order.restaurant_image} alt="restaurant" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{order.restaurant_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Order #{order.order_id} · {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className={`order-status-badge ${STATUS_STYLES[order.status]}`}>
                      {STATUS_EMOJI[order.status]} {order.status.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                      ₹{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Click to view details & track order →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
