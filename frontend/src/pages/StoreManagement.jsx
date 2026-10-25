
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './StoreManagement.css'

function StoreManagement() {
  const navigate = useNavigate()

  const [stores, setStores] = useState([])
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('id')
  const [order, setOrder] = useState('DESC')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchStores = async () => {
      setLoading(true)
      setError('')

      try {
        const params = new URLSearchParams({
          name: search.trim(),
          email: search.trim(),
          address: search.trim(),
          sortBy,
          order,
        })

        const response = await apiRequest(`/stores?${params.toString()}`)

        if (active) {
          setStores(response.data || [])
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load stores.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchStores()

    return () => {
      active = false
    }
  }, [search, sortBy, order])

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder((current) => current === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(field)
      setOrder('ASC')
    }
  }

  const averageRating = stores.length
    ? stores.reduce((sum, store) => sum + Number(store.averageRating || 0), 0) / stores.length
    : 0

  return (
    <main className="stores-page">
      <header className="stores-header">
        <div>
          <p className="stores-breadcrumb">Workspace / Stores</p>
          <h1>Store Management</h1>
          <p className="stores-subtitle">
            Manage registered stores and monitor their ratings.
          </p>
        </div>

        <button
          type="button"
          className="stores-add-button"
          onClick={() => navigate('/add-store')}
        >
          + Add Store
        </button>
      </header>

      {error && (
        <p role="alert" className="stores-error">
          {error}
        </p>
      )}

      <section className="stores-summary">
        <article className="stores-summary-card">
          <span>Total Stores</span>
          <strong>{loading ? '...' : stores.length}</strong>
          <small>Stores in current results</small>
        </article>

        <article className="stores-summary-card">
          <span>Average Store Rating</span>
          <strong>
            {loading ? '...' : averageRating.toFixed(1)}{' '}
            <span className="store-star">★</span>
          </strong>
          <small>Across displayed stores</small>
        </article>

        <article className="stores-summary-card">
          <span>Stores Displayed</span>
          <strong>{loading ? '...' : stores.length}</strong>
          <small>Live database records</small>
        </article>
      </section>

      <section className="stores-table-card">
        <div className="stores-table-heading">
          <div>
            <h2>All Stores</h2>
            <p>Review store information and overall ratings.</p>
          </div>

          <span className="stores-count">
            {loading ? 'Loading...' : `${stores.length} records`}
          </span>
        </div>

        <div className="stores-filters">
          <input
            type="search"
            placeholder="Search store name, email or address..."
            aria-label="Search stores"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="stores-table-wrapper">
          <table className="stores-table">
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => handleSort('name')}>
                    Store Name {sortBy === 'name' ? (order === 'ASC' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort('email')}>
                    Email {sortBy === 'email' ? (order === 'ASC' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort('address')}>
                    Address {sortBy === 'address' ? (order === 'ASC' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => handleSort('averageRating')}>
                    Overall Rating {sortBy === 'averageRating' ? (order === 'ASC' ? '↑' : '↓') : '↕'}
                  </button>
                </th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">Loading stores...</td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan="5">No stores found.</td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <div className="store-name-cell">
                        <span className="store-avatar">
                          {store.name.charAt(0)}
                        </span>
                        <strong>{store.name}</strong>
                      </div>
                    </td>

                    <td>{store.email}</td>
                    <td>{store.address}</td>

                    <td>
                      <span className="store-rating">
                        <span>★</span>{' '}
                        {Number(store.averageRating || 0).toFixed(1)}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="store-view-button"
                        onClick={() =>
                          navigate(`/users-management`)
                        }
                        aria-label={`View owner for ${store.name}`}
                      >
                        View owner list
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="stores-table-footer">
          <span>
            {loading ? 'Loading records...' : `Showing ${stores.length} records`}
          </span>
          <span>Sort: {sortBy} ({order})</span>
        </footer>
      </section>
    </main>
  )
}

export default StoreManagement
