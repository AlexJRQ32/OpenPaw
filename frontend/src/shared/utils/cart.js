const ANON_CART_KEY = 'openpaw_cart_anon'

function userCartKey(userId) {
  return `openpaw_cart_user_${userId}`
}

function cartKey(userId) {
  return userId ? userCartKey(userId) : ANON_CART_KEY
}

// Clave unica de un item: inventarioId (producto+almacen) o productoId (compat con carritos viejos)
function itemKey(item) {
  return item.inventarioId != null ? String(item.inventarioId) : String(item.productoId)
}

function readCart(key) {
  try {
    const raw = localStorage.getItem(key)
    const items = raw ? JSON.parse(raw) : []
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

function writeCart(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
}

export function getCart(userId) {
  return readCart(cartKey(userId))
}

export function addToCart(userId, producto, cantidad = 1) {
  const key = cartKey(userId)
  const items = readCart(key)
  const newKey = itemKey(producto)
  const existing = items.find((item) => itemKey(item) === newKey)
  const stock = Number(producto.stock)
  const tieneStock = !Number.isNaN(stock) && stock > 0

  if (existing) {
    const nuevaCantidad = existing.cantidad + cantidad
    existing.cantidad = tieneStock ? Math.min(nuevaCantidad, stock) : nuevaCantidad
  } else {
    const nuevaCantidad = tieneStock ? Math.min(cantidad, stock) : cantidad
    items.push({
      productoId: producto.id,
      inventarioId: producto.inventarioId ?? null,
      nombre: producto.nombre,
      precio: producto.precio,
      imagenUrl: producto.imagenUrl,
      veterinariaId: producto.veterinariaId,
      veterinariaNombre: producto.veterinariaNombre,
      almacenId: producto.almacenId,
      almacenNombre: producto.almacenNombre,
      stock,
      cantidad: nuevaCantidad,
    })
  }
  writeCart(key, items)
  return items
}

export function updateQuantity(userId, itemId, cantidad) {
  const key = cartKey(userId)
  const items = readCart(key)
  const item = items.find((i) => itemKey(i) === String(itemId))
  if (!item) return items

  const clamped = Math.max(1, Math.floor(cantidad))
  const max = Number(item.stock)
  item.cantidad = Number.isFinite(max) && max > 0 ? Math.min(clamped, max) : clamped
  writeCart(key, items)
  return items
}

export function removeFromCart(userId, itemId) {
  const key = cartKey(userId)
  const items = readCart(key).filter((item) => itemKey(item) !== String(itemId))
  writeCart(key, items)
  return items
}

export function clearCart(userId) {
  const key = cartKey(userId)
  writeCart(key, [])
  return []
}

export function cartSubtotal(userId) {
  return getCart(userId).reduce((acc, item) => acc + (Number(item.precio) || 0) * item.cantidad, 0)
}

export function cartCount(userId) {
  return getCart(userId).reduce((acc, item) => acc + item.cantidad, 0)
}

export function migrateAnonymousCart(userId) {
  if (!userId) return
  const anonItems = readCart(ANON_CART_KEY)
  if (anonItems.length === 0) return

  const userKey = userCartKey(userId)
  const userItems = readCart(userKey)
  anonItems.forEach((anonItem) => {
    const k = itemKey(anonItem)
    const existing = userItems.find((item) => itemKey(item) === k)
    if (existing) existing.cantidad += anonItem.cantidad
    else userItems.push(anonItem)
  })
  writeCart(userKey, userItems)
  localStorage.removeItem(ANON_CART_KEY)
}
