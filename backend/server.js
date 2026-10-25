
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authorizeRole = require('./middleware/authorizeRole')
const authenticateToken = require('./middleware/auth')
const jwt = require('jsonwebtoken')
const pool = require('./db')
const bcrypt = require('bcryptjs')
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'StoreRate API is running successfully!',
  })
})

app.get('/api/health/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT VERSION() AS version, DATABASE() AS database_name')

    res.json({
      message: 'MySQL connection successful!',
      database: rows[0].database_name,
      mysqlVersion: rows[0].version,
    })
  } catch (error) {
    console.error('Database connection error:', error.message)

    res.status(500).json({
      message: 'MySQL connection failed.',
    })
  }
})


app.get(
  '/api/users',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const {
        name = '',
        email = '',
        address = '',
        role = '',
        sortBy = 'name',
        order = 'ASC',
      } = req.query

      const allowedSortFields = {
        id: 'id',
        name: 'name',
        email: 'email',
        address: 'address',
        role: 'role',
        created_at: 'created_at',
      }

      const sortColumn = allowedSortFields[sortBy] || 'name'
      const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

      const conditions = []
      const values = []

      if (name.trim()) {
        conditions.push('name LIKE ?')
        values.push(`%${name.trim()}%`)
      }

      if (email.trim()) {
        conditions.push('email LIKE ?')
        values.push(`%${email.trim()}%`)
      }

      if (address.trim()) {
        conditions.push('address LIKE ?')
        values.push(`%${address.trim()}%`)
      }

      if (role.trim()) {
        if (!['admin', 'user', 'owner'].includes(role.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role filter.',
          })
        }

        conditions.push('role = ?')
        values.push(role.trim())
      }

      let sql = `
        SELECT id, name, email, address, role, created_at
        FROM users
      `

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`
      }

      sql += ` ORDER BY ${sortColumn} ${sortOrder}`

      const [users] = await pool.execute(sql, values)

      res.json({
        success: true,
        count: users.length,
        data: users,
      })
    } catch (error) {
      console.error('Fetch users error:', error.message)

      res.status(500).json({
        success: false,
        message: 'Failed to fetch users.',
      })
    }
  }
)


app.get(
  '/api/users/:id',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const userId = Number(req.params.id)

      // 1. Validate user ID
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid user ID.',
        })
      }

      // 2. Fetch user details
      const [users] = await pool.execute(
        `SELECT id, name, email, address, role, created_at
         FROM users
         WHERE id = ?`,
        [userId]
      )

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        })
      }

      const user = users[0]

      // 3. For Store Owners, fetch store and rating details
      if (user.role === 'owner') {
        const [stores] = await pool.execute(
          `SELECT
             s.id AS storeId,
             s.name AS storeName,
             s.email AS storeEmail,
             s.address AS storeAddress,
             COALESCE(ROUND(AVG(r.rating), 1), 0) AS averageRating,
             COUNT(r.id) AS totalRatings
           FROM stores s
           LEFT JOIN ratings r ON r.store_id = s.id
           WHERE s.owner_id = ?
           GROUP BY s.id, s.name, s.email, s.address`,
          [userId]
        )

        user.store = stores.length > 0 ? stores[0] : null
      }

      // 4. Return user details
      return res.status(200).json({
        success: true,
        data: user,
      })
    } catch (error) {
      console.error('Fetch user details error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user details.',
      })
    }
  }
)


app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, address } = req.body

    if (!name || !email || !password || !address) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.',
      })
    }

    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedAddress = address.trim()

    if (trimmedName.length < 20 || trimmedName.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 20 and 60 characters.',
      })
    }

    if (trimmedAddress.length > 400) {
      return res.status(400).json({
        success: false,
        message: 'Address must not exceed 400 characters.',
      })
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    const passwordPattern =
      /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/

    if (!passwordPattern.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be 8–16 characters with an uppercase letter and a special character.',
      })
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password, address, role)
       VALUES (?, ?, ?, ?, 'user')`,
      [trimmedName, normalizedEmail, hashedPassword, trimmedAddress]
    )

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: result.insertId,
        name: trimmedName,
        email: normalizedEmail,
        address: trimmedAddress,
        role: 'user',
      },
    })
  } catch (error) {
    console.error('Signup error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to create account.',
    })
  }
})


