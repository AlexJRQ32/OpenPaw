import { useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/context/AuthContext'
import { LandingNavbar } from '../../../shared/components/LandingNavbar/LandingNavbar'
import { Reveal } from '../../../shared/components/Reveal/Reveal'
import { Button } from '../../../shared/components/Button/Button'
import { Badge } from '../../../shared/components/Badge/Badge'
import { Icon } from '../../../shared/components/Icon/Icon'
import { EmptyState } from '../../../shared/components/EmptyState'
import { Pagination } from '../../../shared/components/Pagination/Pagination'
import { CheckoutAuthModal } from '../../../features/auth/components/CheckoutAuthModal'
import { useMarketplaceProducts } from '../hooks/useMarketplaceProducts'
import { addToCart, cartCount, getCart, cartSubtotal, clearCart } from '../../../shared/utils/cart'
import { CartDrawer } from '../components/CartDrawer'
import { CheckoutSuccessModal } from '../components/CheckoutSuccessModal'
import { VetCarousel } from '../components/VetCarousel'
import './MarketplacePage.css'

const ALL_CATEGORIES = 'Todas las categorias'
const ALL_VETS = 'todas'
const ALL_SERVICIO_TIPOS = 'todos'
const PRODUCTS_PAGE_SIZE = 8
const SERVICES_PAGE_SIZE = 6

/* Icono y variante M3 por categoria de servicio (wireframe: spa / salud) */
const SERVICIO_ESTILO = {
  Grooming: { icon: 'content_cut', variant: 'warning', theme: 'grooming' },
  Estetica: { icon: 'spa', variant: 'warning', theme: 'grooming' },
  Consulta: { icon: 'stethoscope', variant: 'primary', theme: 'consulta' },
  Procedimiento: { icon: 'medical_services', variant: 'success', theme: 'procedimiento' },
}
const SERVICIO_ESTILO_DEFAULT = { icon: 'pets', variant: 'neutral', theme: 'default' }

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

function servicioEstilo(categoria) {
  if (!categoria) return SERVICIO_ESTILO_DEFAULT
  return SERVICIO_ESTILO[normalize(categoria).replace(/\s/g, '')] || SERVICIO_ESTILO_DEFAULT
}

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false)

  if (!product.imagenUrl || failed) {
    return (
      <div className="mp-card__placeholder" aria-hidden="true">
        <i className="fas fa-paw" />
      </div>
    )
  }

  return (
    <img
      className="mp-card__img"
      src={product.imagenUrl}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

/* Badge DS por nivel de stock (no solo color: texto + icono) */
function StockBadge({ stock, stockMinimo }) {
  if (stock <= 0) return <Badge variant="error" icon="block">Agotado</Badge>
  if (stock <= stockMinimo) return <Badge variant="warning" icon="warning">Stock bajo</Badge>
  return <Badge variant="success" icon="check_circle">Disponible</Badge>
}

/* Skeletons de carga (pulsos suaves; reduced-motion los congela via CSS) */
function SkeletonGrid({ count = 8 }) {
  return (
    <div className="mp-grid" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="mp-skeleton" />
      ))}
    </div>
  )
}

