import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const FOOD_EMOJI = { 'Main Course': '🍛', 'Pizza': '🍕', 'Burgers': '🍔', 'Starters': '🥗',
  'Bread': '🫓', 'Dessert': '🍰', 'Drinks': '🥤', 'Rice': '🍚', 'Noodles': '🍜',
  'Nigiri': '🍣', 'Rolls': '🍱', 'Soups': '🍵', 'Sides': '🍟', 'Tacos': '🌮',
  'Quesadillas': '🫔', 'Burritos': '🌯' }

export default function Restaurant() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, cartItems } = useCart()
  const { isAuth } = useAuth()

  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [addingId, setAddingId] = useState(null)
  const [tab, setTab] = useState('menu')
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [rRes, mRes, revRes] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/restaurants/${id}/menu`),
        api.get(`/restaurants/${id}/reviews`)
      ])
      setRestaurant(rRes.data)
      setMenu(mRes.data)
      setReviews(revRes.data)
    } catch {
      toast.error('Failed to load restaurant')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetchData() }, [fetchData])

  const categories = ['All', ...new Set(menu.map(i => i.category))]
  const filteredMenu = activeCategory === 'All' ? menu : menu.filter(i => i.category === activeCategory)

  const getCartQty = (item_id) => {
    const found = cartItems.find(c => c.item_id === item_id)
    return found ? found.quantity : 0
  }

  const handleAdd = async (item_id) => {
    if (!isAuth) { toast.error('Please login to add items'); navigate('/login'); return }
    setAddingId(item_id)
    try {
      await addToCart(item_id, 1)
      toast.success('Added to cart! 🛒')
    } catch {
      toast.error('Failed to add to cart')
    } finally {
      setAddingId(null)
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      await api.post(`/restaurants/${id}/reviews`, reviewForm)
      toast.success('Review submitted! ⭐')
      setReviewForm({ rating: 5, comment: '' })
      const revRes = await api.get(`/restaurants/${id}/reviews`)
      setReviews(revRes.data)
    } catch {
      toast.error('Failed to submit review. Login required.')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="loading-spinner" style={{ paddingTop: '120px' }}><div className="spinner" /></div>

  return (
    <div className="page-wrapper page-enter">
      <div className="container">
        {/* Restaurant Header */}
        <div className="restaurant-header">
          {restaurant?.image_url ? (
            <img src={restaurant.image_url} alt={restaurant.name} className="restaurant-header-img" />
          ) : (
            <div style={{ height: 260, background: 'linear-gradient(135deg, #1e1e1e, #2d2d2d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
              🍽️
            </div>
          )}
          <div className="restaurant-header-body">
            <div>
              <h1 className="restaurant-header-name">{restaurant?.name}</h1>
              <div className="restaurant-header-meta">
                <span className="restaurant-header-tag">🍴 {restaurant?.cuisine}</span>
                <span className="rating-pill">⭐ {Number(restaurant?.rating).toFixed(1)}</span>
                <span className="restaurant-header-tag">🕐 {restaurant?.delivery_time}</span>
                <span className="restaurant-header-tag">₹{restaurant?.min_order} min order</span>
                <span className={restaurant?.is_open ? 'badge-open' : 'badge-closed'}>
                  {restaurant?.is_open ? '● Open Now' : '● Closed'}
                </span>
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => navigate('/')}>← Back</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="menu-category-tabs" style={{ marginBottom: 0, borderBottom: '1px solid var(--border)', paddingBottom: 0, gap: 0 }}>
          {['menu', 'reviews'].map(t => (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: '8px 8px 0 0',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
                background: 'transparent',
                fontWeight: tab === t ? 700 : 500,
                padding: '10px 24px'
              }}
            >
              {t === 'menu' ? '🍽️ Menu' : `💬 Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'menu' && (
          <div style={{ marginTop: '24px' }}>
            {/* Category Filter */}
            <div className="menu-category-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  id={`cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`chip ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {FOOD_EMOJI[cat] || '🍽️'} {cat}
                </button>
              ))}
            </div>

            {filteredMenu.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🍽️</div><div className="empty-title">No items found</div></div>
            ) : (
              <div className="grid-menu">
                {filteredMenu.map(item => {
                  const qty = getCartQty(item.item_id)
                  return (
                    <div key={item.item_id} id={`menu-item-${item.item_id}`} className="menu-item-card">
                      <div className="menu-item-img-placeholder">
                        {FOOD_EMOJI[item.category] || '🍽️'}
                      </div>
                      <div className="menu-item-info">
                        <div className="menu-item-name">{item.name}</div>
                        {item.description && <div className="menu-item-desc">{item.description}</div>}
                        <div className="menu-item-price">₹{item.price}</div>
                      </div>
                      <div>
                        {qty > 0 ? (
                          <div className="qty-control">
                            <button className="qty-btn" onClick={() => handleAdd(item.item_id)}>+</button>
                            <span className="qty-value">{qty}</span>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAdd(item.item_id)}
                            disabled={addingId === item.item_id}
                          >
                            {addingId === item.item_id ? '...' : '+ Add'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Submit Review */}
            {isAuth && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Leave a Review</h3>
                <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Rating</div>
                    <div className="star-input">
                      {[1,2,3,4,5].map(s => (
                        <span
                          key={s}
                          id={`star-${s}`}
                          onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                          style={{ fontSize: '1.8rem', cursor: 'pointer', opacity: s <= reviewForm.rating ? 1 : 0.3 }}
                        >⭐</span>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="review-comment"
                    className="form-input"
                    placeholder="Share your experience..."
                    rows={3}
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    required
                  />
                  <button id="submit-review" type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : '✨ Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <div className="empty-title">No reviews yet</div>
                <div className="empty-desc">Be the first to review!</div>
              </div>
            ) : reviews.map(rev => (
              <div key={rev.review_id} className="review-card">
                <div className="review-header">
                  <span className="review-author">👤 {rev.user_name}</span>
                  <span className="review-date">{new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="review-stars">{'⭐'.repeat(rev.rating)}</div>
                <div className="review-comment">{rev.comment}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
