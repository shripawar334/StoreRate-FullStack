
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './StoreListing.css'

function StoreListing() {
  const navigate = useNavigate()

  const [stores, setStores] = useState([])
  const [ratings, setRatings] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchStores = useCallback(async (searchTerm = '') => {
    setLoading(true)
    setError('')

    try {
      const query = new URLSearchParams()
      if (searchTerm.trim()) query.set('search', searchTerm.trim())

      const response = await apiRequest(
        `/user/stores${query.toString() ? `?${query.toString()}` : ''}`
      )

      const storeData = response.data || []
      setStores(storeData)

      setRatings((previous) => {
        const updated = { ...previous }

        storeData.forEach((store) => {
          // Keep the selected value if the user is currently changing it.
          if (!(store.id in updated)) {
            updated[store.id] = store.myRating
              ? String(store.myRating)
              : ''
          }
        })

        return updated
      })
    } catch (err) {
      setError(err.message || 'Failed to load stores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  const handleSearch = (event) => {
    const value = event.target.value
    setSearch(value)
    fetchStores(value)
  }

  const handleRatingChange = (storeId, value) => {
    setRatings((previous) => ({
      ...previous,
      [storeId]: value,
    }))
    setError('')
    setSuccess('')
  }

  const handleRatingSubmit = async (storeId) => {
    const selectedRating = ratings[storeId]

    if (!selectedRating) {
      setError('Please select a rating before submitting.')
      setSuccess('')
      return
    }

    setSubmittingId(storeId)
    setError('')
    setSuccess('')

    try {
      const response = await apiRequest(`/stores/${storeId}/rating`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(selectedRating),
        }),
      })

      setSuccess(response.message || 'Rating saved successfully.')

      // Reload server data so your rating and overall average are refreshed.
      await fetchStores(search)
    } catch (err) {
      setError(err.message || 'Failed to save rating.')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <main className="store-listing-page">
      <header className="listing-header">
        <Link to="/stores" className="listing-brand">
          <span className="listing-brand-icon">S</span>
          <span>StoreRate</span>
        </Link>

        <nav className="listing-nav">
          <Link to="/stores" className="listing-nav-active">
            Stores
          </Link>
          <Link to="/update-password">Update Password</Link>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>

      <section className="listing-content">
        <div className="listing-heading">
          <div>
            <p className="listing-eyebrow">STORE DIRECTORY</p>
            <h1>Discover stores</h1>
            <p>Find a store and share your experience with a rating.</p>
          </div>

          <div className="listing-count">
            <strong>{stores.length}</strong>
            <span>Stores available</span>
          </div>
        </div>

        <section className="listing-search-card">
          <label htmlFor="store-search">Search stores</label>
          <input
            id="store-search"
            type="search"
            placeholder="Search by store name or address..."
            value={search}
            onChange={handleSearch}
          />
        </section>

        {error && (
          <p role="alert" className="listing-error">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="listing-success">
            {success}
          </p>
        )}

        <div className="listing-results-heading">
          <h2>All stores</h2>
          <span>{stores.length} results</span>
        </div>

        {loading ? (
          <p>Loading stores...</p>
        ) : stores.length === 0 ? (
          <p>No stores found.</p>
        ) : (
          <section className="store-cards">
            {stores.map((store) => {
              const myRating = store.myRating
              const hasRating = myRating !== null && myRating !== undefined

              return (
                <article className="listing-store-card" key={store.id}>
                  <div className="listing-store-top">
                    <div className="listing-store-icon">
                      {store.name.charAt(0)}
                    </div>
                    <span className="listing-verified">
                      Registered store
                    </span>
                  </div>

                  <h3>{store.name}</h3>
                  <p className="listing-store-address">{store.address}</p>

                  <div className="listing-rating-row">
                    <div>
                      <span className="listing-rating-label">
                        Overall rating
                      </span>
                      <div className="listing-rating-value">
                        <span className="listing-star">★</span>
                        <strong>
                          {Number(store.averageRating || 0).toFixed(1)}
                        </strong>
                        <span className="listing-out-of">/ 5</span>
                      </div>
                    </div>

                    <div className="listing-your-rating">
                      <span className="listing-rating-label">
                        Your rating
                      </span>
                      <strong>
                        {hasRating ? `${myRating} / 5` : 'Not rated'}
                      </strong>
                    </div>
                  </div>

                  <div className="listing-rate-section">
                    <label htmlFor={`rating-${store.id}`}>
                      {hasRating ? 'Modify your rating' : 'Rate this store'}
                    </label>

                    <select
                      id={`rating-${store.id}`}
                      value={ratings[store.id] ?? ''}
                      onChange={(event) =>
                        handleRatingChange(store.id, event.target.value)
                      }
                      disabled={submittingId === store.id}
                    >
                      <option value="">Select rating</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Fair</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Very good</option>
                      <option value="5">5 - Excellent</option>
                    </select>

                    <button
                      type="button"
                      className="listing-rate-button"
                      onClick={() => handleRatingSubmit(store.id)}
                      disabled={submittingId === store.id}
                    >
                      {submittingId === store.id
                        ? 'Saving...'
                        : hasRating
                          ? 'Update rating'
                          : 'Submit rating'}
                    </button>
                  </div>
                </article>
              )
            })}
          </section>
        )}

        <footer className="listing-footer">
          StoreRate · Your feedback helps others choose better.
        </footer>
      </section>
    </main>
  )
}

export default StoreListing
