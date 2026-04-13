import { useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const DELIVERY_NEXT   = { assigned: 'picked', picked: 'delivering', delivering: 'delivered' }
const DELIVERY_LABEL  = { assigned: '📦 Assigned', picked: '🏃 Picked Up', delivering: '🛵 On the Way', delivered: '✅ Delivered' }
const DELIVERY_COLOR  = { assigned: '#ff9800', picked: '#2196f3', delivering: '#9c27b0', delivered: '#4caf50' }
const DELIVERY_ACTION = { assigned: '🏃 Pick Up Order', picked: '🛵 Start Delivery', delivering: '✅ Mark Delivered' }

export default function DriverDashboard() {
  const [profile, setProfile] = useState(null)
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [activeTab, setActiveTab] = useState('active')
  const [needsSetup, setNeedsSetup] = useState(false)
  const [setupData, setSetupData] = useState({ phone: '' })

  const fetchAll = async () => {
    try {
      setLoading(true);
      const profRes = await api.get('/driver/profile');
      setProfile(profRes.data);
      setNeedsSetup(false);

      const delRes = await api.get('/driver/deliveries');
      setDeliveries(delRes.data.deliveries || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setNeedsSetup(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to load driver dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/driver/profile', setupData);
      toast.success('Profile created successfully!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create profile');
    }
  };

  const handleStatusUpdate = async (delivery_id, newStatus) => {
    setUpdatingId(delivery_id)
    try {
      await api.patch(`/driver/deliveries/${delivery_id}/status`, { status: newStatus })
      toast.success(`Delivery updated → ${newStatus.replace(/_/g, ' ')} ✅`)
      await fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleAvailability = async () => {
    try {
      const res = await api.patch('/driver/toggle-availability')
      setProfile(p => ({ ...p, available: res.data.available }))
      toast.success(res.data.available ? '🟢 You are now AVAILABLE' : '🔴 You are now OFFLINE')
    } catch { toast.error('Failed to update availability') }
  }

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered')
  const pastDeliveries   = deliveries.filter(d => d.status === 'delivered')

  if (loading) return <div className="loading-spinner" style={{ paddingTop: '120px' }}><div className="spinner" /></div>

  if (needsSetup) {
    return (
      <div className="page-wrapper page-enter">
        <div className="container" style={{ maxWidth: 500, paddingTop: '100px' }}>
          <div className="card" style={{ padding: '30px' }}>
            <h2 style={{ marginBottom: 20 }}>Setup Driver Profile</h2>
            <form onSubmit={handleSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>Contact Number (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. 9876543210 (Leave blank to use account phone)" value={setupData.phone} onChange={e => setSetupData({...setupData, phone: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>Complete Setup</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper page-enter">
      <div className="container">
        {/* Driver Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: profile?.available
                ? 'linear-gradient(135deg, #4caf50, #388e3c)'
                : 'linear-gradient(135deg, #555, #333)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', boxShadow: profile?.available ? '0 0 20px rgba(76,175,80,0.4)' : 'none'
            }}>🛵</div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>{profile?.name}</h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>📞 {profile?.phone}</span>
                <span className={profile?.available ? 'badge-open' : 'badge-closed'}>
                  {profile?.available ? '● Online' : '● Offline'}
                </span>
              </div>
            </div>
          </div>
          <button
            id="toggle-availability-btn"
            onClick={handleToggleAvailability}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem', transition: 'var(--transition)',
              background: profile?.available ? 'rgba(244,67,54,0.12)' : 'linear-gradient(135deg,#4caf50,#388e3c)',
              color: profile?.available ? '#f44336' : 'white'
            }}
          >
            {profile?.available ? '🔴 Go Offline' : '🟢 Go Online'}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Active',    value: activeDeliveries.length, icon: '🔥', color: '#ff5252' },
            { label: 'Completed', value: pastDeliveries.length,   icon: '✅', color: '#4caf50' },
            { label: 'Total',     value: deliveries.length,       icon: '📦', color: '#2196f3' },
            { label: 'Earnings',  value: `₹${pastDeliveries.length * 50}`, icon: '💰', color: '#ff9800' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {[
            { key: 'active', label: `🔥 Active (${activeDeliveries.length})` },
            { key: 'history', label: `✅ Completed (${pastDeliveries.length})` },
          ].map(tab => (
            <button key={tab.key} id={`driver-tab-${tab.key}`} onClick={() => setActiveTab(tab.key)} style={{
              padding: '10px 20px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #4caf50' : '2px solid transparent',
              color: activeTab === tab.key ? '#4caf50' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem',
              transition: 'var(--transition)'
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Active Deliveries */}
        {activeTab === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeDeliveries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛵</div>
                <div className="empty-title">No active deliveries</div>
                <div className="empty-desc">{profile?.available ? 'Stay online — orders will be assigned soon!' : 'Go online to receive delivery assignments'}</div>
                {!profile?.available && (
                  <button className="btn btn-primary" onClick={handleToggleAvailability} style={{ marginTop: 16, background: 'linear-gradient(135deg,#4caf50,#388e3c)' }}>
                    🟢 Go Online Now
                  </button>
                )}
              </div>
            ) : activeDeliveries.map(del => (
              <div key={del.delivery_id} className="card" style={{ padding: 24, borderLeft: `4px solid ${DELIVERY_COLOR[del.status]}` }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                      Order #{del.order_id} — {del.restaurant_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(del.order_placed_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700,
                    background: `${DELIVERY_COLOR[del.status]}20`, color: DELIVERY_COLOR[del.status],
                    border: `1px solid ${DELIVERY_COLOR[del.status]}40`, alignSelf: 'flex-start'
                  }}>{DELIVERY_LABEL[del.status]}</span>
                </div>

                {/* Customer Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Customer</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>👤 {del.customer_name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>📞 {del.customer_phone}</div>
                  </div>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-card2)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Bill</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#4caf50' }}>₹{Number(del.total_amount).toFixed(2)}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cash on delivery</div>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {del.items?.map((item, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem',
                      background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-secondary)'
                    }}>
                      {item.item_name} ×{item.quantity}
                    </span>
                  ))}
                </div>

                {/* Action */}
                {DELIVERY_NEXT[del.status] && (
                  <button
                    id={`delivery-action-${del.delivery_id}`}
                    className="btn btn-primary"
                    onClick={() => handleStatusUpdate(del.delivery_id, DELIVERY_NEXT[del.status])}
                    disabled={updatingId === del.delivery_id}
                    style={{ width: '100%', background: `linear-gradient(135deg, ${DELIVERY_COLOR[DELIVERY_NEXT[del.status]]}, ${DELIVERY_COLOR[DELIVERY_NEXT[del.status]]}cc)` }}
                  >
                    {updatingId === del.delivery_id ? '⏳ Updating...' : DELIVERY_ACTION[del.status]}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Delivery History */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastDeliveries.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">✅</div><div className="empty-title">No completed deliveries yet</div></div>
            ) : pastDeliveries.map(del => (
              <div key={del.delivery_id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Order #{del.order_id} · {del.restaurant_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {del.customer_name} · {new Date(del.order_placed_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="badge-open">✅ Delivered</span>
                    <span style={{ fontWeight: 800, color: '#4caf50' }}>+₹50</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
