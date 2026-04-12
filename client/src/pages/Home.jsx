import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const CUISINES = ['All', 'Indian', 'Italian', 'American', 'Chinese', 'Japanese', 'Mexican']
const EMOJI_MAP = { Indian: '🍛', Italian: '🍕', American: '🍔', Chinese: '🥡', Japanese: '🍱', Mexican: '🌮' }

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCuisine, setActiveCuisine] = useState('All')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/restaurants').then(r => {
      setRestaurants(r.data)
      setFiltered(r.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let list = restaurants
    if (activeCuisine !== 'All') list = list.filter(r => r.cuisine === activeCuisine)
    if (search.trim()) list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    setFiltered(list)
  }, [search, activeCuisine, restaurants])

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
            />
            <button className="hero-search-btn">Search</button>
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
              <p className="section-subtitle">{filtered.length} restaurants available</p>
            </div>
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
              <div className="empty-desc">Try a different search or cuisine filter</div>
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
                    <img src={r.image_url} alt={r.name} className="restaurant-card-img" loading="lazy" />
                  ) : (
                    <div className="restaurant-card-img-placeholder">
                      {EMOJI_MAP[r.cuisine] || '🍽️'}
                    </div>
                  )}
                  <div className="restaurant-card-body">
                    <div className="restaurant-card-name">{r.name}</div>
                    <div className="restaurant-card-cuisine">{r.cuisine}</div>
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