app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const [users] = await pool.execute(
      `SELECT id, name, email, password, address, role
       FROM users
       WHERE email = ?`,
      [normalizedEmail]
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const user = users[0]
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    )

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
      }
    )

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error.message)

    res.status(500).json({
      success: false,
      message: 'Unable to log in.',
    })
  }
})

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token verified successfully.',
    user: req.user,
  })
})

app.get(
  '/api/admin/test',
  authenticateToken,
  authorizeRole('admin'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin access granted!',
    })
  }
)

app.get(
  '/api/admin/dashboard',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const [userRows] = await pool.query(
        'SELECT COUNT(*) AS totalUsers FROM users'
      )

      const [storeRows] = await pool.query(
        'SELECT COUNT(*) AS totalStores FROM stores'
      )

      const [ratingRows] = await pool.query(
        'SELECT COUNT(*) AS totalRatings FROM ratings'
      )

      res.json({
        success: true,
        data: {
          totalUsers: userRows[0].totalUsers,
          totalStores: storeRows[0].totalStores,
          totalRatings: ratingRows[0].totalRatings,
        },
      })
    } catch (error) {
      console.error('Dashboard error:', error.message)

      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics.',
      })
    }
  }
)


app.get(
  '/api/stores',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const {
        name = '',
        email = '',
        address = '',
        sortBy = 'id',
        order = 'DESC',
      } = req.query

      // Allow sorting only by these fields
      const allowedSortFields = {
        id: 's.id',
        name: 's.name',
        email: 's.email',
        address: 's.address',
        averageRating: 'averageRating',
        totalRatings: 'totalRatings',
      }

      const sortColumn = allowedSortFields[sortBy] || 's.id'
      const sortOrder =
        order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

      // Build filters safely using parameterized queries
      const conditions = []
      const values = []

      if (name.trim()) {
        conditions.push('s.name LIKE ?')
        values.push(`%${name.trim()}%`)
      }

      if (email.trim()) {
        conditions.push('s.email LIKE ?')
        values.push(`%${email.trim()}%`)
      }

      if (address.trim()) {
        conditions.push('s.address LIKE ?')
        values.push(`%${address.trim()}%`)
      }

      let sql = `
        SELECT
          s.id,
          s.name,
          s.email,
          s.address,
          s.owner_id,
          COALESCE(ROUND(AVG(r.rating), 1), 0) AS averageRating,
          COUNT(r.id) AS totalRatings
        FROM stores s
        LEFT JOIN ratings r ON s.id = r.store_id
      `

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`
      }

      sql += `
        GROUP BY
          s.id,
          s.name,
          s.email,
          s.address,
          s.owner_id
        ORDER BY ${sortColumn} ${sortOrder}
      `

      const [stores] = await pool.execute(sql, values)

      return res.status(200).json({
        success: true,
        count: stores.length,
        data: stores,
      })
    } catch (error) {
      console.error('Fetch stores error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch stores.',
      })
    }
  }
)



app.post(
  '/api/stores',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const { name, email, address, owner_id } = req.body

      // Check required fields
      if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof address !== 'string' ||
        owner_id === undefined ||
        owner_id === null ||
        String(owner_id).trim() === ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required.',
        })
      }

      const trimmedName = name.trim()
      const normalizedEmail = email.trim().toLowerCase()
      const trimmedAddress = address.trim()
      const ownerId = Number(owner_id)

      // Validate store name: 20–60 characters
      if (trimmedName.length < 20 || trimmedName.length > 60) {
        return res.status(400).json({
          success: false,
          message: 'Store name must be between 20 and 60 characters.',
        })
      }

      // Validate address: maximum 400 characters
      if (trimmedAddress.length === 0 || trimmedAddress.length > 400) {
        return res.status(400).json({
          success: false,
          message: 'Address is required and must not exceed 400 characters.',
        })
      }

      // Validate email format
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        })
      }

      // Validate owner ID
      if (!Number.isInteger(ownerId) || ownerId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid store owner.',
        })
      }

      // Confirm that the selected user exists and has the owner role
      const [owners] = await pool.execute(
        'SELECT id FROM users WHERE id = ? AND role = ?',
        [ownerId, 'owner']
      )

      if (owners.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'A valid store owner account is required.',
        })
      }

      // Create store
      const [result] = await pool.execute(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES (?, ?, ?, ?)`,
        [trimmedName, normalizedEmail, trimmedAddress, ownerId]
      )

      return res.status(201).json({
        success: true,
        message: 'Store created successfully.',
        store: {
          id: result.insertId,
          name: trimmedName,
          email: normalizedEmail,
          address: trimmedAddress,
          owner_id: ownerId,
        },
      })
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Store email or owner assignment already exists.',
        })
      }

      console.error('Create store error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Failed to create store.',
      })
    }
  }
)


