// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Token storage key
export const TOKEN_KEY = 'favlinks_token'

// Action types (for consistency)
export const ACTIONS = {
  CREATE_LINK: 'create_link',
  DELETE_LINK: 'delete_link',
  UPDATE_ADMIN: 'update_admin_flag',
  DELETE_USER: 'delete_user',
  DELETE_USER_LINKS: 'delete_user_links',
  CLEAR_ACTIVITY: 'clear_activity',
}
