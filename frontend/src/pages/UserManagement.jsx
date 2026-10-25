
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './UserManagement.css'

function UserManagement() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [sortBy, setSortBy] = useState('name')
  const [order, setOrder] = useState('ASC')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    let active = true

    const fetchUsers = async () => {
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

        if (role !== 'ALL') {
          params.set('role', role)
        }

        const response = await apiRequest(`/users?${params.toString()}`)

        if (active) {
          setUsers(response.data || [])
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Failed to load users.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchUsers()

    return () => {
      active = false
    }
  }, [search, role, sortBy, order])

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder((current) => current === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(field)
      setOrder('ASC')
    }
  }

  const handleViewDetails = async (userId) => {
    setError('')

    try {
      const response = await apiRequest(`/users/${userId}`)
      setSelectedUser(response.data)
    } catch (err) {
      setError(err.message || 'Failed to load user details.')
    }
  }

  const totalUsers = users.length
  const normalUsers = users.filter((user) => user.role === 'user').length
  const storeOwners = users.filter((user) => user.role === 'owner').length
  const administrators = users.filter((user) => user.role === 'admin').length

  return (
    <main className="users-page">
      <header className="users-header">
        <div>
          <p className="users-breadcrumb">Workspace / Users</p>
          <h1>User Management</h1>
          <p className="users-subtitle">
            View and manage users registered on StoreRate.
          </p>
        </div>

        <button
          type="button"
          className="users-add-button"
          onClick={() => navigate('/add-user')}
        >
          + Add User
        </button>
      </header>

      {error && (
        <p role="alert" className="users-error">
          {error}
        </p>
      )}

      <section className="users-summary">
        <div className="users-summary-card">
          <span>Users in results</span>
          <strong>{totalUsers}</strong>
        </div>

        <div className="users-summary-card">
          <span>Normal Users</span>
          <strong>{normalUsers}</strong>
        </div>

        <div className="users-summary-card">
          <span>Store Owners</span>
          <strong>{storeOwners}</strong>
        </div>

        <div className="users-summary-card">
          <span>Administrators</span>
          <strong>{administrators}</strong>
        </div>
      </section>

      <section className="users-table-card">
        <div className="users-table-heading">
          <div>
            <h2>All Users</h2>
            <p>Browse user information and account roles.</p>
          </div>

          <span className="users-count">
            {loading ? 'Loading...' : `${users.length} records`}
          </span>
        </div>

        <div className="users-filters">
          <input
            type="search"
            placeholder="Search name, email or address..."
            aria-label="Search users"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            aria-label="Filter by role"
          >
            <option value="ALL">All Roles</option>
            <option value="user">Normal User</option>
            <option value="owner">Store Owner</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <button type="button" onClick={() => handleSort('name')}>
                    Name {sortBy === 'name' ? (order === 'ASC' ? '↑' : '↓') : '↕'}
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
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-name-cell">
                        <span className="user-initial">
                          {user.name.charAt(0)}
                        </span>
                        <strong>{user.name}</strong>
                      </div>
                    </td>

                    <td>{user.email}</td>
                    <td>{user.address}</td>

                    <td>
                      <span className={`user-role ${user.role.toLowerCase()}`}>
                        {user.role === 'owner'
                          ? 'STORE OWNER'
                          : user.role === 'admin'
                            ? 'ADMIN'
                            : 'USER'}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="user-view-button"
                        onClick={() => handleViewDetails(user.id)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="users-table-footer">
          <span>{loading ? 'Loading records...' : `Showing ${users.length} records`}</span>
          <span>Sort: {sortBy} ({order})</span>
        </div>
      </section>

      {selectedUser && (
        <div
          className="user-details-overlay"
          onClick={() => setSelectedUser(null)}
        >
          <section
            className="user-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="user-details-title">User Details</h2>
            <p><strong>Name:</strong> {selectedUser.name}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Address:</strong> {selectedUser.address}</p>
            <p><strong>Role:</strong> {selectedUser.role}</p>

            {selectedUser.role === 'owner' && (
              selectedUser.store ? (
                <>
                  <h3>Store Details</h3>
                  <p><strong>Store:</strong> {selectedUser.store.storeName}</p>
                  <p><strong>Average Rating:</strong> {selectedUser.store.averageRating}</p>
                  <p><strong>Total Ratings:</strong> {selectedUser.store.totalRatings}</p>
                </>
              ) : (
                <p>This owner has no store registered yet.</p>
              )
            )}

            <button
              type="button"
              className="user-view-button"
              onClick={() => setSelectedUser(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  )
}

export default UserManagement
