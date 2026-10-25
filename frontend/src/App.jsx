
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/Login'
import Signup from './pages/Signup'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import StoreManagement from './pages/StoreManagement'
import StoreOwnerDashboard from './pages/StoreOwnerDashboard'
import UpdatePassword from './pages/UpdatePassword'
import StoreListing from './pages/StoreListing'
import AddStore from './pages/AddStore'
import AddUser from './pages/AddUser'

function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />
  }

  let user

  try {
    user = JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }

  if (!user?.role) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />
    }

    if (user.role === 'owner') {
      return <Navigate to="/owner-dashboard" replace />
    }

    if (user.role === 'user') {
      return <Navigate to="/stores" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users-management"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stores-management"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StoreManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-user"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AddUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-store"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AddStore />
            </ProtectedRoute>
          }
        />

        {/* Normal User route */}
        <Route
          path="/stores"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <StoreListing />
            </ProtectedRoute>
          }
        />

        {/* Store Owner route */}
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <StoreOwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Shared route for all logged-in roles */}
        <Route
          path="/update-password"
          element={
            <ProtectedRoute
              allowedRoles={['admin', 'user', 'owner']}
            >
              <UpdatePassword />
            </ProtectedRoute>
          }
        />

        {/* Unknown URLs */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
