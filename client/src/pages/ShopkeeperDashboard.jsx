import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import toast from 'react-hot-toast'

const ORDER_STATUSES = ['placed', 'confirmed', 'preparing', 'out_for_delivery']
const STATUS_NEXT = { placed: 'confirmed', confirmed: 'preparing', preparing: 'out_for_delivery' }
const STATUS_LABEL = { placed: '📝 Placed', confirmed: '✅ Confirmed', preparing: '👨‍🍳 Preparing', out_for_delivery: '🛵 Out for Delivery', delivered: '🎉 Delivered' }
const STATUS_COLOR = { placed: '#ff9800', confirmed: '#2196f3', preparing: '#ff9800', out_for_delivery: '#9c27b0', delivered: '#4caf50' }

export default function ShopkeeperDashboard() {
  const [restaurant, setRestaurant] = useState(null)
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
  const [updatingId, setUpdatingId] = useState(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [setupData, setSetupData] = useState({ name: '', cuisine: '', address: '', image_url: '' })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editData, setEditData] = useState({ name: '', cuisine: '', image_url: '' })
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: '', image_url: '' })
  const navigate = useNavigate()

  const fetchAll = async () => {
    try {
      setLoading(true);
      const restRes = await api.get('/shopkeeper/my-restaurant');
      setRestaurant(restRes.data);
      setNeedsSetup(false);

      const [ordersRes, menuRes] = await Promise.all([
        api.get('/shopkeeper/orders'),
        api.get('/shopkeeper/menu'),
      ]);
      setOrders(ordersRes.data.orders || []);
      setMenuItems(menuRes.data || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setNeedsSetup(true);
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shopkeeper/restaurant', setupData);
      toast.success('Restaurant created successfully!');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create restaurant');
    }
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      await api.patch('/shopkeeper/my-restaurant', editData);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shopkeeper/menu', newItem);
      toast.success('Menu item added!');
      setAddingItem(false);
      setNewItem({ name: '', description: '', price: '', category: '', image_url: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add item');
    }
  };

  const handleStatusUpdate = async (order_id, newStatus) => {
    setUpdatingId(order_id)
    try {
      await api.patch(`/shopkeeper/orders/${order_id}/status`, { status: newStatus })
      toast.success(`Order #${order_id} → ${newStatus.replace(/_/g, ' ')} ✅`)
      await fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleOpen = async () => {
    try {
      const res = await api.patch('/shopkeeper/toggle-open')
      setRestaurant(r => ({ ...r, is_open: res.data.is_open }))
      toast.success(res.data.is_open ? '🟢 Restaurant is now OPEN' : '🔴 Restaurant is now CLOSED')
    } catch { toast.error('Failed to toggle status') }
  }

  const handleToggleItem = async (item_id) => {
    try {
      await api.patch(`/shopkeeper/menu/${item_id}/toggle`)
      setMenuItems(items => items.map(i => i.item_id === item_id ? { ...i, available: !i.available } : i))
    } catch { toast.error('Failed to toggle item') }
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const pastOrders   = orders.filter(o => o.status === 'delivered');

  if (loading) return <div className="loading-spinner" style={{ paddingTop: '120px' }}><div className="spinner" /></div>

  if (needsSetup) {
    return (
      <div className="page-wrapper page-enter">
        <div className="container" style={{ maxWidth: 500, paddingTop: '100px' }}>
          <div className="card" style={{ padding: '30px' }}>
            <h2 style={{ marginBottom: 20 }}>Setup Your Restaurant</h2>
            <form onSubmit={handleSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>Restaurant Name *</label>
                <input type="text" className="form-input" required value={setupData.name} onChange={e => setSetupData({...setupData, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>Cuisine Type *</label>
                <input type="text" className="form-input" required placeholder="e.g. Italian, Indian, Fast Food" value={setupData.cuisine} onChange={e => setSetupData({...setupData, cuisine: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>Address</label>
                <input type="text" className="form-input" value={setupData.address} onChange={e => setSetupData({...setupData, address: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 5 }}>Image URL</label>
                <input type="text" className="form-input" placeholder="https://..." value={setupData.image_url} onChange={e => setSetupData({...setupData, image_url: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>Create Restaurant</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper page-enter">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #ff9800, #f57c00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
            }}>🏪</div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 2 }}>
                {restaurant?.name}
                <button onClick={() => { setIsEditingProfile(true); setEditData({ name: restaurant?.name, cuisine: restaurant?.cuisine, image_url: restaurant?.image_url || '' }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', marginLeft: '10px' }}>✏️</button>
              </h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🍴 {restaurant?.cuisine}</span>
                <span className="rating-pill">⭐ {Number(restaurant?.rating).toFixed(1)}</span>
                <span className={restaurant?.is_open ? 'badge-open' : 'badge-closed'}>
                  {restaurant?.is_open ? '● Open' : '● Closed'}
                </span>
              </div>
            </div>
          </div>
          <button
            id="toggle-open-btn"
            className={`btn ${restaurant?.is_open ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleToggleOpen}
            style={{ background: restaurant?.is_open ? 'rgba(244,67,54,0.12)' : 'linear-gradient(135deg,#4caf50,#388e3c)' }}
          >
            {restaurant?.is_open ? '🔴 Close Restaurant' : '🟢 Open Restaurant'}
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Active Orders', value: activeOrders.length, icon: '🔥', color: '#ff5252' },
            { label: 'Total Orders', value: orders.length,        icon: '📋', color: '#2196f3' },
            { label: 'Delivered',    value: pastOrders.length,    icon: '✅', color: '#4caf50' },
            { label: 'Menu Items',   value: menuItems.length,     icon: '🍽️', color: '#ff9800' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
          {[
            { key: 'orders', label: `🔥 Active Orders (${activeOrders.length})` },
            { key: 'history', label: `📋 History (${pastOrders.length})` },
            { key: 'menu', label: `🍽️ Menu (${menuItems.length})` },
          ].map(tab => (
            <button key={tab.key} id={`tab-${tab.key}`} onClick={() => setActiveTab(tab.key)} style={{
              padding: '10px 20px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #ff9800' : '2px solid transparent',
              color: activeTab === tab.key ? '#ff9800' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 700 : 500, cursor: 'pointer', fontSize: '0.9rem',
              transition: 'var(--transition)'
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Edit Profile Modal inline equivalent */}
        {isEditingProfile && (
          <div className="card" style={{ padding: '20px', marginBottom: '24px', borderLeft: '4px solid #2196f3' }}>
            <h3 style={{ marginBottom: 16 }}>Edit Profile</h3>
            <form onSubmit={handleEditProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" className="form-input" placeholder="Restaurant Name" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
              <input type="text" className="form-input" placeholder="Cuisine Type" value={editData.cuisine} onChange={e => setEditData({...editData, cuisine: e.target.value})} />
              <input type="text" className="form-input" placeholder="Image URL" value={editData.image_url} onChange={e => setEditData({...editData, image_url: e.target.value})} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)} style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Active Orders */}
        {activeTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeOrders.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🎉</div><div className="empty-title">No active orders</div><div className="empty-desc">New orders will appear here instantly</div></div>
            ) : activeOrders.map(order => (
              <div key={order.order_id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>
                      Order #{order.order_id} — {order.customer_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      📞 {order.customer_phone} · {new Date(order.created_at).toLocaleTimeString('en-IN')}
                    </div>
                    {/* Driver Status Indicator */}
                    <div style={{ marginTop: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                      {order.agent_id ? (
                        <span style={{ color: '#2196f3' }}>🛵 Driver assigned: {order.agent_name}</span>
                      ) : (
                        <span style={{ color: '#f44336' }}>⏳ Driver pending</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
                      background: `${STATUS_COLOR[order.status]}20`, color: STATUS_COLOR[order.status],
                      border: `1px solid ${STATUS_COLOR[order.status]}40`
                    }}>{STATUS_LABEL[order.status]}</span>
                    <span style={{ fontWeight: 800, color: '#ff9800' }}>₹{Number(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>
                {/* Items */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {order.items?.map((item, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem',
                      background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-secondary)'
                    }}>
                      {item.item_name} ×{item.quantity}
                    </span>
                  ))}
                </div>
                {/* Action button */}
                {STATUS_NEXT[order.status] && (
                  <button
                    id={`advance-order-${order.order_id}`}
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStatusUpdate(order.order_id, STATUS_NEXT[order.status])}
                    disabled={updatingId === order.order_id}
                    style={{ background: 'linear-gradient(135deg,#ff9800,#f57c00)', boxShadow: '0 4px 15px rgba(255,152,0,0.3)' }}
                  >
                    {updatingId === order.order_id ? '⏳ Updating...' : `→ Mark as ${STATUS_NEXT[order.status].replace(/_/g, ' ')}`}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Order History */}
        {activeTab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pastOrders.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No completed orders yet</div></div>
            ) : pastOrders.map(order => (
              <div key={order.order_id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Order #{order.order_id} — {order.customer_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="badge-open">🎉 Delivered</span>
                  <span style={{ fontWeight: 800, color: '#4caf50' }}>₹{Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Management */}
        {activeTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Add Item Button & Form */}
            {!addingItem ? (
              <button 
                className="btn btn-primary" 
                onClick={() => setAddingItem(true)} 
                style={{ alignSelf: 'flex-start', marginBottom: 10, background: '#4caf50' }}
              >
                + Add New Item
              </button>
            ) : (
              <div className="card" style={{ padding: 20, marginBottom: 10, borderLeft: '4px solid #ff9800' }}>
                <h3 style={{ marginBottom: 12 }}>Add Menu Item</h3>
                <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}><input type="text" className="form-input" placeholder="Item Name *" required value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})}/></div>
                  <div><input type="number" step="0.01" className="form-input" placeholder="Price (₹) *" required value={newItem.price} onChange={e=>setNewItem({...newItem, price: e.target.value})}/></div>
                  <div><input type="text" className="form-input" placeholder="Category (e.g. Starter)" value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value})}/></div>
                  <div style={{ gridColumn: '1 / -1' }}><input type="text" className="form-input" placeholder="Description" value={newItem.description} onChange={e=>setNewItem({...newItem, description: e.target.value})}/></div>
                  <div style={{ gridColumn: '1 / -1' }}><input type="text" className="form-input" placeholder="Image URL" value={newItem.image_url} onChange={e=>setNewItem({...newItem, image_url: e.target.value})}/></div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Item</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setAddingItem(false)} style={{ flex: 1, border: '1px solid var(--border)' }}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            
            {menuItems.map(item => (
              <div key={item.item_id} className="card" style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16,
                opacity: item.available ? 1 : 0.5
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.category} · ₹{item.price}</div>
                </div>
                <button
                  id={`toggle-item-${item.item_id}`}
                  onClick={() => handleToggleItem(item.item_id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: item.available ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
                    color: item.available ? '#4caf50' : '#f44336'
                  }}
                >
                  {item.available ? '✓ Available' : '✕ Hidden'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
