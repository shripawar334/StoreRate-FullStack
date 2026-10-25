
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../services/api'
import './Signup.css'

function Signup() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
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
      setError('Name must be between 20 and 60 characters.')
      return
    }

    if (
      password.length < 8 ||
      password.length > 16 ||
      !/[A-Z]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setError(
        'Password must be 8–16 characters, including an uppercase letter and a special character.'
      )
      return
    }

    setLoading(true)

    try {
      const response = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          address: trimmedAddress,
          password,
        }),
      })

      setSuccess(
        response.message || 'Account created successfully! Please sign in.'
      )

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    } catch (err) {
      setError(err.message || 'Unable to create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="signup-page">
      <section className="signup-card">
        <div className="signup-brand">
          <div className="signup-brand-icon">S</div>
          <span>StoreRate</span>
        </div>

        <div className="signup-heading">
          <h1>Create your account</h1>
          <p>Join StoreRate and share your store experiences.</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="signup-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={20}
              maxLength={60}
              autoComplete="name"
              required
            />
            <small>Name must be between 20 and 60 characters.</small>
          </div>

          <div className="signup-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="signup-field">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              placeholder="Enter your address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={400}
              autoComplete="street-address"
              rows={3}
              required
            />
            <small>Maximum 400 characters.</small>
          </div>

          <div className="signup-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              placeholder="Create a password"
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

          {error && (
            <p role="alert" className="signup-error">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="signup-success">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="signup-login-prompt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}

export default Signup
