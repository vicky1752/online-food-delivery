import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Your order has been received', emoji: '📝' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Restaurant accepted your order', emoji: '✅' },
  { key: 'preparing', label: 'Preparing', desc: 'Chef is cooking your food', emoji: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is on the way', emoji: '🛵' },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your meal! 🎉', emoji: '🎉' },
]

const STATUS_ORDER = STATUS_STEPS.map(s => s.key)

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data)
    } catch {
      toast.error('Order not found')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  // Simulate status progression (for demo)
  const advanceStatus = async () => {
    const currentIdx = STATUS_ORDER.indexOf(order.status)
    if (currentIdx >= STATUS_ORDER.length - 1) return
    const nextStatus = STATUS_ORDER[currentIdx + 1]
    setUpdating(true)
    try {
      await api.patch(`/orders/${id}/status`, { status: nextStatus })
      await fetchOrder()
      toast.success(`Status updated to: ${nextStatus.replace(/_/g, ' ')} ✅`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="loading-spinner" style={{ paddingTop: '120px' }}><div className="spinner" /></div>

  const currentIdx = STATUS_ORDER.indexOf(order?.status)

  return (
    <div className="page-wrapper page-enter">
      <div className="container" style={{ maxWidth: 860 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>← Back</button>
          <div>
            <h1 className="section-title" style={{ fontSize: '1.4rem' }}>Order #{order?.order_id}</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {new Date(order?.created_at).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {/* Left: Status + Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Status Tracker */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📍 Order Tracking</h2>
                <span style={{
                  padding: '4px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                  background: order?.status === 'delivered' ? 'rgba(76,175,80,0.12)' : 'rgba(255,82,82,0.1)',
                  color: order?.status === 'delivered' ? 'var(--success)' : 'var(--primary)',
                  border: `1px solid ${order?.status === 'delivered' ? 'rgba(76,175,80,0.2)' : 'rgba(255,82,82,0.2)'}`
                }}>
                  {order?.status?.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <div className="status-stepper">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = idx < currentIdx
                  const isActive = idx === currentIdx
                  const isLast = idx === STATUS_STEPS.length - 1
                  return (
                    <div key={step.key} className="status-step">
                      <div className="step-indicator">
                        <div className={`step-dot ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                          {isDone ? '✓' : step.emoji}
                        </div>
                        {!isLast && <div className={`step-line ${isDone ? 'done' : ''}`} />}
                      </div>
                      <div className="step-content">
                        <div className="step-label" style={{ color: isActive ? 'var(--text-primary)' : isDone ? 'var(--success)' : 'var(--text-muted)' }}>
                          {step.label}
                        </div>
                        {(isActive || isDone) && <div className="step-desc">{step.desc}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Demo: Advance Button */}
              {order?.status !== 'delivered' && (
                <button
                  id="advance-status-btn"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 20, width: '100%' }}
                  onClick={advanceStatus}
                  disabled={updating}
                >
                  {updating ? '⏳ Updating...' : '⚡ Simulate Next Status (Demo)'}
                </button>
              )}
            </div>

            {/* Delivery Agent */}
            {order?.delivery && (
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>🛵 Delivery Agent</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem'
                  }}>🧑</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{order.delivery.agent_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📞 {order.delivery.agent_phone}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Status: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{order.delivery.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Bill Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Order Items */}
            <div className="card">
              <div style={{ padding: '20px 20px 0', fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 4 }}>
                🏪 {order?.restaurant_name}
              </div>
              {order?.items?.map(item => (
                <div key={item.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.item_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>x{item.quantity} × ₹{item.price}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{(item.quantity * item.price).toFixed(2)}</div>
                </div>
              ))}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>Subtotal</span><span>₹{Number(order?.total_amount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <span>Delivery</span><span>₹40.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span>Total Paid</span>
                  <span style={{ color: 'var(--primary)' }}>₹{(Number(order?.total_amount) + 40).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order?.status === 'delivered' && (
              <button className="btn btn-primary" onClick={() => navigate('/')}>🍔 Order Again</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
