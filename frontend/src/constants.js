export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://openpaw.alwaysdata.net/api'
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '502526650421-o7vf4m2spjq05k8g6sbpaklkr9pb5fr9.apps.googleusercontent.com'
export const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID ?? '2470437836755419'
export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const LOCAL_REGISTRY_KEY = 'openpaw_veterinary_registration_requests'
export const LOCAL_STORE_REGISTRY_KEY = 'openpaw_store_registration_requests'
export const AUTH_TOKEN_KEY = 'openpaw_auth_token'
export const USER_STORAGE_KEY = 'openpaw_user'

export const ROLE_IDS = {
  ADMINISTRADOR: 1,
  VETERINARIA: 2,
  ALMACEN: 3,
  CLIENTE: 4,
}

export const ROLE_LABELS = {
  [ROLE_IDS.ADMINISTRADOR]: 'Administrador',
  [ROLE_IDS.VETERINARIA]: 'Veterinaria',
  [ROLE_IDS.ALMACEN]: 'Almacen',
  [ROLE_IDS.CLIENTE]: 'Cliente',
}

export function getUserRoleId(user) {
  return Number(user?.rolId ?? user?.rol ?? user?.role)
}

export function hasRole(user, roles) {
  return roles.map(Number).includes(getUserRoleId(user))
}

export function isAdmin(user) {
  return getUserRoleId(user) === ROLE_IDS.ADMINISTRADOR
}

export const FUNCIONARIOS_ROLE_IDS = [
  ROLE_IDS.ADMINISTRADOR,
  ROLE_IDS.VETERINARIA,
  ROLE_IDS.ALMACEN,
]

export function canManageFuncionarios(user) {
  return hasRole(user, FUNCIONARIOS_ROLE_IDS)
}

// Roles asignables a un funcionario (Cliente no aplica, ver PBI 53)
export const FUNCIONARIO_ROLES = [
  { id: ROLE_IDS.ADMINISTRADOR, nombre: 'Administrador' },
  { id: ROLE_IDS.VETERINARIA, nombre: 'Veterinaria' },
  { id: ROLE_IDS.ALMACEN, nombre: 'Almacen' },
]

export const initialFuncionarioForm = {
  nombre: '',
  email: '',
  rolId: FUNCIONARIO_ROLES[1].id,
}

export const initialForm = {
  nombreComercio: '',
  cedulaJuridica: '',
  direccion: '',
  telefono: '',
  email: '',
  descripcion: '',
  documentoPersoneriaJuridica: null,
  
}

export const initialStoreRegistrationForm = {
  nombreAlmacen: '',
  cedulaJuridica: '',
  direccion: '',
  telefono: '',
  email: '',
  veterinariaId: '',
  veterinariaNombre: '',
  documentoConstitucion: null,
}

export const initialRegisterForm = {
  nombre: '',
  email: '',
  password: '',
  confirmPassword: '',
  telefono: '',
  direccion: '',
}



