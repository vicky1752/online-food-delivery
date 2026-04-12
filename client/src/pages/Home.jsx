import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const CUISINES = ['All', 'Indian', 'Italian', 'American', 'Chinese', 'Japanese', 'Mexican']
const EMOJI_MAP = { Indian: '🍛', Italian: '🍕', American: '🍔', Chinese: '🥡', Japanese: '🍱', Mexican: '🌮' }

// Dummy restaurants shown when DB is unavailable or empty
const DUMMY_RESTAURANTS = [
  {
    restaurant_id: 1,
    name: 'Spice Garden',
    cuisine: 'Indian',
    rating: 4.5,
    delivery_time: '30-40 min',
    min_order: 149,
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
    is_open: true,
  },
  {
    restaurant_id: 2,
    name: 'Pizza Planet',
    cuisine: 'Italian',
    rating: 4.3,
    delivery_time: '25-35 min',
    min_order: 199,
    image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
    is_open: true,
  },
  {
    restaurant_id: 3,
    name: 'Burger Barn',
    cuisine: 'American',
    rating: 4.1,
    delivery_time: '20-30 min',
    min_order: 99,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    is_open: true,
  },
  {
    restaurant_id: 4,
    name: 'Dragon Wok',
    cuisine: 'Chinese',
    rating: 4.4,
    delivery_time: '35-45 min',
    min_order: 129,
    image_url: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600',
    is_open: true,
  },
  {
    restaurant_id: 5,
    name: 'Sushi Sakura',
    cuisine: 'Japanese',
    rating: 4.7,
    delivery_time: '40-50 min',
    min_order: 299,
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600',
    is_open: true,
  },
  {
    restaurant_id: 6,
    name: 'The Taco Stop',
    cuisine: 'Mexican',
    rating: 4.2,
    delivery_time: '20-30 min',
    min_order: 89,
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600',
    is_open: true,
  },
  {
    restaurant_id: 7,
    name: 'Biryani Blues',
    cuisine: 'Indian',
    rating: 4.6,
    delivery_time: '35-45 min',
    min_order: 199,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
    is_open: true,
  },
  {
    restaurant_id: 8,
    name: 'Pasta Paradise',
    cuisine: 'Italian',
    rating: 4.0,
    delivery_time: '30-40 min',
    min_order: 179,
    image_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=600',
    is_open: false,
  },
  {
    restaurant_id: 9,
    name: 'Seoul Kitchen',
    cuisine: 'Chinese',
    rating: 4.5,
    delivery_time: '30-40 min',
    min_order: 149,
    image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600',
    is_open: true,
  },
]

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCuisine, setActiveCuisine] = useState('All')
  const [usingDummy, setUsingDummy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/restaurants')
      .then(r => {
        const data = r.data && r.data.length > 0 ? r.data : DUMMY_RESTAURANTS
        if (r.data && r.data.length === 0) setUsingDummy(true)
        setRestaurants(data)
        setFiltered(data)
      })
      .catch(() => {
        // Fallback to dummy data when server is unreachable
        setUsingDummy(true)
        setRestaurants(DUMMY_RESTAURANTS)
        setFiltered(DUMMY_RESTAURANTS)
      })
      .finally(() => setLoading(false))
  }, [])

  // Live filtering whenever search text or cuisine changes
  useEffect(() => {
    let list = restaurants
    if (activeCuisine !== 'All') {
      list = list.filter(r => r.cuisine === activeCuisine)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.cuisine && r.cuisine.toLowerCase().includes(q))
      )
    }
    setFiltered(list)
  }, [search, activeCuisine, restaurants])

  const handleSearchBtn = () => {
    // Search is already live — this just gives a visual click feel
    const input = document.getElementById('hero-search-input')
    if (input) input.focus()
  }

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">⚡ Fast Delivery · Fresh Food</div>
          <h1 className="hero-title">
            Hungry? We've got <br />
            <span className="highlight">your cravings</span> covered
          </h1>
          <p className="hero-subtitle">
            Order from the best local restaurants with easy, on-demand delivery to your doorstep.
          </p>
          <div className="hero-search">
            <input
              type="text"
              id="hero-search-input"
              className="hero-search-input"
              placeholder="Search restaurants, cuisines..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchBtn()}
            />
            <button className="hero-search-btn" onClick={handleSearchBtn}>
              Search
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">50+</div>
              <div className="hero-stat-label">Restaurants</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">30 min</div>
              <div className="hero-stat-label">Avg Delivery</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-num">4.5★</div>
              <div className="hero-stat-label">Avg Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Grid */}
      <div className="page-wrapper">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">🍽️ Restaurants Near You</h2>
              <p className="section-subtitle">
                {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} available
                {search.trim() && ` for "${search}"`}
                {activeCuisine !== 'All' && ` · ${activeCuisine} cuisine`}
              </p>
            </div>
            {(search || activeCuisine !== 'All') && (
              <button
                className="btn"
                style={{
                  padding: '8px 16px', fontSize: '0.82rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)', cursor: 'pointer'
                }}
                onClick={() => { setSearch(''); setActiveCuisine('All') }}
              >
                ✕ Clear filters
              </button>
            )}
          </div>

          {/* Cuisine Filter */}
          <div className="category-chips">
            {CUISINES.map(c => (
              <button
                key={c}
                id={`chip-${c.toLowerCase()}`}
                className={`chip ${activeCuisine === c ? 'active' : ''}`}
                onClick={() => setActiveCuisine(c)}
              >
                {EMOJI_MAP[c] || '🍽️'} {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <div className="empty-title">No restaurants found</div>
              <div className="empty-desc">
                {search ? `No results for "${search}". ` : ''}
                Try a different search or cuisine filter
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => { setSearch(''); setActiveCuisine('All') }}
              >
                Show all restaurants
              </button>
            </div>
          ) : (
            <div className="grid-restaurants">
              {filtered.map(r => (
                <div
                  key={r.restaurant_id}
                  id={`restaurant-${r.restaurant_id}`}
                  className="card restaurant-card"
                  onClick={() => navigate(`/restaurant/${r.restaurant_id}`)}
                >
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="restaurant-card-img"
                      loading="lazy"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                  ) : null}
                  <div
                    className="restaurant-card-img-placeholder"
                    style={{ display: r.image_url ? 'none' : 'flex' }}
                  >
                    {EMOJI_MAP[r.cuisine] || '🍽️'}
                  </div>
                  <div className="restaurant-card-body">
                    <div className="restaurant-card-name">{r.name}</div>
                    <div className="restaurant-card-cuisine">{EMOJI_MAP[r.cuisine] || '🍽️'} {r.cuisine}</div>
                    <div className="restaurant-card-meta">
                      <span className="rating-pill">⭐ {Number(r.rating).toFixed(1)}</span>
                      <span>🕐 {r.delivery_time}</span>
                      <span>₹{r.min_order} min</span>
                      <span className={r.is_open ? 'badge-open' : 'badge-closed'}>
                        {r.is_open ? '● Open' : '● Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