export function MarketplacePage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const {
    products, services, veterinariasById, categoriesInStock, serviceCategories,
    loading, error, reload,
  } = useMarketplaceProducts()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('name-asc')
  const [vista, setVista] = useState('productos')
  const [selectedVet, setSelectedVet] = useState(ALL_VETS)
  const [selectedServicioTipo, setSelectedServicioTipo] = useState(ALL_SERVICIO_TIPOS)
  const [page, setPage] = useState(1)
  const [servicePage, setServicePage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutInfo, setCheckoutInfo] = useState(null)
  const [cartItems, setCartItems] = useState(() => cartCount(user?.sub))
  const pendingCheckout = useRef(null)
  const pendingService = useRef(null)
  const tabRefs = useRef([])

  const refreshCart = useCallback(() => {
    setCartItems(cartCount(user?.sub))
  }, [user?.sub])

  /* Reinicia la paginacion cuando cambian los filtros (patron React:
     ajuste de estado durante el render comparando la firma de filtros,
     sin effects con setState que provocan renders en cascada) */
  const productFilterSignature = `${query}|${category}|${minPrice}|${maxPrice}|${sort}|${selectedVet}`
  const serviceFilterSignature = `${query}|${selectedVet}|${selectedServicioTipo}`
  const [pageSignatures, setPageSignatures] = useState({
    product: productFilterSignature,
    service: serviceFilterSignature,
  })
  if (pageSignatures.product !== productFilterSignature) {
    setPageSignatures((prev) => ({ ...prev, product: productFilterSignature }))
    setPage(1)
  }
  if (pageSignatures.service !== serviceFilterSignature) {
    setPageSignatures((prev) => ({ ...prev, service: serviceFilterSignature }))
    setServicePage(1)
  }

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

  // userId: sub del usuario que acaba de iniciar sesion o registrarse (migra el carrito anonimo).
  // IMPORTANTE: CheckoutAuthModal pasa decoded.sub explicitamente; NO depender de user?.sub
  // porque el closure capturado pre-login tiene user=null y dejaria items comprados en la
  // clave del usuario (carrito fantasma). Ver fix QA HIGH T39.
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

  /* Deep-link hacia CitasPage (?servicio=...&veterinariaId=...): NO cambiar el contrato */
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
  const handleAgendarAuthSuccess = () => {
    const service = pendingService.current
    setSelectedProduct(null)
    pendingService.current = null
    if (service) irACitaConServicio(service)
  }

  const categories = categoriesInStock()
  const vetMap = veterinariasById()
  const servicioTipos = serviceCategories()

  /* Tabs hero: seleccion + roving tabindex (flechas / Home / End) */
  const switchVista = (next) => {
    if (next === vista) return
    setVista(next)
    setSelectedVet(ALL_VETS)
    setQuery('')
  }

  const handleTabKeys = (event) => {
    const currentIdx = vista === 'productos' ? 0 : 1
    let nextIdx = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') nextIdx = (currentIdx + 1) % 2
    else if (event.key === 'Home') nextIdx = 0
    else if (event.key === 'End') nextIdx = 1
    if (nextIdx === null) return
    event.preventDefault()
    switchVista(nextIdx === 0 ? 'productos' : 'servicios')
    tabRefs.current[nextIdx]?.focus()
  }

  const matchesFilters = useCallback((p) => {
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
  }, [vetMap, query, category, selectedVet, minPrice, maxPrice])

  /* Productos filtrados + ordenados (catalogo destacados) */
  const filteredProducts = useMemo(() => (
    products.filter(matchesFilters).sort((a, b) => {
      if (sort === 'price-asc') return Number(a.precio) - Number(b.precio)
      if (sort === 'price-desc') return Number(b.precio) - Number(a.precio)
      return String(a.nombre).localeCompare(String(b.nombre), 'es')
    })
  ), [products, matchesFilters, sort])

  /* Servicios filtrados por busqueda, veterinaria (ubicacion) y tipo */
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

  const pagedProducts = filteredProducts.slice((page - 1) * PRODUCTS_PAGE_SIZE, page * PRODUCTS_PAGE_SIZE)
  const pagedServices = filteredServices.slice((servicePage - 1) * SERVICES_PAGE_SIZE, servicePage * SERVICES_PAGE_SIZE)

  /* Veterinarias para el carrusel, segun la vista activa */
  const carouselItems = useMemo(() => {
    const fuente = vista === 'productos' ? products : services
    const map = new Map()
    fuente.forEach((item) => {
      const vId = item.veterinariaId
      const vKey = vId ?? 'sin-vet'
      if (!map.has(vKey)) {
        const vet = vetMap.get(vId)
        map.set(vKey, {
          id: vKey,
          nombre: vId && vet ? vet.nombre : 'Sin veterinaria',
          direccion: vet?.direccion || '',
          meta: '',
          count: 0,
          icon: vId ? undefined : 'storefront',
        })
      }
      map.get(vKey).count += 1
    })
    const slides = [...map.values()]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map((v) => ({ ...v, meta: `${v.count} ${vista === 'productos' ? (v.count === 1 ? 'producto' : 'productos') : (v.count === 1 ? 'servicio' : 'servicios')}` }))
    return [
      { id: ALL_VETS, nombre: 'Todas las veterinarias', meta: `${fuente.length} en total`, icon: 'apps' },
      ...slides,
    ]
  }, [vista, products, services, vetMap])

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

  const totalCount = filteredProducts.length
  const totalServicios = filteredServices.length
  const searchPlaceholder = vista === 'productos'
    ? 'Buscar alimentos, juguetes, veterinarias...'
    : 'Buscar servicios, veterinarias o tipos...'
  const cartSubtotalValue = cartSubtotal(user?.sub)

  return (
    <section className="marketplace-page">
      <LandingNavbar onLanding />

      {/* ================================================================
          HERO AZUL — wireframe: eyebrow EXPLORAR + titulo + chip carrito +
          buscador pill con boton circular + toggle Productos/Servicios
         ================================================================ */}
      <header className="mp-hero">
        <div className="mp-hero__inner">
          <div className="mp-hero__top">
            <div>
              <p className="mp-hero__eyebrow">Explorar</p>
              <h1 className="mp-hero__title">Marketplace <span>OpenPaw</span></h1>
              <p className="mp-hero__sub">
                Productos con stock disponible y servicios de las veterinarias aliadas.
              </p>
            </div>
            <button
              type="button"
              className="mp-hero__cart"
              onClick={() => setCartOpen(true)}
              aria-label={`Abrir carrito, ${cartItems} ${cartItems === 1 ? 'artículo' : 'artículos'}, total ${formatPrice(cartSubtotalValue)}`}
            >
              <Icon name="shopping_cart" size={20} />
              <span>{cartItems} {cartItems === 1 ? 'artículo' : 'artículos'}</span>
              <span className="mp-hero__cart-dot" aria-hidden="true" />
              <span>{formatPrice(cartSubtotalValue)}</span>
            </button>
          </div>

          <div className="mp-hero__search-row">
            <form
              className="mp-search"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <Icon name="search" size={22} className="mp-search__icon" />
              <label className="mp-sr-only" htmlFor="mp-search-input">Buscar en el marketplace</label>
              <input
                id="mp-search-input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  className="mp-search__clear"
                  onClick={() => setQuery('')}
                  aria-label="Limpiar búsqueda"
                >
                  <Icon name="close" size={18} />
                </button>
              )}
              <button type="submit" className="mp-search__go" aria-label="Buscar">
                <Icon name="arrow_forward" size={20} />
              </button>
            </form>

            <div
              className="mp-tabs"
              role="tablist"
              aria-label="Contenido del marketplace"
              onKeyDown={handleTabKeys}
            >
              <button
                type="button"
                role="tab"
                id="mp-tab-productos"
                ref={(el) => { tabRefs.current[0] = el }}
                aria-selected={vista === 'productos'}
                aria-controls="mp-panel-productos"
                tabIndex={vista === 'productos' ? 0 : -1}
                className={`mp-tab ${vista === 'productos' ? 'is-active' : ''}`.trim()}
                onClick={() => switchVista('productos')}
              >
                Productos
              </button>
              <button
                type="button"
                role="tab"
                id="mp-tab-servicios"
                ref={(el) => { tabRefs.current[1] = el }}
                aria-selected={vista === 'servicios'}
                aria-controls="mp-panel-servicios"
                tabIndex={vista === 'servicios' ? 0 : -1}
                className={`mp-tab ${vista === 'servicios' ? 'is-active' : ''}`.trim()}
                onClick={() => switchVista('servicios')}
              >
                Servicios
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          CONTENIDO
         ================================================================ */}
      <div className="mp-container">

        {/* Carrusel: Veterinarias Aliadas (filtra productos/servicios por comercio) */}
        {!loading && !error && carouselItems.length > 1 && (
          <Reveal>
            <VetCarousel
              items={carouselItems}
              selectedId={selectedVet}
              onSelect={setSelectedVet}
              label={`Veterinarias aliadas con ${vista === 'productos' ? 'productos' : 'servicios'}`}
              onSeeAll={() => setSelectedVet(ALL_VETS)}
            />
          </Reveal>
        )}

        {loading && (
          <div className="marketplace-status" aria-busy="true" aria-live="polite">
            <SkeletonGrid count={8} />
            <p className="mp-sr-only">Cargando marketplace...</p>
          </div>
        )}

        {!loading && error && (
          <div role="alert">
            <EmptyState
              icon="cloud_off"
              variant="dashed"
              title="No pudimos cargar el marketplace"
              description={error}
              action={<Button variant="primary" icon="refresh" onClick={reload}>Intentar de nuevo</Button>}
            />
          </div>
        )}

        {/* ---------------- VISTA PRODUCTOS: DESTACADOS ---------------- */}
        {!loading && !error && vista === 'productos' && (
          <section
            id="mp-panel-productos"
            role="tabpanel"
            aria-labelledby="mp-tab-productos"
            className="mp-section"
          >
            <div className="mp-section__head">
              <h2 className="mp-h2">
                <Icon name="pets" size={26} filled className="mp-h2__icon mp-h2__icon--secondary" />
                Productos Destacados
              </h2>
              <span className="mp-section__count">
                {totalCount} {totalCount === 1 ? 'producto con stock' : 'productos con stock'}
              </span>
            </div>

            {/* Chips de categoria (reemplazan al select, misma funcion) */}
            <div className="mp-chips" role="group" aria-label="Filtrar por categoría">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`mp-chip ${category === cat ? 'is-active' : ''}`.trim()}
                  aria-pressed={category === cat}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Filtros avanzados conservados: precio min/max + orden + limpiar */}
            <div className="mp-filters">
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="Min ₡"
                aria-label="Precio mínimo"
              />
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Max ₡"
                aria-label="Precio máximo"
              />
              <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Ordenar">
                <option value="name-asc">Nombre</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
              </select>
              {hasFilters && (
                <Button variant="outline" size="sm" icon="filter_alt_off" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>

            {totalCount > 0 ? (
              <>
                <div className="mp-grid">
                  {pagedProducts.map((product) => (
                    <article key={`${product.id}-${product.almacenId}`} className="mp-card">
                      <div className="mp-card__media">
                        <ProductImage product={product} />
                      </div>
                      <div className="mp-card__body">
                        <div className="mp-card__meta">
                          <StockBadge stock={product.stock} stockMinimo={product.stockMinimo} />
                        </div>
                        <h3 className="mp-card__name">{product.nombre}</h3>
                        <p className="mp-card__cat">
                          {[product.categoria, product.almacenNombre].filter(Boolean).join(' · ') || 'Producto veterinario'}
                        </p>
                        <div className="mp-card__foot">
                          <span className="mp-card__price">{formatPrice(product.precio)}</span>
                          <Button
                            variant="primary"
                            size="sm"
                            icon="add_shopping_cart"
                            className="mp-card__add"
                            aria-label={`Agregar ${product.nombre} al carrito`}
                            onClick={() => handleBuy(product)}
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {filteredProducts.length > PRODUCTS_PAGE_SIZE && (
                  <div className="mp-pagination">
                    <Pagination
                      page={page}
                      pageSize={PRODUCTS_PAGE_SIZE}
                      total={filteredProducts.length}
                      onChange={setPage}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon="search_off"
                title="No encontramos coincidencias"
                description="Prueba con otros términos, otra veterinaria o modifica los filtros."
                actionLabel="Ver todos"
                onAction={clearFilters}
              />
            )}
          </section>
        )}

        {/* ------------- VISTA SERVICIOS: ESPECIALIZADOS --------------- */}
        {!loading && !error && vista === 'servicios' && (
          <section
            id="mp-panel-servicios"
            role="tabpanel"
            aria-labelledby="mp-tab-servicios"
            className="mp-section"
          >
            <div className="mp-section__head">
              <h2 className="mp-h2">
                <Icon name="spa" size={26} filled className="mp-h2__icon mp-h2__icon--tertiary" />
                Servicios Especializados
              </h2>
              <span className="mp-section__count">
                {totalServicios} {totalServicios === 1 ? 'servicio disponible' : 'servicios disponibles'}
              </span>
            </div>

            {/* Chips de tipo de servicio (reemplazan al select) */}
            {servicioTipos.length > 0 && (
              <div className="mp-chips" role="group" aria-label="Filtrar por tipo de servicio">
                <button
                  type="button"
                  className={`mp-chip ${selectedServicioTipo === ALL_SERVICIO_TIPOS ? 'is-active' : ''}`.trim()}
                  aria-pressed={selectedServicioTipo === ALL_SERVICIO_TIPOS}
                  onClick={() => setSelectedServicioTipo(ALL_SERVICIO_TIPOS)}
                >
                  Todos los servicios
                </button>
                {servicioTipos.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    className={`mp-chip ${selectedServicioTipo === tipo ? 'is-active' : ''}`.trim()}
                    aria-pressed={selectedServicioTipo === tipo}
                    onClick={() => setSelectedServicioTipo(tipo)}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            )}

            {totalServicios > 0 ? (
              <>
                <div className="mp-services-grid">
                  {pagedServices.map((service) => {
                    const estilo = servicioEstilo(service.categoria)
                    const vet = vetMap.get(service.veterinariaId)
                    return (
                      <article key={service.id} className="mp-service">
                        <div className={`mp-service__visual mp-service__visual--${estilo.theme}`} aria-hidden="true">
                          <Icon name={estilo.icon} size={40} filled />
                        </div>
                        <div className="mp-service__body">
                          <Badge variant={estilo.variant}>{service.categoria || 'Servicio'}</Badge>
                          <h3 className="mp-service__name">{service.nombre}</h3>
                          {service.descripcion && <p className="mp-service__desc">{service.descripcion}</p>}
                          <p className="mp-service__meta">
                            <Icon name="location_on" size={16} />
                            {service.veterinariaNombre || vet?.nombre || 'Veterinaria'}
                            {(vet?.direccion || service.duracionMinutos != null) && (
                              <span className="mp-service__meta-extra">
                                {vet?.direccion && ` · ${vet.direccion}`}
                                {service.duracionMinutos != null && ` · ${service.duracionMinutos} min`}
                              </span>
                            )}
                          </p>
                          <div className="mp-service__foot">
                            <div className="mp-service__pricing">
                              <span className="mp-service__foot-label">Precio</span>
                              <span className="mp-service__price">{formatPrice(service.precio)}</span>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              icon="event_available"
                              onClick={() => agendarServicio(service)}
                            >
                              Agendar cita
                            </Button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
                {filteredServices.length > SERVICES_PAGE_SIZE && (
                  <div className="mp-pagination">
                    <Pagination
                      page={servicePage}
                      pageSize={SERVICES_PAGE_SIZE}
                      total={filteredServices.length}
                      onChange={setServicePage}
                    />
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon="search_off"
                title="No encontramos servicios"
                description="Prueba con otros términos, otra veterinaria o modifica los filtros."
                actionLabel="Ver todos"
                onAction={clearFilters}
              />
            )}
          </section>
        )}
      </div>

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