app.post(
  '/api/stores/:storeId/rating',
  authenticateToken,
  authorizeRole('user'),
  async (req, res) => {
    try {
      const storeId = Number(req.params.storeId)
      const rating = Number(req.body.rating)
      const userId = req.user.id

      if (!Number.isInteger(storeId) || storeId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid store ID.',
        })
      }

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be an integer between 1 and 5.',
        })
      }

      const [stores] = await pool.execute(
        'SELECT id FROM stores WHERE id = ?',
        [storeId]
      )

      if (stores.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Store not found.',
        })
      }

      const [existingRatings] = await pool.execute(
        'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
        [userId, storeId]
      )

      if (existingRatings.length > 0) {
        await pool.execute(
          `UPDATE ratings
           SET rating = ?
           WHERE user_id = ? AND store_id = ?`,
          [rating, userId, storeId]
        )

        return res.json({
          success: true,
          message: 'Rating updated successfully.',
        })
      }

      await pool.execute(
        `INSERT INTO ratings (user_id, store_id, rating)
         VALUES (?, ?, ?)`,
        [userId, storeId, rating]
      )

      return res.status(201).json({
        success: true,
        message: 'Rating submitted successfully.',
      })
    } catch (error) {
      console.error('Submit rating error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Failed to submit rating.',
      })
    }
  }
)


app.get(
  '/api/owner/dashboard',
  authenticateToken,
  authorizeRole('owner'),
  async (req, res) => {
    try {
      // Fetch the store assigned to the logged-in owner
      const [stores] = await pool.execute(
        `SELECT
           s.id,
           s.name,
           s.email,
           s.address,
           COALESCE(ROUND(AVG(r.rating), 1), 0) AS averageRating,
           COUNT(r.id) AS totalRatings
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.owner_id = ?
         GROUP BY
           s.id,
           s.name,
           s.email,
           s.address`,
        [req.user.id]
      )

      if (stores.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No store is assigned to this owner.',
        })
      }

      const store = stores[0]

      // Fetch customer details and the latest rating timestamp
      const [ratings] = await pool.execute(
        `SELECT
           u.id AS userId,
           u.name AS userName,
           u.email AS userEmail,
           r.rating AS rating,
           r.updated_at AS ratedAt
         FROM ratings r
         INNER JOIN users u ON r.user_id = u.id
         WHERE r.store_id = ?
         ORDER BY r.updated_at DESC`,
        [store.id]
      )

      // Temporary debugging log; remove after verification
      console.log(
        'Owner dashboard ratings:',
        ratings.map((item) => ({
          userId: item.userId,
          userName: item.userName,
          hasEmail: Boolean(item.userEmail),
          rating: item.rating,
          ratedAt: item.ratedAt,
        }))
      )

      return res.status(200).json({
        success: true,
        data: {
          store,
          ratings,
        },
      })
    } catch (error) {
      console.error('Owner dashboard error:', error)

      return res.status(500).json({
        success: false,
        message: 'Failed to fetch owner dashboard.',
      })
    }
  }
)


