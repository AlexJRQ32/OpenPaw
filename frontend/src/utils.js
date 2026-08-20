import { LOCAL_REGISTRY_KEY, LOCAL_STORE_REGISTRY_KEY } from './constants'

export function normalize(value) {
  return value.trim().toLowerCase()
}

export function readSubmittedBusinesses() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_REGISTRY_KEY)) ?? []
  } catch {
    return []
  }
}

export function rememberSubmittedBusiness(form) {
  const registered = readSubmittedBusinesses()
  registered.push({
    cedulaJuridica: normalize(form.cedulaJuridica),
    nombreComercio: normalize(form.nombreComercio),
  })
  localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(registered))
}

export function isKnownBusiness(form) {
  const registered = readSubmittedBusinesses()
  const cedula = normalize(form.cedulaJuridica)
  const name = normalize(form.nombreComercio)

  return registered.some(
    (business) => business.cedulaJuridica === cedula || business.nombreComercio === name,
  )
}

export function readSubmittedStores() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORE_REGISTRY_KEY)) ?? []
  } catch {
    return []
  }
}

export function rememberSubmittedStore(form) {
  const registered = readSubmittedStores()
  registered.push({
    cedulaJuridica: normalize(form.cedulaJuridica),
    nombreAlmacen: normalize(form.nombreAlmacen),
  })
  localStorage.setItem(LOCAL_STORE_REGISTRY_KEY, JSON.stringify(registered))
}

export function isKnownStore(form) {
  const registered = readSubmittedStores()
  const cedula = normalize(form.cedulaJuridica)
  const name = normalize(form.nombreAlmacen)

  return registered.some(
    (store) => store.cedulaJuridica === cedula || store.nombreAlmacen === name,
  )
}
