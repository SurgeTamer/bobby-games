import { useState } from 'react'
import { ROLE_LABEL, listUsers, ordersFor, type User } from './auth'
import { Link } from './nav'
import { money } from './data'

function Field({
  id,
  label,
  type = 'text',
  name,
  autoComplete,
  required,
  defaultValue,
  placeholder,
}: {
  id: string
  label: string
  type?: string
  name: string
  autoComplete?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
}) {
  return (
    <label className="field">
      {label}
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  )
}

export function LoginPage({
  onLogin,
  error,
}: {
  onLogin: (email: string, password: string) => Promise<void>
  error: string
}) {
  const [pending, setPending] = useState(false)
  return (
    <main className="account-page">
      <nav className="crumbs" aria-label="Навигация">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">•</span>
        <span>Вход</span>
      </nav>
      <h1>войти</h1>
      <p className="account-lead">Каталог открыт и без аккаунта. Войдите, чтобы собирать корзину и оформлять заказы.</p>
      <form
        className="account-card"
        onSubmit={async (e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          setPending(true)
          try {
            await onLogin(String(data.get('email') || ''), String(data.get('password') || ''))
          } finally {
            setPending(false)
          }
        }}
      >
        <Field id="login-email" label="электронная почта" type="email" name="email" autoComplete="email" required placeholder="вы@email.ru" />
        <Field id="login-password" label="пароль" type="password" name="password" autoComplete="current-password" required />
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="btn btn--primary" type="submit" disabled={pending}>{pending ? 'входим…' : 'войти'}</button>
        <p className="account-switch">Нет аккаунта? <Link href="/register">зарегистрироваться</Link></p>
      </form>
    </main>
  )
}

export function RegisterPage({
  onRegister,
  error,
}: {
  onRegister: (name: string, email: string, password: string) => Promise<void>
  error: string
}) {
  const [pending, setPending] = useState(false)
  return (
    <main className="account-page">
      <nav className="crumbs" aria-label="Навигация">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">•</span>
        <span>Регистрация</span>
      </nav>
      <h1>регистрация</h1>
      <p className="account-lead">После регистрации вы становитесь клиентом: корзина, заказы и данные для доставки — в кабинете.</p>
      <form
        className="account-card"
        onSubmit={async (e) => {
          e.preventDefault()
          const data = new FormData(e.currentTarget)
          setPending(true)
          try {
            await onRegister(
              String(data.get('name') || ''),
              String(data.get('email') || ''),
              String(data.get('password') || ''),
            )
          } finally {
            setPending(false)
          }
        }}
      >
        <Field id="reg-name" label="имя" name="name" autoComplete="name" required placeholder="как к вам обращаться" />
        <Field id="reg-email" label="электронная почта" type="email" name="email" autoComplete="email" required />
        <Field id="reg-password" label="пароль" type="password" name="password" autoComplete="new-password" required placeholder="минимум 6 символов" />
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="btn btn--acid" type="submit" disabled={pending}>{pending ? 'создаём…' : 'создать аккаунт'}</button>
        <p className="account-switch">Уже есть аккаунт? <Link href="/login">войти</Link></p>
      </form>
    </main>
  )
}

export function CabinetPage({
  user,
  onSave,
  onLogout,
}: {
  user: User
  onSave: (patch: { name: string; phone: string; address: string }) => void
  onLogout: () => void
}) {
  const orders = ordersFor(user.id)
  const [note, setNote] = useState('')
  return (
    <main className="account-page account-page--wide">
      <nav className="crumbs" aria-label="Навигация">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">•</span>
        <span>Кабинет</span>
      </nav>
      <div className="account-head">
        <div>
          <h1>личный кабинет</h1>
          <p className="account-lead">Здравствуйте, {user.name}.</p>
        </div>
        <span className="tag">{ROLE_LABEL[user.role]}</span>
      </div>

      <div className="account-layout">
        <form
          className="account-card"
          onSubmit={(e) => {
            e.preventDefault()
            const data = new FormData(e.currentTarget)
            onSave({
              name: String(data.get('name') || ''),
              phone: String(data.get('phone') || ''),
              address: String(data.get('address') || ''),
            })
            setNote('Сохранили.')
          }}
        >
          <h2>профиль</h2>
          <Field id="cab-name" label="имя" name="name" autoComplete="name" required defaultValue={user.name} />
          <label className="field">
            электронная почта
            <input type="email" value={user.email} readOnly />
          </label>
          <Field id="cab-phone" label="телефон" type="tel" name="phone" autoComplete="tel" defaultValue={user.phone} placeholder="+7 …" />
          <label className="field">
            адрес доставки
            <input name="address" defaultValue={user.address} placeholder="город, улица, дом" autoComplete="street-address" />
          </label>
          {note ? <p className="form-note" role="status">{note}</p> : null}
          <div className="account-actions">
            <button className="btn btn--primary" type="submit">сохранить</button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={onLogout}
            >
              выйти
            </button>
          </div>
        </form>

        <section className="account-card">
          <h2>заказы</h2>
          {orders.length === 0 ? (
            <p className="empty">Пока пусто. Оформите корзину — заявка появится здесь.</p>
          ) : (
            <ul className="order-list">
              {orders.map((order) => (
                <li key={order.id}>
                  <div>
                    <strong>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</strong>
                    <p>{order.items.map((i) => `${i.title} × ${i.qty}`).join(', ')}</p>
                  </div>
                  <div className="order-list__meta">
                    <span className="chip is-active">{order.status}</span>
                    <strong>{money(order.sum)}</strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link className="text-link" href="/catalog">в каталог →</Link>
        </section>
      </div>
    </main>
  )
}

export function AdminPage({ user }: { user: User }) {
  const users = listUsers()
  const clients = users.filter((u) => u.role === 'client')
  return (
    <main className="account-page account-page--wide">
      <nav className="crumbs" aria-label="Навигация">
        <Link href="/">Главная</Link>
        <span aria-hidden="true">•</span>
        <Link href="/account">Кабинет</Link>
        <span aria-hidden="true">•</span>
        <span>Админка</span>
      </nav>
      <div className="account-head">
        <div>
          <h1>админка</h1>
          <p className="account-lead">Клиенты магазина. Заказы каждого — в его кабинете.</p>
        </div>
        <span className="tag">{ROLE_LABEL[user.role]}</span>
      </div>
      <section className="account-card">
        <h2>пользователи · {users.length}</h2>
        <ul className="order-list">
          {users.map((u) => (
            <li key={u.id}>
              <div>
                <strong>{u.name}</strong>
                <p>{u.email}</p>
              </div>
              <span className="chip is-active">{ROLE_LABEL[u.role]}</span>
            </li>
          ))}
        </ul>
        {clients.length === 0 ? <p className="empty">Клиентов пока нет — кто-то должен зарегистрироваться.</p> : null}
      </section>
    </main>
  )
}

