import { useEffect, useMemo, useState } from 'react'
import { AdminPage, CabinetPage, LoginPage, RegisterPage } from './Account'
import { currentUser, loginUser, logoutUser, placeOrder, publicRole, registerUser, seedAdmin, updateUser, type User } from './auth'
import { CATALOG, FEATURED, GENRES, MARQUEE, PICKS, PRODUCTS, money, parseGenres, type Filter, type Product } from './data'
import { Link, go } from './nav'

type CartItem = { id: string; title: string; price: number; qty: number }

function ProductCard({
  product,
  overlay,
  onAdd,
}: {
  product: Product
  overlay?: string
  onAdd: (product: Product) => void
}) {
  return (
    <article className="card">
      <div className={`card__media card__media--${product.media}`}>
        <span className="card__mark">*</span>
        {overlay ? <span className="tag tag--overlay">{overlay}</span> : null}
      </div>
      <div className="card__body">
        <span className="tag">{product.tag}</span>
        <h3>{product.title}</h3>
        <p className="card__meta">{product.meta}</p>
        <div className="card__footer">
          <strong className="price">{money(product.price)}</strong>
          <button className="btn btn--acid btn--sm" type="button" onClick={() => onAdd(product)}>
            в корзину
          </button>
        </div>
      </div>
    </article>
  )
}