app.get(
  '/api/user/stores',
  authenticateToken,
  authorizeRole('user'),
  async (req, res) => {
    try {
      const { search = '' } = req.query

      const searchTerm = `%${search.trim()}%`

      const [stores] = await pool.execute(
        `SELECT
           s.id,
           s.name,
           s.address,
           COALESCE(ROUND(AVG(r.rating), 1), 0) AS averageRating,
           COUNT(r.id) AS totalRatings,
           MAX(
             CASE
               WHEN r.user_id = ? THEN r.rating
               ELSE NULL
             END
           ) AS myRating
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.name LIKE ? OR s.address LIKE ?
         GROUP BY s.id
         ORDER BY s.name ASC`,
        [req.user.id, searchTerm, searchTerm]
      )

      res.json({
        success: true,
        count: stores.length,
        data: stores,
      })
    } catch (error) {
      console.error('User stores error:', error.message)

      res.status(500).json({
        success: false,
        message: 'Failed to fetch stores.',
      })
    }
  }
)


app.put(
  '/api/auth/update-password',
  authenticateToken,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body

      // Validate required fields
      if (
        typeof currentPassword !== 'string' ||
        typeof newPassword !== 'string' ||
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required.',
        })
      }

      // Validate new password: 8–16 characters,
      // at least one uppercase letter and one special character
      const passwordPattern =
        /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/

      if (!passwordPattern.test(newPassword)) {
        return res.status(400).json({
          success: false,
          message:
            'New password must be 8–16 characters with an uppercase letter and a special character.',
        })
      }

      // Fetch the authenticated user
      const [users] = await pool.execute(
        'SELECT id, password FROM users WHERE id = ?',
        [req.user.id]
      )

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        })
      }

      // Verify current password
      const passwordMatches = await bcrypt.compare(
        currentPassword,
        users[0].password
      )

      if (!passwordMatches) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.',
        })
      }

      // Prevent reusing the current password
      const samePassword = await bcrypt.compare(
        newPassword,
        users[0].password
      )

      if (samePassword) {
        return res.status(400).json({
          success: false,
          message:
            'New password must be different from the current password.',
        })
      }

      // Hash and save the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, req.user.id]
      )

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully.',
      })
    } catch (error) {
      console.error('Update password error:', error.message)

      return res.status(500).json({
        success: false,
        message: 'Failed to update password.',
      })
    }
  }
)



app.post(
  '/api/admin/users',
  authenticateToken,
  authorizeRole('admin'),
  async (req, res) => {
    try {
      const { name, email, password, address, role } = req.body

      // 1. Check required fields
      if (!name || !email || !password || !address || !role) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required.',
        })
      }

      // 2. Normalize input
      const trimmedName = name.trim()
      const normalizedEmail = email.trim().toLowerCase()
      const trimmedAddress = address.trim()

      // 3. Validate name (20–60 characters)
      if (trimmedName.length < 20 || trimmedName.length > 60) {
        return res.status(400).json({
          success: false,
          message: 'Name must be between 20 and 60 characters.',
        })
      }

      // 4. Validate address (maximum 400 characters)
      if (trimmedAddress.length > 400) {
        return res.status(400).json({
          success: false,
          message: 'Address must not exceed 400 characters.',
        })
      }

      // 5. Validate role
      if (!['admin', 'user', 'owner'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be admin, user, or owner.',
        })
      }

      // 6. Validate email
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.',
        })
      }

      // 7. Validate password (8–16 chars, uppercase, special character)
      const passwordPattern = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/

      if (!passwordPattern.test(password)) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be 8–16 characters with an uppercase letter and a special character.',
        })
      }

      // 8. Check if email already exists
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [normalizedEmail]
      )

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        })
      }

      // 9. Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 12)

      // 10. Insert user into database
      const [result] = await pool.execute(
        `INSERT INTO users (name, email, password, address, role)
         VALUES (?, ?, ?, ?, ?)`,
        [trimmedName, normalizedEmail, hashedPassword, trimmedAddress, role]
      )

      // 11. Send successful response
      return res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: {
          id: result.insertId,
          name: trimmedName,
          email: normalizedEmail,
          address: trimmedAddress,
          role,
        },
      })
    } catch (error) {
      console.error('Create user error:', error.message)

      // Handle duplicate email in case of a concurrent request
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        })
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create user.',
      })
    }
  }
)


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
