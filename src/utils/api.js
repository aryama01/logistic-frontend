import axios from 'axios'

const API = 'https://logistic-backend-umhs.onrender.com' || '/api'

export const api = {
  // Locations
  getLocations: () => axios.get(`${API}/locations`).then(r => r.data),
  addLocation: (data) => axios.post(`${API}/locations`, data).then(r => r.data),
  deleteLocation: (id) => axios.delete(`${API}/locations/${id}`).then(r => r.data),

  // Routes
  getRoutes: () => axios.get(`${API}/routes`).then(r => r.data),
  optimizeRoute: (locationIds) => axios.post(`${API}/routes/optimize`, { locationIds }).then(r => r.data),
  createRoute: (name, locationIds) => axios.post(`${API}/routes`, { name, locationIds }).then(r => r.data),
  updateRouteStatus: (id, status) => axios.patch(`${API}/routes/${id}/status`, { status }).then(r => r.data),
  deleteRoute: (id) => axios.delete(`${API}/routes/${id}`).then(r => r.data),
}
