
const API_BASE_URL = 'http://localhost:5000/api'

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    ...options.headers,
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error(
      'Backend se connection nahi ho raha. Check karo ki backend port 5000 par chal raha hai.'
    )
  }

  const contentType = response.headers.get('content-type') || ''
  let data

  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = {}
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`
    )
  }

  return data
}
