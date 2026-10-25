
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './AddUser.css'

function AddUser() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const trimmedAddress = address.trim()

    if (trimmedName.length < 20 || trimmedName.length > 60) {
      setError('Name must contain 20–60 characters.')
      return
    }

    if (trimmedAddress.length > 400) {
      setError('Address cannot exceed 400 characters.')
      return
    }

    if (
      password.length < 8 ||
      password.length > 16 ||
      !/[A-Z]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        'Password must be 8–16 characters and include an uppercase letter and a special character.'
      )
      return
    }

    setLoading(true)

    try {
      const response = await apiRequest('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          address: trimmedAddress,
          password,
          role,
        }),
      })

      setSuccess(response.message || 'User created successfully.')

      setTimeout(() => {
        navigate('/users-management')
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to create user.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login', { replace: true })
  }

  return (
    <main className="add-user-page">
      <header className="add-user-header">
        <a href="/admin" className="add-user-brand">
          <span className="add-user-brand-icon">S</span>
          <span>StoreRate</span>
        </a>

        <button
          type="button"
          className="add-user-logout"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>

      <section className="add-user-content">
        <div className="add-user-breadcrumb">
          <a href="/admin">Dashboard</a>
          <span>/</span>
          <a href="/users-management">User Management</a>
          <span>/</span>
          <span>Add User</span>
        </div>

        <div className="add-user-heading">
          <div className="add-user-heading-icon">+</div>
          <div>
            <h1>Add a new user</h1>
            <p>Create an account for a user, store owner or administrator.</p>
          </div>
        </div>

        <form className="add-user-form" onSubmit={handleSubmit}>
          <div className="add-user-section-heading">
            <h2>Personal information</h2>
            <p>Enter the user's details and account credentials.</p>
          </div>

          <div className="add-user-fields">
            <div className="add-user-field">
              <label htmlFor="user-name">Full name</label>
              <input
                id="user-name"
                name="name"
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={20}
                maxLength={60}
                required
              />
              <small>Name must contain 20–60 characters.</small>
            </div>

            <div className="add-user-field">
              <label htmlFor="user-email">Email address</label>
              <input
                id="user-email"
                name="email"
                type="email"
                placeholder="user@example.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="add-user-field add-user-field-full">
              <label htmlFor="user-address">Address</label>
              <textarea
                id="user-address"
                name="address"
                placeholder="Enter complete address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={400}
                rows={3}
                required
              />
              <small>Maximum 400 characters.</small>
            </div>

            <div className="add-user-field">
              <label htmlFor="user-password">Initial password</label>
              <input
                id="user-password"
                name="password"
                type="password"
                placeholder="Create initial password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                maxLength={16}
                autoComplete="new-password"
                required
              />
              <small>
                8–16 characters, including an uppercase letter and a special
                character.
              </small>
            </div>

            <div className="add-user-field">
              <label htmlFor="user-role">Account role</label>
              <select
                id="user-role"
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                required
              >
                <option value="user">Normal User</option>
                <option value="owner">Store Owner</option>
                <option value="admin">System Administrator</option>
              </select>
              <small>Choose the access level for this account.</small>
            </div>
          </div>

          {error && (
            <p role="alert" className="add-user-error">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="add-user-success">
              {success}
            </p>
          )}

          <div className="add-user-form-actions">
            <button
              type="button"
              className="add-user-cancel"
              onClick={() => navigate('/users-management')}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-user-submit"
              disabled={loading}
            >
              {loading ? 'Creating user...' : 'Create user'}
            </button>
          </div>
        </form>

        <p className="add-user-note">
          StoreRate Admin Portal · User registration
        </p>
      </section>
    </main>
  )
}

export default AddUser
