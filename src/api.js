import { API_URL, TOKEN_KEY } from './config'

/**
 * Get auth headers if token exists
 */
export function authHeaders(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}`, ...extra } : { ...extra }
}

/**
 * Wrapper around fetch with base URL and optional auth
 */
export async function apiFetch(path, options = {}) {
  const { auth = true, ...fetchOptions } = options
  const headers = auth ? authHeaders(fetchOptions.headers || {}) : (fetchOptions.headers || {})
  
  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  })
  
  return res
}

/**
 * POST JSON helper
 */
export async function apiPost(path, body, options = {}) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  })
}

/**
 * PUT JSON helper
 */
export async function apiPut(path, body, options = {}) {
  return apiFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...options,
  })
}

/**
 * DELETE helper
 */
export async function apiDelete(path, options = {}) {
  return apiFetch(path, {
    method: 'DELETE',
    ...options,
  })
}

/**
 * Clear token and reload (for 401/403 handling)
 */
export function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY)
  window.location.reload()
}
