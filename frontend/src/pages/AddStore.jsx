
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './AddStore.css'

function AddStore() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Find the existing Store Owner account by email
      const usersResponse = await apiRequest(
        `/users?email=${encodeURIComponent(ownerEmail.trim())}&role=owner`
      )

      const owner = usersResponse.data?.find(
        (user) => user.email.toLowerCase() === ownerEmail.trim().toLowerCase()
      )

      if (!owner) {
        throw new Error(
          'No Store Owner account found with this email. Create the owner account first.'
        )
      }

      // Create the store
      const response = await apiRequest('/stores', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          address: address.trim(),
          owner_id: owner.id,
        }),
      })

      setSuccess(response.message || 'Store created successfully.')

      setTimeout(() => {
        navigate('/stores-management')
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to create store.')
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
    <main className="add-store-page">
      <header className="add-store-header">
        <a href="/admin" className="add-store-brand">
          <span className="add-store-brand-icon">S</span>
          <span>StoreRate</span>
        </a>

        <button
          type="button"
          className="add-store-logout"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>

      <section className="add-store-content">
        <div className="add-store-breadcrumb">
          <a href="/admin">Dashboard</a>
          <span>/</span>
          <a href="/stores-management">Store Management</a>
          <span>/</span>
          <span>Add Store</span>
        </div>

        <div className="add-store-heading">
          <div className="add-store-heading-icon">+</div>
          <div>
            <h1>Add a new store</h1>
            <p>
              Register a store so users can discover it and submit ratings.
            </p>
          </div>
        </div>

        <form className="add-store-form" onSubmit={handleSubmit}>
          <div className="add-store-section-heading">
            <h2>Store information</h2>
            <p>Enter the store details below.</p>
          </div>

          <div className="add-store-fields">
            <div className="add-store-field">
              <label htmlFor="store-name">Store name</label>
              <input
                id="store-name"
                name="name"
                type="text"
                placeholder="Enter store name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                minLength={20}
                maxLength={60}
                required
              />
              <small>Must contain 20–60 characters.</small>
            </div>

            <div className="add-store-field">
              <label htmlFor="store-email">Store email address</label>
              <input
                id="store-email"
                name="email"
                type="email"
                placeholder="store@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="add-store-field add-store-field-full">
              <label htmlFor="store-address">Store address</label>
              <textarea
                id="store-address"
                name="address"
                placeholder="Enter the complete store address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                maxLength={400}
                rows={4}
                required
              />
              <small>Maximum 400 characters.</small>
            </div>

            <div className="add-store-field">
              <label htmlFor="store-owner-email">Store owner email</label>
              <input
                id="store-owner-email"
                name="ownerEmail"
                type="email"
                placeholder="owner@example.com"
                value={ownerEmail}
                onChange={(event) => setOwnerEmail(event.target.value)}
                required
              />
              <small>The owner must have an account with the Store Owner role.</small>
            </div>
          </div>

          {error && (
            <p role="alert" className="add-store-error">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="add-store-success">
              {success}
            </p>
          )}

          <div className="add-store-form-actions">
            <button
              type="button"
              className="add-store-cancel"
              onClick={() => navigate('/stores-management')}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="add-store-submit"
              disabled={loading}
            >
              {loading ? 'Adding store...' : 'Add store'}
            </button>
          </div>
        </form>

        <p className="add-store-note">
          StoreRate Admin Portal · Store registration
        </p>
      </section>
    </main>
  )
}

export default AddStore
