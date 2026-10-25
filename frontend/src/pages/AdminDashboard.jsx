
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalRatings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const fetchDashboard = async () => {
      try {
        const response = await apiRequest('/admin/dashboard')

        if (active) {
          setStats(response.data)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load dashboard.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchDashboard()

    return () => {
      active = false
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">S</span>
          <span>StoreRate</span>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link active">
            <span>▦</span> Dashboard
          </Link>

          <Link to="/stores-management" className="admin-nav-link">
            <span>▣</span> Stores
          </Link>

          <Link to="/users-management" className="admin-nav-link">
            <span>♙</span> Users
          </Link>

          <Link to="/stores-management" className="admin-nav-link">
            <span>☆</span> Ratings
          </Link>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-avatar">A</div>
          <div className="admin-profile">
            <strong>Administrator</strong>
            <span>System Admin</span>
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">Workspace / Overview</p>
            <h1>Dashboard</h1>
          </div>

          <button
            className="admin-logout"
            type="button"
            onClick={handleLogout}
          >
            ↪ Log out
          </button>
        </header>

        <div className="admin-content">
          <section className="admin-welcome">
            <div>
              <p className="welcome-eyebrow">ADMINISTRATION</p>
              <h2>Welcome back, Admin!</h2>
              <p>Here is an overview of your StoreRate platform.</p>
            </div>
            <div className="welcome-icon">✦</div>
          </section>

          {error && (
            <p role="alert" className="dashboard-error">
              {error}
            </p>
          )}

          <section className="admin-stats">
            <article className="admin-stat-card">
              <div className="stat-top">
                <span>Total Users</span>
                <span className="stat-icon blue">♙</span>
              </div>
              <strong>
                {loading ? '...' : stats.totalUsers.toLocaleString()}
              </strong>
              <p>Registered platform users</p>
            </article>

            <article className="admin-stat-card">
              <div className="stat-top">
                <span>Total Stores</span>
                <span className="stat-icon purple">▣</span>
              </div>
              <strong>
                {loading ? '...' : stats.totalStores.toLocaleString()}
              </strong>
              <p>Stores listed on the platform</p>
            </article>

            <article className="admin-stat-card">
              <div className="stat-top">
                <span>Submitted Ratings</span>
                <span className="stat-icon amber">☆</span>
              </div>
              <strong>
                {loading ? '...' : stats.totalRatings.toLocaleString()}
              </strong>
              <p>Total ratings received</p>
            </article>
          </section>

          <section className="admin-overview">
            <div className="overview-heading">
              <div>
                <h2>Platform overview</h2>
                <p>Manage your users and registered stores.</p>
              </div>
              <span className="overview-badge">Admin panel</span>
            </div>

            <div className="admin-action-grid">
              <article className="admin-action-card">
                <div className="action-icon blue">♙</div>
                <h3>User management</h3>
                <p>View user details, manage accounts and review roles.</p>
                <Link to="/users-management">
                  Manage users <span>→</span>
                </Link>
              </article>

              <article className="admin-action-card">
                <div className="action-icon purple">▣</div>
                <h3>Store management</h3>
                <p>Review registered stores and their overall ratings.</p>
                <Link to="/stores-management">
                  Manage stores <span>→</span>
                </Link>
              </article>

              <article className="admin-action-card">
                <div className="action-icon amber">☆</div>
                <h3>Rating overview</h3>
                <p>Keep track of ratings submitted across the platform.</p>
                <Link to="/stores-management">
                  View ratings <span>→</span>
                </Link>
              </article>
            </div>
          </section>

          <footer className="admin-footer">
            StoreRate Admin Panel <span>•</span> Store rating management
          </footer>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard
