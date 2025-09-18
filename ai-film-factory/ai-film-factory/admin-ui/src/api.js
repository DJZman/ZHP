const API = (path, opts={}) => fetch(`http://localhost:8000${path}`, {
  headers: { 'Content-Type': 'application/json' },
  ...opts
}).then(r => r.json())

export const listFranchises = () => API('/franchises')
export const getFranchise = (id) => API(`/franchises/${id}`)
export const createFranchise = (payload) => API('/franchises', { method:'POST', body: JSON.stringify(payload) })
export const updateFranchise = (id, payload) => API(`/franchises/${id}`, { method:'PUT', body: JSON.stringify(payload) })
export const deleteFranchise = (id) => API(`/franchises/${id}`, { method:'DELETE' })

export const listCharacters = (fid) => API(`/franchises/${fid}/characters`)
export const createCharacter = (fid, payload) => API(`/franchises/${fid}/characters`, { method:'POST', body: JSON.stringify(payload) })
export const updateCharacter = (id, payload) => API(`/characters/${id}`, { method:'PUT', body: JSON.stringify(payload) })
export const deleteCharacter = (id) => API(`/characters/${id}`, { method:'DELETE' })

export const createProject = (payload) => API('/projects/from-franchise', { method:'POST', body: JSON.stringify(payload) })

export const seedDev = () => API('/seed/dev', { method:'POST' })
