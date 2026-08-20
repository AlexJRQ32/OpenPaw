import { useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import { LandingNavbar } from '../../../shared/components/LandingNavbar/LandingNavbar'
import { Reveal } from '../../../shared/components/Reveal/Reveal'
import { CheckoutAuthModal } from '../../../features/auth/components/CheckoutAuthModal'
import { useMarketplaceProducts } from '../hooks/useMarketplaceProducts'
import { addToCart, cartCount, getCart, cartSubtotal, clearCart } from '../../../shared/utils/cart'
import { CartDrawer } from '../components/CartDrawer'
import { CheckoutSuccessModal } from '../components/CheckoutSuccessModal'
import './MarketplacePage.css'

const ALL_CATEGORIES = 'Todas las categorias'
const ALL_VETS = 'todas'
const ALL_SERVICIO_TIPOS = 'todos'

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false)

  if (!product.imagenUrl || failed) {
    return (
      <div className="mp-card-placeholder" aria-hidden="true">
        <i className="fas fa-paw" />
      </div>
    )
  }

  return (
    <img
      className="mp-card-img"
      src={product.imagenUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function StockBadge({ stock, stockMinimo }) {
  if (stock <= 0) return <span className="mp-stock mp-stock--out">Agotado</span>
  if (stock <= stockMinimo) return <span className="mp-stock mp-stock--low">Stock bajo</span>
  return <span className="mp-stock mp-stock--ok">Disponible</span>
}

export function MarketplacePage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { products, services, veterinariasById, categoriesInStock, serviceCategories, loading, error, reload } = useMarketplaceProducts()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('name-asc')
  const [vista, setVista] = useState('productos')
  const [selectedVet, setSelectedVet] = useState(ALL_VETS)
  const [selectedServicioTipo, setSelectedServicioTipo] = useState(ALL_SERVICIO_TIPOS)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutInfo, setCheckoutInfo] = useState(null)
  const [cartItems, setCartItems] = useState(() => cartCount(user?.sub))
  const pendingCheckout = useRef(null)
  const pendingService = useRef(null)

  const refreshCart = useCallback(() => {
    setCartItems(cartCount(user?.sub))
  }, [user?.sub])

  const handleBuy = (product) => {
    addToCart(user?.sub, product)
    refreshCart()
    setCartOpen(true)
  }

  const handleCheckout = () => {
    setCartOpen(false)
    const items = getCart(user?.sub)
    const subtotal = cartSubtotal(user?.sub)
    const count = items.reduce((acc, i) => acc + i.cantidad, 0)
    if (count === 0) return
    pendingCheckout.current = { subtotal, count }
    if (!isAuthenticated) {
      setSelectedProduct({ checkout: true })
      return
    }
    clearCart(user?.sub)
    refreshCart()
    setCheckoutInfo(pendingCheckout.current)
  }

  // userId: sub del usuario que acaba de iniciar sesion o registrarse (migra el carrito anonimo)
  const handleCheckoutSuccess = (userId = user?.sub) => {
    setSelectedProduct(null)
    const info = pendingCheckout.current
    if (!info) return
    clearCart(userId)
    setCartItems(cartCount(userId))
    setCheckoutInfo(info)
  }

  // Agendar cita para un servicio desde el marketplace. Si no esta autenticado,
  // abre el modal de login/registro y al autenticarse navega al formulario de cita
  // con la veterinaria y el servicio ya precargados.
  const agendarServicio = (service) => {
    if (!isAuthenticated) {
      pendingService.current = service
      setSelectedProduct({ agendar: true })
      return
    }
    irACitaConServicio(service)
  }

  const irACitaConServicio = (service) => {
    const params = new URLSearchParams({
      servicio: service.nombre,
      veterinariaId: String(service.veterinariaId ?? ''),
    })
    if (service.precio != null) params.set('precio', String(service.precio))
    if (service.duracionMinutos != null) params.set('duracion', String(service.duracionMinutos))
    navigate(`/dashboard/citas?${params.toString()}`)
  }

  // Se llama tras iniciar sesion/registro desde el modal de agendar cita
  const handleAgendarAuthSuccess = (userId) => {
    const service = pendingService.current
    setSelectedProduct(null)
    pendingService.current = null
    if (service) irACitaConServicio(service)
  }

  const categories = categoriesInStock()
  const vetMap = veterinariasById()
  const servicioTipos = serviceCategories()

  // Veterinarias con productos, para la fila horizontal de "restaurantes"
  const vetsConProductos = useMemo(() => {
    const map = new Map()
    products.forEach((p) => {
      const vId = p.veterinariaId
      const vKey = vId ?? 'sin-vet'
      if (!map.has(vKey)) {
        map.set(vKey, {
          id: vKey,
          nombre: vId && vetMap.get(vId) ? vetMap.get(vId).nombre : 'Sin veterinaria',
          count: 0,
        })
      }
      map.get(vKey).count += 1
    })
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [products, vetMap])

  // Veterinarias con servicios, para la fila horizontal de "restaurantes"
  const vetsConServicios = useMemo(() => {
    const map = new Map()
    services.forEach((s) => {
      const vId = s.veterinariaId
      const vKey = vId ?? 'sin-vet'
      if (!map.has(vKey)) {
        map.set(vKey, {
          id: vKey,
          nombre: vId && vetMap.get(vId) ? vetMap.get(vId).nombre : 'Sin veterinaria',
          count: 0,
        })
      }
      map.get(vKey).count += 1
    })
    return [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [services, vetMap])

  const vetsActivas = vista === 'productos' ? vetsConProductos : vetsConServicios

  const matchesFilters = (p) => {
    const vetNombre = vetMap.get(p.veterinariaId)?.nombre || ''
    const term = normalize(query.trim())
    const searchable = normalize([
      p.nombre, p.descripcion, p.proveedor, p.categoria, p.almacenNombre, vetNombre,
    ].join(' '))
    const price = Number(p.precio) || 0
    const minimum = minPrice === '' ? null : Number(minPrice)
    const maximum = maxPrice === '' ? null : Number(maxPrice)
    const vKey = p.veterinariaId ?? 'sin-vet'
    return (!term || searchable.includes(term))
      && (category === ALL_CATEGORIES || p.categoria === category)
      && (selectedVet === ALL_VETS || vKey === selectedVet)
      && (minimum === null || price >= minimum)
      && (maximum === null || price <= maximum)
  }

  // Servicios veterinarios filtrados por busqueda, veterinaria (ubicacion) y tipo
  const filteredServices = useMemo(() => {
    const term = normalize(query.trim())
    return services.filter((s) => {
      const vetNombre = s.veterinariaNombre || vetMap.get(s.veterinariaId)?.nombre || ''
      const vetDireccion = vetMap.get(s.veterinariaId)?.direccion || ''
      const searchable = normalize([s.nombre, s.descripcion, vetNombre, vetDireccion].join(' '))
      const vKey = s.veterinariaId ?? 'sin-vet'
      return (!term || searchable.includes(term))
        && (selectedVet === ALL_VETS || vKey === selectedVet)
        && (selectedServicioTipo === ALL_SERVICIO_TIPOS || s.categoria === selectedServicioTipo)
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [services, vetMap, query, selectedVet, selectedServicioTipo])

  const sortItems = (items) => {
    return [...items].sort((a, b) => {
      if (sort === 'price-asc') return Number(a.precio) - Number(b.precio)
      if (sort === 'price-desc') return Number(b.precio) - Number(a.precio)
      return String(a.nombre).localeCompare(String(b.nombre), 'es')
    })
  }

  // Estructura filtrada: veterinarias -> almacenes -> categorias -> productos
  const estructura = useMemo(() => {
    const filtradas = products.filter(matchesFilters)
    const indexVet = new Map()
    const indexAlm = new Map()
    const result = []

    filtradas.forEach((p) => {
      const vId = p.veterinariaId
      const vKey = vId ?? 'sin-vet'
      if (!indexVet.has(vKey)) {
        const vet = { id: vKey, nombre: vId && vetMap.get(vId) ? vetMap.get(vId).nombre : 'Sin veterinaria', almacenes: new Map() }
        indexVet.set(vKey, vet)
        result.push(vet)
      }
      const vet = indexVet.get(vKey)
      if (!indexAlm.has(`${vKey}-${p.almacenId}`)) {
        const alm = { id: p.almacenId, nombre: p.almacenNombre, categorias: new Map() }
        indexAlm.set(`${vKey}-${p.almacenId}`, alm)
        vet.almacenes.set(p.almacenId, alm)
      }
      const alm = indexAlm.get(`${vKey}-${p.almacenId}`)
      const cat = p.categoria || 'Otros'
      if (!alm.categorias.has(cat)) alm.categorias.set(cat, [])
      alm.categorias.get(cat).push(p)
    })

    return result
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map((vet) => ({
        ...vet,
        almacenes: [...vet.almacenes.values()]
          .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
          .map((alm) => ({
            ...alm,
            categorias: [...alm.categorias.entries()]
              .sort(([a], [b]) => a.localeCompare(b, 'es'))
              .map(([nombre, items]) => ({ nombre, items: sortItems(items) })),
          })),
      }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, vetMap, query, category, minPrice, maxPrice, sort, selectedVet])

  const totalCount = products.reduce((acc, p) => acc + (matchesFilters(p) ? 1 : 0), 0)
  const totalServicios = services.length
  const hasFilters = vista === 'productos'
    ? (query || category !== ALL_CATEGORIES || minPrice || maxPrice || selectedVet !== ALL_VETS)
    : (query || selectedVet !== ALL_VETS || selectedServicioTipo !== ALL_SERVICIO_TIPOS)

  const clearFilters = () => {
    setQuery('')
    setCategory(ALL_CATEGORIES)
    setMinPrice('')
    setMaxPrice('')
    setSelectedVet(ALL_VETS)
    setSelectedServicioTipo(ALL_SERVICIO_TIPOS)
  }

  const selectedVetNombre = selectedVet === ALL_VETS
    ? 'Todos los comercios'
    : (vetsConProductos.find((v) => v.id === selectedVet)?.nombre
        || vetsConServicios.find((v) => v.id === selectedVet)?.nombre
        || 'Comercio')

  return (
    <section className="marketplace-page">
      <LandingNavbar onLanding />
      <header className="marketplace-header">
        <div>
          <span className="marketplace-eyebrow">OpenPaw Marketplace</span>
          <h1>Encuentra lo mejor para tu mascota</h1>
          <p>Explora productos con stock disponible de las veterinarias aliadas.</p>
        </div>
        <button type="button" className="mp-cart-indicator" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
          <i className="fas fa-shopping-cart" aria-hidden="true" />
          {cartItems > 0 && <span key={cartItems} className="mp-cart-badge">{cartItems}</span>}
        </button>
      </header>

      {/* Barra de busqueda */}
      <div className="mp-searchbar">
        <i className="fas fa-search" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={vista === 'productos' ? 'Buscar productos, veterinarias o categorias' : 'Buscar servicios, veterinarias o tipos'}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Limpiar busqueda">
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Selector de vista: Productos / Servicios */}
      <Reveal>
        <div className="mp-view-switch" role="tablist" aria-label="Contenido del marketplace">
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'productos'}
            className={`mp-view-tab ${vista === 'productos' ? 'active' : ''}`}
            onClick={() => { setVista('productos'); setSelectedVet(ALL_VETS); setQuery('') }}
          >
            <span className="mp-view-icon"><i className="fas fa-box-open" aria-hidden="true" /></span>
            <span className="mp-view-label">Productos</span>
            <span className="mp-view-count">{totalCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'servicios'}
            className={`mp-view-tab ${vista === 'servicios' ? 'active' : ''}`}
            onClick={() => { setVista('servicios'); setSelectedVet(ALL_VETS); setQuery('') }}
          >
            <span className="mp-view-icon"><i className="fas fa-stethoscope" aria-hidden="true" /></span>
            <span className="mp-view-label">Servicios</span>
            <span className="mp-view-count">{totalServicios}</span>
          </button>
        </div>
      </Reveal>

      {/* Fila horizontal de veterinarias (como restaurantes) */}
      {!loading && !error && vetsActivas.length > 0 && (
        <Reveal>
          <div className="mp-vet-scroll" aria-label="Veterinarias disponibles">
            <button
              type="button"
              className={`mp-vet-tile ${selectedVet === ALL_VETS ? 'active' : ''}`}
              onClick={() => setSelectedVet(ALL_VETS)}
            >
              <span className="mp-vet-tile-avatar mp-vet-tile-avatar--all"><i className="fas fa-th-large" /></span>
              <span className="mp-vet-tile-name">Todos</span>
            </button>
            {vetsActivas.map((vet) => (
              <button
                key={vet.id}
                type="button"
                className={`mp-vet-tile ${selectedVet === vet.id ? 'active' : ''}`}
                onClick={() => setSelectedVet(vet.id)}
              >
                <span className="mp-vet-tile-avatar"><i className="fas fa-hospital" /></span>
                <span className="mp-vet-tile-name">{vet.nombre}</span>
                <span className="mp-vet-tile-count">{vet.count} {vista === 'productos' ? 'prod.' : 'srv.'}</span>
              </button>
            ))}
          </div>
        </Reveal>
      )}

      {/* Filtros compactos */}
      {!loading && !error && (
        <div className="mp-filters">
          {vista === 'productos' && (
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Categoria">
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          )}
          {vista === 'servicios' && servicioTipos.length > 0 && (
            <select value={selectedServicioTipo} onChange={(event) => setSelectedServicioTipo(event.target.value)} aria-label="Tipo de servicio">
              <option value={ALL_SERVICIO_TIPOS}>Todos los servicios</option>
              {servicioTipos.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          )}
          {vista === 'productos' && (
            <>
              <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min ₡" aria-label="Precio minimo" />
              <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max ₡" aria-label="Precio maximo" />
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar">
                <option value="name-asc">Nombre</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
              </select>
            </>
          )}
          {hasFilters && <button type="button" className="mp-clear" onClick={clearFilters}>Limpiar</button>}
        </div>
      )}

      {/* Cabecera de la veterinaria seleccionada */}
      {!loading && !error && (vista === 'productos' ? estructura.length > 0 : filteredServices.length > 0) && (
        <Reveal delay={0.1}>
          <div className="mp-selected-head">
            <h2>{selectedVetNombre}</h2>
            <span>
              {vista === 'productos'
                ? `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'} con stock`
                : `${filteredServices.length} ${filteredServices.length === 1 ? 'servicio' : 'servicios'} disponibles`}
            </span>
          </div>
        </Reveal>
      )}

      {loading && (
        <div className="marketplace-status">
          <i className="fas fa-paw" aria-hidden="true" />
          <h2>Cargando marketplace...</h2>
          <p>Consultando inventario de las veterinarias.</p>
        </div>
      )}

      {!loading && error && (
        <div className="marketplace-status marketplace-status--error" role="alert">
          <i className="fas fa-exclamation-circle" aria-hidden="true" />
          <h2>No pudimos cargar el marketplace</h2>
          <p>{error}</p>
          <button type="button" onClick={reload}>Intentar de nuevo</button>
        </div>
      )}

      {!loading && !error && (vista === 'productos' ? estructura.length === 0 : filteredServices.length === 0) && (
        <div className="marketplace-status">
          <i className="fas fa-search" aria-hidden="true" />
          <h2>No encontramos coincidencias</h2>
          <p>Prueba con otros terminos, otra veterinaria o modifica los filtros.</p>
          {hasFilters && <button type="button" onClick={clearFilters}>Ver todos</button>}
        </div>
      )}

      {/* Productos de la veterinaria seleccionada, agrupados por categoria */}
      {!loading && !error && vista === 'productos' && estructura.length > 0 && (
        <div className="mp-menu">
          {estructura.map((veterinaria) => (
            <div key={veterinaria.id} className="mp-menu-vet">
              {veterinaria.almacenes.map((almacen) => (
                <div key={almacen.id} className="mp-menu-almacen">
                  <div className="mp-almacen-label">
                    <i className="fas fa-warehouse" aria-hidden="true" />
                    {almacen.nombre}
                  </div>
                  {almacen.categorias.map((categoria) => (
                    <section key={categoria.nombre} className="mp-menu-cat">
                      <div className="mp-menu-cat-head">
                        <h3>{categoria.nombre}</h3>
                        <span>{categoria.items.length} {categoria.items.length === 1 ? 'producto' : 'productos'}</span>
                      </div>
                      <div className="mp-menu-grid">
                        {categoria.items.map((product, pi) => (
                          <Reveal key={`${product.id}-${product.almacenId}`} delay={Math.min(pi * 0.08, 0.4)}>
                            <article className="mp-menu-item">
                              <div className="mp-menu-item-media">
                                <ProductImage product={product} />
                                <button type="button" className="mp-add-btn" title="Agregar al carrito" onClick={() => handleBuy(product)}>
                                  <i className="fas fa-cart-plus" aria-hidden="true" />
                                  Agregar
                                </button>
                              </div>
                              <div className="mp-menu-item-body">
                                <div className="mp-menu-item-top">
                                  <h4>{product.nombre}</h4>
                                  <StockBadge stock={product.stock} stockMinimo={product.stockMinimo} />
                                </div>
                                <p className="mp-menu-item-desc">
                                  {product.descripcion || `${product.proveedor || ''} · ${product.unidadMedida || ''}`.trim().replace(/^ ·|· $/g, '') || 'Producto veterinario'}
                                </p>
                                <div className="mp-menu-item-foot">
                                  <span className="mp-menu-item-price">{formatPrice(product.precio)}</span>
                                </div>
                              </div>
                            </article>
                          </Reveal>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Servicios veterinarios (grooming, procedimientos, consultas) */}
      {!loading && !error && vista === 'servicios' && filteredServices.length > 0 && (
        <div className="mp-services">
          <div className="mp-services-head">
            <h2>Servicios veterinarios</h2>
            <span>{filteredServices.length} {filteredServices.length === 1 ? 'servicio' : 'servicios'}</span>
          </div>
          <div className="mp-services-grid">
            {filteredServices.map((service) => {
              const vet = vetMap.get(service.veterinariaId)
              return (
                <article key={service.id} className="mp-service-card">
                  <div className="mp-service-top">
                    <h4>{service.nombre}</h4>
                    {service.categoria && (
                      <span className="mp-service-tag">{service.categoria}</span>
                    )}
                  </div>
                  {service.descripcion && <p className="mp-service-desc">{service.descripcion}</p>}
                  <p className="mp-service-meta">
                    <i className="fas fa-hospital" aria-hidden="true" /> {service.veterinariaNombre || vet?.nombre || 'Veterinaria'}
                    {vet?.direccion && ` · ${vet.direccion}`}
                  </p>
                  <div className="mp-service-foot">
                    <span className="mp-service-price">{formatPrice(service.precio)}</span>
                    <span className="mp-service-duracion">{service.duracionMinutos} min</span>
                  </div>
                  <button type="button" className="mp-book-btn" onClick={() => agendarServicio(service)}>
                    <i className="fas fa-calendar-plus" aria-hidden="true" /> Agendar cita
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      )}

      <CheckoutAuthModal
        open={!!selectedProduct}
        onClose={() => { setSelectedProduct(null); pendingService.current = null }}
        onSuccess={selectedProduct?.agendar ? handleAgendarAuthSuccess : handleCheckoutSuccess}
        title={selectedProduct?.agendar ? 'Para agendar tu cita' : 'Para continuar con tu compra'}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
        onChange={refreshCart}
      />

      <CheckoutSuccessModal
        open={!!checkoutInfo}
        onClose={() => setCheckoutInfo(null)}
        subtotal={checkoutInfo?.subtotal ?? 0}
        count={checkoutInfo?.count ?? 0}
      />
    </section>
  )
}
