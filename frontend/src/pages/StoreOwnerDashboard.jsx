
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './StoreOwnerDashboard.css'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StoreOwnerDashboard() {
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await apiRequest('/owner/dashboard')
      setDashboard(response.data || response.dashboard || response)
    } catch (err) {
      setError(err.message || 'Failed to load your store dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <main className="owner-dashboard">
        <p>Loading your store dashboard...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="owner-dashboard">
        <header className="owner-header">
          <div>
            <p className="owner-breadcrumb">
              Workspace / Store Overview
            </p>
            <h1>Store Owner Dashboard</h1>
          </div>

          <button
            type="button"
            className="owner-logout"
            onClick={handleLogout}
          >
            ↪ Log out
          </button>
        </header>

        <p role="alert">{error}</p>

        <button type="button" onClick={fetchDashboard}>
          Try again
        </button>
      </main>
    )
  }

  const store = dashboard?.store || null
  const ratings = dashboard?.ratings || dashboard?.users || []

  const averageRating = Number(
    store?.averageRating ?? dashboard?.averageRating ?? 0
  )

  const totalRatings = Number(
    store?.totalRatings ?? dashboard?.totalRatings ?? ratings.length
  )

  return (
    <main className="owner-dashboard">
      <header className="owner-header">
        <div>
          <p className="owner-breadcrumb">
            Workspace / Store Overview
          </p>
          <h1>Store Owner Dashboard</h1>
          <p className="owner-subtitle">
            Track your store performance and customer feedback.
          </p>
        </div>

        <button
          type="button"
          className="owner-logout"
          onClick={handleLogout}
        >
          ↪ Log out
        </button>
      </header>

      {store ? (
        <section className="owner-store-banner">
          <div className="owner-store-icon">
            {store.name?.charAt(0) || 'S'}
          </div>

          <div className="owner-store-info">
            <span className="owner-label">YOUR STORE</span>
            <h2>{store.name}</h2>
            <p>{store.address}</p>
          </div>

          <span className="owner-status">Registered Store</span>
        </section>
      ) : (
        <section className="owner-store-banner">
          <div className="owner-store-icon">S</div>

          <div className="owner-store-info">
            <span className="owner-label">YOUR STORE</span>
            <h2>No store assigned</h2>
            <p>
              Contact the administrator to assign a store to your account.
            </p>
          </div>
        </section>
      )}

      <section className="owner-stats">
        <article className="owner-stat-card">
          <div className="owner-stat-top">
            <span>Average Rating</span>
            <span className="owner-stat-icon rating-icon">★</span>
          </div>

          <div className="owner-rating-value">
            <strong>{averageRating.toFixed(1)}</strong>
            <span className="owner-stars">★★★★★</span>
          </div>

          <p>Based on submitted ratings</p>
        </article>

        <article className="owner-stat-card">
          <div className="owner-stat-top">
            <span>Total Ratings</span>
            <span className="owner-stat-icon count-icon">☆</span>
          </div>

          <strong className="owner-stat-number">
            {totalRatings}
          </strong>

          <p>Customers who rated your store</p>
        </article>
      </section>

      <section className="owner-ratings-card">
        <div className="owner-ratings-heading">
          <div>
            <h2>Customer Ratings</h2>
            <p>
              Users who have submitted a rating for your store.
            </p>
          </div>

          <span className="owner-rating-count">
            {ratings.length} ratings
          </span>
        </div>

        <div className="owner-table-wrapper">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Submitted On</th>
              </tr>
            </thead>

            <tbody>
              {ratings.length > 0 ? (
                ratings.map((item, index) => (
                  <tr
                    key={
                      item.userId ??
                      item.id ??
                      `${item.userEmail || item.email || 'user'}-${index}`
                    }
                  >
                    <td>
                      <div className="owner-customer">
                        <span className="owner-customer-avatar">
                          {(
                            item.userName ||
                            item.name ||
                            'U'
                          ).charAt(0)}
                        </span>

                        <strong>
                          {item.userName ||
                            item.name ||
                            'Unknown user'}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {item.userEmail || item.email || '—'}
                    </td>

                    <td>
                      <span className="owner-customer-rating">
                        <span className="owner-star">★</span>
                        {item.rating}
                        <span className="owner-out-of">/ 5</span>
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        item.ratedAt ||
                        item.created_at ||
                        item.createdAt ||
                        item.date
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">
                    No customer ratings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="owner-table-footer">
          Showing ratings submitted for your store
        </footer>
      </section>

      <footer className="owner-footer">
        <Link to="/update-password">Update Password</Link>
        {' · '}StoreRate <span>•</span> Store Owner Portal
      </footer>
    </main>
  )
}

export default StoreOwnerDashboard
