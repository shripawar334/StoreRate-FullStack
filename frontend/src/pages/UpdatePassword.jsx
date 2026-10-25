
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { apiRequest } from '../services/api'
import './UpdatePassword.css'

function UpdatePassword() {
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (
      newPassword.length < 8 ||
      newPassword.length > 16 ||
      !/[A-Z]/.test(newPassword) ||
      !/[^A-Za-z0-9]/.test(newPassword)
    ) {
      setError(
        'New password must be 8–16 characters and include an uppercase letter and a special character.'
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.')
      return
    }

    setLoading(true)

    try {
      // PUT method matches the backend route.
      const response = await apiRequest('/auth/update-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      setSuccess(response.message || 'Password updated successfully.')

      setTimeout(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="update-password-page">
      <section className="update-password-card">
        <Link to="/stores" className="update-password-brand">
          <div className="update-password-brand-icon">S</div>
          <span>StoreRate</span>
        </Link>

        <div className="update-password-heading">
          <h1>Update password</h1>
          <p>Choose a strong password to keep your account secure.</p>
        </div>

        <form className="update-password-form" onSubmit={handleSubmit}>
          <div className="update-password-field">
            <label htmlFor="current-password">Current password</label>

            <div className="password-input-wrapper">
              <input
                id="current-password"
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowCurrentPassword((previous) => !previous)
                }
                aria-label={
                  showCurrentPassword
                    ? 'Hide current password'
                    : 'Show current password'
                }
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          <div className="update-password-field">
            <label htmlFor="new-password">New password</label>

            <div className="password-input-wrapper">
              <input
                id="new-password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={16}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowNewPassword((previous) => !previous)}
                aria-label={
                  showNewPassword ? 'Hide new password' : 'Show new password'
                }
              >
                {showNewPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            <small>
              8–16 characters, with at least one uppercase letter and one
              special character.
            </small>
          </div>

          <div className="update-password-field">
            <label htmlFor="confirm-password">Confirm new password</label>

            <div className="password-input-wrapper">
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={16}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirmation password'
                    : 'Show confirmation password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="update-password-error">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="update-password-success">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="update-password-button"
            disabled={loading}
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>

        <p className="update-password-note">
          Make sure your new password is different from your old one.
        </p>
      </section>
    </main>
  )
}

export default UpdatePassword