function HomePage({ onAdd, onPick }: { onAdd: (product: Product) => void; onPick: () => void }) {
  return (
    <main id="top">
      <section className="hero">
        <div className="scribbles" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div className="hero__copy">
          <span className="tag">1200+ игр в наличии · мск</span>
          <h1>настольные игры для своих</h1>
          <p>Отбираем игры вручную — от быстрых партий на десять минут до тяжёлых еврогеймов на весь вечер. Расскажем правила, если не разобрались.</p>
          <div className="hero__ctas">
            <Link className="btn btn--primary" href="/catalog">смотреть каталог</Link>
            <button className="btn btn--secondary" type="button" onClick={onPick}>подобрать игру</button>
          </div>
        </div>
        <aside className="hero__feature">
          <p className="eyebrow">игра недели</p>
          <ProductCard product={FEATURED} overlay="хит недели" onAdd={onAdd} />
        </aside>
      </section>

      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {[...MARQUEE, ...MARQUEE].map((word, i) => <span key={i}>{word}</span>)}
        </div>
      </div>

      <section className="section section--paper" id="hits">
        <div className="section__head">
          <h2>хиты продаж</h2>
          <Link className="text-link" href="/catalog">все игры →</Link>
        </div>
        <div className="card-grid">
          {PRODUCTS.map((p) => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
        </div>
      </section>

      <section className="section section--peri" id="about">
        <div className="section__head">
          <h2>почему bobby</h2>
        </div>
        <div className="promise-grid">
          <article className="promise">
            <span className="promise__mark">*</span>
            <h3>доставка за день</h3>
            <p>По Москве — на следующий день. Самовывоз с полки в тот же вечер.</p>
          </article>
          <article className="promise">
            <span className="promise__mark">*</span>
            <h3>разберём правила</h3>
            <p>Если партия застопорилась — напишите. Объясним ход, а не процитируем буклет.</p>
          </article>
          <article className="promise">
            <span className="promise__mark">*</span>
            <h3>подарки без мучений</h3>
            <p>Скажите, кому и на сколько человек — соберём набор и упакуем.</p>
          </article>
          <article className="promise">
            <span className="promise__mark">*</span>
            <h3>честный предзаказ</h3>
            <p>Бронируем тираж без переплаты. Пришло — сразу пишем, что можно забирать.</p>
          </article>
        </div>
      </section>

      <section className="section section--acid" id="gifts">
        <Newsletter />
      </section>
    </main>
  )
}

function Newsletter() {
  const [note, setNote] = useState('')
  return (
    <div className="cta">
      <div>
        <p className="eyebrow">рассылка раз в неделю</p>
        <h2>игры, которые стоит успеть</h2>
        <p>Новинки, тиражи, которые заканчиваются, и подборки «что дарить, если человек уже во всё играл».</p>
      </div>
      <form
        className="cta__form"
        onSubmit={(e) => {
          e.preventDefault()
          setNote('Готово. Пришлём письмо, когда выйдет что-то стоящее.')
          e.currentTarget.reset()
        }}
      >
        <label className="visually-hidden" htmlFor="email">электронная почта</label>
        <input id="email" type="email" name="email" required placeholder="ваш@email.ru" />
        <button className="btn btn--primary" type="submit">подписаться</button>
        <p className="form-note" role="status">{note}</p>
      </form>
    </div>
  )
}

function catalogHref(genres: Exclude<Filter, 'all'>[], tag = '') {
  const u = new URL('/catalog', window.location.origin)
  if (genres.length) u.searchParams.set('genre', genres.join(','))
  if (tag) u.searchParams.set('tag', tag)
  return u.pathname + u.search
}

function CatalogPage({
  genres,
  tag,
  query,
  onToggleGenre,
  onPick,
  onAdd,
}: {
  genres: Exclude<Filter, 'all'>[]
  tag: string
  query: string
  onToggleGenre: (id: Exclude<Filter, 'all'>) => void
  onPick: (next: { genres?: Exclude<Filter, 'all'>[]; tag?: string }) => void
  onAdd: (product: Product) => void
}) {
  const [sort, setSort] = useState<'title' | 'price-asc' | 'price-desc'>('title')
  const [perPage, setPerPage] = useState(48)
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = CATALOG.filter((p) => {
      const byGenre = genres.length === 0 || genres.some((g) => p.cats.includes(g))
      const byTag = !tag || p.tag === tag
      const byQuery = !q || p.title.toLowerCase().includes(q)
      return byGenre && byTag && byQuery
    })
    rows.sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      return a.title.localeCompare(b.title, 'ru')
    })
    return rows.slice(0, perPage)
  }, [genres, tag, query, sort, perPage])

  const title = tag
    ? PICKS.find((p) => p.id === tag)?.title ?? 'Каталог'
    : genres.length === 1
      ? GENRES.find((g) => g.id === genres[0])?.title ?? 'Настольные игры'
      : 'Настольные игры'

  return (
    <main id="catalog" className="catalog-page">
      <nav className="crumbs" aria-label="Навигация">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">•</span>
        <span>Настольные игры</span>
      </nav>

      <div className="catalog-layout">
        <aside className="facet" aria-label="Фильтры">
          <h3>жанры</h3>
          <div className="facet__chips">
            {GENRES.map((g) => (
              <button
                key={g.id}
                className={genres.includes(g.id) ? 'chip is-active' : 'chip'}
                type="button"
                aria-pressed={genres.includes(g.id)}
                onClick={() => onToggleGenre(g.id)}
              >
                {g.title}
              </button>
            ))}
          </div>
          <h3>подборки</h3>
          <div className="facet__chips">
            {PICKS.map((pick) => (
              <button
                key={pick.id}
                className={tag === pick.id ? 'chip is-active' : 'chip'}
                type="button"
                aria-pressed={tag === pick.id}
                onClick={() => onPick({ genres, tag: tag === pick.id ? '' : pick.id })}
              >
                {pick.title}
              </button>
            ))}
          </div>
        </aside>

        <div className="catalog-main">
          <aside className="catalog-banner">
            <div className="scribbles" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div className="catalog-banner__copy">
              <span className="tag">1200+ игр в наличии · мск</span>
              <h2>приходите потрогать коробки</h2>
              <p>Магазин на Московском. Самовывоз с полки в тот же вечер.</p>
              <a className="btn btn--primary" href="tel:+74951234567">+7 495 123-45-67</a>
            </div>
          </aside>

          <div className="catalog-toolbar">
            <h1>{title}</h1>
            <div className="catalog-tools">
              <label>
                Сортировать:
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
                  <option value="title">Название</option>
                  <option value="price-asc">Цена ↑</option>
                  <option value="price-desc">Цена ↓</option>
                </select>
              </label>
              <div className="catalog-views" role="group" aria-label="Вид">
                <button type="button" className={view === 'grid' ? 'is-active' : ''} aria-label="Сетка" onClick={() => setView('grid')}>
                  ▦
                </button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} aria-label="Список" onClick={() => setView('list')}>
                  ▤
                </button>
              </div>
              <label>
                Показать по:
                <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
              </label>
            </div>
          </div>

          <div className={view === 'list' ? 'card-grid listing--list' : 'card-grid catalog-grid'}>
            {visible.map((p) => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
          </div>
          {visible.length === 0 ? (
            <p className="empty">Ничего не нашли. Сбросьте фильтр или попробуйте другое название.</p>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function App() {
  const [loc, setLoc] = useState(() => window.location.pathname + window.location.search + window.location.hash)
  const [cart, setCart] = useState<CartItem[]>([])
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState('')

  const url = new URL(loc, window.location.origin)
  const path = url.pathname
  const isHome = path === '/'
  const isCatalog = path === '/catalog'
  const isLogin = path === '/login'
  const isRegister = path === '/register'
  const isAccount = path === '/account'
  const isAdmin = path === '/admin'
  const genres = parseGenres(url.searchParams.get('genre'))
  const tag = url.searchParams.get('tag') || ''
  const role = publicRole(user)

  const qty = cart.reduce((s, i) => s + i.qty, 0)
  const sum = cart.reduce((s, i) => s + i.qty * i.price, 0)

  function showToast(text: string) {
    setToast(text)
  }

  function addItem(product: Product) {
    if (!user) {
      go('/login')
      showToast('Войдите, чтобы добавить в корзину')
      return
    }
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id)
      if (found) return prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { id: product.id, title: product.title, price: product.price, qty: 1 }]
    })
    showToast(`${product.title} — в корзине`)
  }

  function removeItem(id: string) {
    if (!user) return
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  function applyFilter(next: Filter) {
    go(next === 'all' ? '/catalog' : catalogHref([next as Exclude<Filter, 'all'>]))
  }

  function toggleGenre(id: Exclude<Filter, 'all'>) {
    const next = genres.includes(id) ? genres.filter((g) => g !== id) : [...genres, id]
    go(catalogHref(next, tag))
  }

  function pickFacet(next: { genres?: Exclude<Filter, 'all'>[]; tag?: string }) {
    go(catalogHref(next.genres ?? [], next.tag ?? ''))
  }

  function closeDrawers() {
    setCartOpen(false)
    setPickerOpen(false)
    setMenuOpen(false)
  }

  useEffect(() => {
    seedAdmin()
    setUser(currentUser())
  }, [])

  useEffect(() => {
    if (user && (isLogin || isRegister)) go('/account')
    if (user && isAdmin && user.role !== 'admin') go('/account')
  }, [user, isLogin, isRegister, isAdmin])

  useEffect(() => {
    setAuthError('')
  }, [path])

  useEffect(() => {
    const sync = () => setLoc(window.location.pathname + window.location.search + window.location.hash)
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  useEffect(() => {
    document.body.style.overflow = cartOpen || pickerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [cartOpen, pickerOpen])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 1800)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawers()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (url.hash) {
      document.querySelector(url.hash)?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [url.pathname, url.hash])

  return (
    <>
      <Link className="skip" href="/catalog">к каталогу</Link>

      <header className="header">
        <Link className="logo" href="/" onClick={() => setMenuOpen(false)}>*bobby games</Link>
        <nav className={menuOpen ? 'nav is-open' : 'nav'} id="site-nav" aria-label="Основное меню">
          <Link href="/" className={isHome ? 'is-active' : undefined} onClick={() => setMenuOpen(false)}>главная</Link>
          <Link href="/catalog" className={isCatalog ? 'is-active' : undefined} onClick={() => setMenuOpen(false)}>каталог</Link>
          <Link href="/catalog?tag=новинка" onClick={() => setMenuOpen(false)}>новинки</Link>
          <Link href={isCatalog || isAccount || isAdmin || isLogin || isRegister ? '/#about' : '#about'} onClick={() => setMenuOpen(false)}>про нас</Link>
          {user ? (
            <Link href="/account" className={isAccount ? 'is-active' : undefined} onClick={() => setMenuOpen(false)}>кабинет</Link>
          ) : (
            <Link href="/login" className={isLogin || isRegister ? 'is-active' : undefined} onClick={() => setMenuOpen(false)}>войти</Link>
          )}
          {role === 'admin' ? (
            <Link href="/admin" className={isAdmin ? 'is-active' : undefined} onClick={() => setMenuOpen(false)}>админка</Link>
          ) : null}
        </nav>
        <div className="header__actions">
          <label className="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="найти игру…"
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (!isCatalog) go('/catalog')
              }}
            />
          </label>
          <button className="btn btn--primary" type="button" onClick={() => setCartOpen(true)}>
            корзина · {qty}
          </button>
          <button
            className="burger"
            type="button"
            aria-label="Меню"
            aria-expanded={menuOpen}
            aria-controls="site-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span></span><span></span>
          </button>
        </div>
      </header>

      {isCatalog ? (
        <CatalogPage
          genres={genres}
          tag={tag}
          query={query}
          onToggleGenre={toggleGenre}
          onPick={pickFacet}
          onAdd={addItem}
        />
      ) : isRegister && !user ? (
        <RegisterPage
          error={authError}
          onRegister={async (name, email, password) => {
            setAuthError('')
            try {
              const next = await registerUser(name, email, password)
              setUser(next)
              go('/account')
              showToast('Аккаунт создан')
            } catch (err) {
              setAuthError(err instanceof Error ? err.message : 'Не получилось зарегистрироваться')
            }
          }}
        />
      ) : (isLogin && !user) || (isAccount && !user) || (isAdmin && !user) ? (
        <LoginPage
          error={authError}
          onLogin={async (email, password) => {
            setAuthError('')
            try {
              const next = await loginUser(email, password)
              setUser(next)
              go(isAdmin ? '/admin' : '/account')
              showToast(`Вы вошли как ${next.name}`)
            } catch (err) {
              setAuthError(err instanceof Error ? err.message : 'Не получилось войти')
            }
          }}
        />
      ) : isAccount && user ? (
        <CabinetPage
          user={user}
          onSave={(patch) => {
            setUser(updateUser(user.id, patch))
          }}
            onLogout={() => {
              logoutUser()
              setUser(null)
              setCart([])
              go('/')
              showToast('Вы вышли')
            }}
        />
      ) : isAdmin && user?.role === 'admin' ? (
        <AdminPage user={user} />
      ) : isLogin || isRegister || isAccount || isAdmin ? null : (
        <HomePage onAdd={addItem} onPick={() => setPickerOpen(true)} />
      )}

      <footer className="footer">
        <div className="footer__grid">
          <div>
            <Link className="logo logo--light" href="/">*bobby games</Link>
            <p>Магазин настольных игр на Московском. Приходите потрогать коробки до покупки.</p>
          </div>
          <div>
            <h4>магазин</h4>
            <Link href="/catalog">каталог</Link>
            <Link href={isHome ? '#about' : '/#about'}>про нас</Link>
            {user ? <Link href="/account">кабинет</Link> : <Link href="/login">войти</Link>}
          </div>
          <div>
            <h4>помощь</h4>
            <Link href={isHome ? '#about' : '/#about'}>доставка</Link>
            <Link href={isHome ? '#about' : '/#about'}>разбор правил</Link>
            <Link href={isHome ? '#gifts' : '/#gifts'}>предзаказ</Link>
            <a href="mailto:hi@bobby.games">написать нам</a>
          </div>
          <div>
            <h4>контакты</h4>
            <p>Москва,<br />Московский проспект, 32</p>
            <p>ежедневно 12:00–21:00</p>
            <a href="tel:+74951234567">+7 495 123-45-67</a>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© 2026 bobby games</span>
          <span>играйте вживую</span>
        </div>
      </footer>

      {cartOpen ? (
        <div className="drawer">
          <div className="drawer__backdrop" onClick={() => setCartOpen(false)} />
          <aside className="drawer__panel" role="dialog" aria-labelledby="cart-title">
            <header>
              <h2 id="cart-title">корзина</h2>
              <button className="icon-btn" type="button" aria-label="Закрыть" onClick={() => setCartOpen(false)}>×</button>
            </header>
            {user ? (
              <ul className="cart-list">
                {cart.map((i) => (
                  <li key={i.id}>
                    <div>
                      <strong>{i.title}</strong>
                      <div>{i.qty} × {money(i.price)}</div>
                    </div>
                    <button type="button" onClick={() => removeItem(i.id)}>убрать</button>
                  </li>
                ))}
              </ul>
            ) : null}
            {!user ? (
              <p className="cart-empty">Войдите, чтобы собирать корзину и менять её.</p>
            ) : cart.length === 0 ? (
              <p className="cart-empty">Пока пусто — выберите игру из каталога.</p>
            ) : null}
            <footer>
              <div className="cart-total">
                <span>итого</span>
                <strong>{money(user ? sum : 0)}</strong>
              </div>
              <button
                className="btn btn--acid"
                type="button"
                onClick={() => {
                  if (!user) {
                    setCartOpen(false)
                    go('/login')
                    return showToast('Войдите, чтобы пользоваться корзиной')
                  }
                  if (!cart.length) return showToast('Корзина пустая')
                  placeOrder(user.id, cart, sum)
                  setCart([])
                  setCartOpen(false)
                  go('/account')
                  showToast('Заказ принят — он в кабинете')
                }}
              >
                {user ? 'оформить' : 'войти'}
              </button>
            </footer>
          </aside>
        </div>
      ) : null}

      {pickerOpen ? (
        <div className="drawer">
          <div className="drawer__backdrop" onClick={() => setPickerOpen(false)} />
          <aside className="drawer__panel drawer__panel--wide" role="dialog" aria-labelledby="picker-title">
            <header>
              <h2 id="picker-title">подобрать игру</h2>
              <button className="icon-btn" type="button" aria-label="Закрыть" onClick={() => setPickerOpen(false)}>×</button>
            </header>
            <form
              className="picker"
              onSubmit={(e) => {
                e.preventDefault()
                const data = new FormData(e.currentTarget)
                const who = String(data.get('who') || '')
                const time = String(data.get('time') || '')
                const pick: Filter = who === 'duo' ? 'duo' : who === 'kids' ? 'kids' : time === 'short' ? 'company' : 'company'
                setPickerOpen(false)
                applyFilter(pick)
                showToast('Собрали подборку в каталоге')
              }}
            >
              <fieldset>
                <legend>сколько вас</legend>
                <label><input type="radio" name="who" value="duo" required /> на двоих</label>
                <label><input type="radio" name="who" value="company" /> компания</label>
                <label><input type="radio" name="who" value="kids" /> с детьми</label>
              </fieldset>
              <fieldset>
                <legend>сколько времени</legend>
                <label><input type="radio" name="time" value="short" required /> до 30 минут</label>
                <label><input type="radio" name="time" value="mid" /> час-полтора</label>
                <label><input type="radio" name="time" value="long" /> вечер целиком</label>
              </fieldset>
              <button className="btn btn--primary" type="submit">показать варианты</button>
            </form>
          </aside>
        </div>
      ) : null}

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </>
  )
}

export default App
