import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'

const FOOD_EMOJI = {
  'Main Course': '🍛', 'Pizza': '🍕', 'Burgers': '🍔', 'Starters': '🥗',
  'Bread': '🫓', 'Dessert': '🍰', 'Drinks': '🥤', 'Rice': '🍚', 'Noodles': '🍜',
  'Nigiri': '🍣', 'Rolls': '🍱', 'Soups': '🍵', 'Sides': '🍟', 'Tacos': '🌮',
  'Quesadillas': '🫔', 'Burritos': '🌯'
}

// Dummy menu per restaurant_id for offline/demo mode
const DUMMY_DATA = {
  1: {
    restaurant: { restaurant_id: 1, name: 'Spice Garden', cuisine: 'Indian', rating: 4.5, delivery_time: '30-40 min', min_order: 149, image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', is_open: true },
    menu: [
      { item_id: 101, name: 'Butter Chicken', description: 'Creamy tomato-based chicken curry', price: 280, category: 'Main Course', available: true },
      { item_id: 102, name: 'Paneer Tikka Masala', description: 'Grilled cottage cheese in spiced gravy', price: 240, category: 'Main Course', available: true },
      { item_id: 103, name: 'Dal Makhani', description: 'Slow-cooked black lentils with cream', price: 180, category: 'Main Course', available: true },
      { item_id: 104, name: 'Garlic Naan', description: 'Freshly baked garlic flatbread', price: 50, category: 'Bread', available: true },
      { item_id: 105, name: 'Biryani', description: 'Fragrant basmati rice with spiced meat', price: 320, category: 'Main Course', available: true },
      { item_id: 106, name: 'Gulab Jamun', description: 'Soft milk-solid balls in rose syrup', price: 80, category: 'Dessert', available: true },
    ],
  },
  2: {
    restaurant: { restaurant_id: 2, name: 'Pizza Planet', cuisine: 'Italian', rating: 4.3, delivery_time: '25-35 min', min_order: 199, image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', is_open: true },
    menu: [
      { item_id: 201, name: 'Margherita Pizza', description: 'Classic tomato, mozzarella, fresh basil', price: 349, category: 'Pizza', available: true },
      { item_id: 202, name: 'Pepperoni Feast', description: 'Loaded with spicy pepperoni slices', price: 449, category: 'Pizza', available: true },
      { item_id: 203, name: 'BBQ Chicken Pizza', description: 'Smoky BBQ sauce with grilled chicken', price: 499, category: 'Pizza', available: true },
      { item_id: 204, name: 'Veggie Supreme', description: 'Garden fresh veggies on cheese base', price: 399, category: 'Pizza', available: true },
      { item_id: 205, name: 'Garlic Bread', description: 'Toasted bread with herb garlic butter', price: 149, category: 'Sides', available: true },
      { item_id: 206, name: 'Tiramisu', description: 'Classic Italian coffee cream dessert', price: 199, category: 'Dessert', available: true },
    ],
  },
  3: {
    restaurant: { restaurant_id: 3, name: 'Burger Barn', cuisine: 'American', rating: 4.1, delivery_time: '20-30 min', min_order: 99, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', is_open: true },
    menu: [
      { item_id: 301, name: 'Classic Smash Burger', description: 'Double smash patty with special sauce', price: 249, category: 'Burgers', available: true },
      { item_id: 302, name: 'Crispy Chicken Burger', description: 'Buttermilk fried chicken with coleslaw', price: 229, category: 'Burgers', available: true },
      { item_id: 303, name: 'Veg Loaded Burger', description: 'Hearty veggie patty with cheese & lettuce', price: 199, category: 'Burgers', available: true },
      { item_id: 304, name: 'BBQ Bacon Burger', description: 'Smoky beef patty, bacon & BBQ sauce', price: 299, category: 'Burgers', available: true },
      { item_id: 305, name: 'Loaded Fries', description: 'Crispy fries with cheese sauce & jalapeños', price: 149, category: 'Sides', available: true },
      { item_id: 306, name: 'Chocolate Shake', description: 'Thick creamy chocolate milkshake', price: 129, category: 'Drinks', available: true },
    ],
  },
  4: {
    restaurant: { restaurant_id: 4, name: 'Dragon Wok', cuisine: 'Chinese', rating: 4.4, delivery_time: '35-45 min', min_order: 129, image_url: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600', is_open: true },
    menu: [
      { item_id: 401, name: 'Kung Pao Chicken', description: 'Spicy stir-fried chicken with peanuts', price: 280, category: 'Main Course', available: true },
      { item_id: 402, name: 'Veg Fried Rice', description: 'Wok-tossed vegetables with fragrant rice', price: 200, category: 'Rice', available: true },
      { item_id: 403, name: 'Dim Sum Basket', description: 'Assorted steamed dumplings (8 pcs)', price: 240, category: 'Starters', available: true },
      { item_id: 404, name: 'Hakka Noodles', description: 'Stir-fried egg noodles with vegetables', price: 220, category: 'Noodles', available: true },
      { item_id: 405, name: 'Veg Manchurian', description: 'Crispy veggie balls in tangy sauce', price: 200, category: 'Starters', available: true },
      { item_id: 406, name: 'Spring Rolls (4 pcs)', description: 'Crispy rolls stuffed with vegetables', price: 180, category: 'Starters', available: true },
    ],
  },
  5: {
    restaurant: { restaurant_id: 5, name: 'Sushi Sakura', cuisine: 'Japanese', rating: 4.7, delivery_time: '40-50 min', min_order: 299, image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600', is_open: true },
    menu: [
      { item_id: 501, name: 'Salmon Nigiri (4 pcs)', description: 'Fresh Atlantic salmon slices on rice', price: 420, category: 'Nigiri', available: true },
      { item_id: 502, name: 'Dragon Roll (8 pcs)', description: 'Prawn tempura, avocado & eel sauce', price: 580, category: 'Rolls', available: true },
      { item_id: 503, name: 'Spicy Tuna Roll', description: 'Fresh tuna with sriracha mayo', price: 480, category: 'Rolls', available: true },
      { item_id: 504, name: 'Miso Soup', description: 'Traditional tofu & seaweed soup', price: 150, category: 'Soups', available: true },
      { item_id: 505, name: 'Edamame', description: 'Steamed salted Japanese soybeans', price: 180, category: 'Starters', available: true },
      { item_id: 506, name: 'Matcha Ice Cream', description: 'Premium Japanese green tea ice cream', price: 220, category: 'Dessert', available: true },
    ],
  },
  6: {
    restaurant: { restaurant_id: 6, name: 'The Taco Stop', cuisine: 'Mexican', rating: 4.2, delivery_time: '20-30 min', min_order: 89, image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600', is_open: true },
    menu: [
      { item_id: 601, name: 'Beef Street Tacos (3)', description: 'Seasoned beef, pico de gallo & cilantro', price: 249, category: 'Tacos', available: true },
      { item_id: 602, name: 'Fish Tacos (2)', description: 'Battered fish with slaw & lime crema', price: 279, category: 'Tacos', available: true },
      { item_id: 603, name: 'Chicken Quesadilla', description: 'Grilled chicken & cheese in flour tortilla', price: 219, category: 'Quesadillas', available: true },
      { item_id: 604, name: 'Veggie Burrito', description: 'Rice, black beans & salsa in tortilla', price: 199, category: 'Burritos', available: true },
      { item_id: 605, name: 'Nachos Supreme', description: 'Chips with cheese, jalapeños & guacamole', price: 179, category: 'Starters', available: true },
      { item_id: 606, name: 'Churros', description: 'Crispy fried dough with chocolate dip', price: 129, category: 'Dessert', available: true },
    ],
  },
}

// Generic dummy data for unknown restaurant IDs
const GENERIC_DUMMY = (id) => ({
  restaurant: { restaurant_id: id, name: 'Restaurant ' + id, cuisine: 'Indian', rating: 4.0, delivery_time: '30-45 min', min_order: 149, image_url: null, is_open: true },
  menu: [
    { item_id: id * 100 + 1, name: 'Special Dish 1', description: 'Chef\'s special recipe', price: 199, category: 'Main Course', available: true },
    { item_id: id * 100 + 2, name: 'Special Dish 2', description: 'Freshly prepared today', price: 149, category: 'Main Course', available: true },
    { item_id: id * 100 + 3, name: 'Dessert Special', description: 'Sweet treat to end your meal', price: 99, category: 'Dessert', available: true },
  ],
})

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
  const [isDemoMode, setIsDemoMode] = useState(false)

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
      // Fall back to dummy data
      const dummy = DUMMY_DATA[parseInt(id)] || GENERIC_DUMMY(parseInt(id))
      setRestaurant(dummy.restaurant)
      setMenu(dummy.menu)
      setReviews([])
      setIsDemoMode(true)
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
    if (isDemoMode) { toast.error('Server is offline. Please start the backend server.'); return }
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
    if (isDemoMode) { toast.error('Server is offline. Please start the backend server.'); return }
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
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div style={{
            background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)',
            borderRadius: 'var(--radius-sm)', padding: '10px 16px', marginBottom: 16,
            fontSize: '0.85rem', color: '#ff9800', display: 'flex', alignItems: 'center', gap: 8
          }}>
            ⚠️ <strong>Demo Mode:</strong> Server is offline. Showing sample menu. Start your backend with <code>npm run dev</code> in the <code>server/</code> folder.
          </div>
        )}

        {/* Restaurant Header */}
        <div className="restaurant-header">
          {restaurant?.image_url ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              className="restaurant-header-img"
              onError={e => e.target.style.display = 'none'}
            />
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
            {isAuth && !isDemoMode && (
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Leave a Review</h3>
                <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div className="form-label" style={{ marginBottom: '8px' }}>Rating</div>
                    <div className="star-input">
                      {[1, 2, 3, 4, 5].map(s => (
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
                <div className="empty-desc">{isDemoMode ? 'Connect to server to see reviews' : 'Be the first to review!'}</div>
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
