import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { currentUser } from './auth'
import { CATALOG } from './data'

function renderApp(path = '/') {
  window.history.pushState({}, '', path)
  return render(<App />)
}

function banner() {
  return screen.getByRole('banner')
}

function cardTitles() {
  return screen.getAllByRole('article').map((article) => within(article).getByRole('heading', { level: 3 }).textContent)
}

async function register(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  email: string,
  password = 'secret1',
) {
  await user.click(within(banner()).getByRole('link', { name: 'войти' }))
  await user.click(screen.getByRole('link', { name: 'зарегистрироваться' }))
  await user.type(screen.getByLabelText('имя'), name)
  await user.type(screen.getByLabelText('электронная почта'), email)
  await user.type(screen.getByLabelText('пароль'), password)
  await user.click(screen.getByRole('button', { name: 'создать аккаунт' }))
  expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()
}

describe('гость', () => {
  it('видит главную, хиты и блок о магазине', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'настольные игры для своих' })).toBeInTheDocument()
    expect(screen.getByText('игра недели')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Хнефатафл' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'хиты продаж' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'почему bobby' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'доставка за день' })).toBeInTheDocument()
  })

  it('не видит кабинет и админку', () => {
    renderApp()
    const nav = screen.getByRole('navigation', { name: 'Основное меню' })
    expect(within(nav).getByRole('link', { name: 'войти' })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'кабинет' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'админка' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'войти' })).toBeInTheDocument()
  })

  it('открывает раздел «про нас»', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(within(banner()).getByRole('link', { name: 'про нас' }))
    expect(window.location.hash).toBe('#about')
    expect(screen.getByRole('heading', { name: 'почему bobby' })).toBeInTheDocument()
  })

  it('просит войти на закрытых страницах', () => {
    renderApp('/account')
    expect(screen.getByRole('heading', { name: 'войти' })).toBeInTheDocument()
  })

  it('показывает форму входа и на админском адресе', () => {
    renderApp('/admin')
    expect(screen.getByRole('heading', { name: 'войти' })).toBeInTheDocument()
  })

  it('открывает страницу игры по клику на карточку', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('link', { name: /Хнефатафл/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Хнефатафл' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/product/hnefatafl')
    expect(screen.getByText('2 игрока · 30 мин · 8+')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Каталог' })).toBeInTheDocument()
  })

  it('сообщает, если такой игры нет', () => {
    renderApp('/product/net')
    expect(screen.getByRole('heading', { name: 'такой игры нет' })).toBeInTheDocument()
  })
})

describe('каталог', () => {
  it('показывает весь каталог', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(within(banner()).getByRole('link', { name: 'каталог' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Настольные игры' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(CATALOG.length)
    expect(cardTitles()[0]).toBe('Билет на поезд')
  })

  it('ищет игру по названию без учёта регистра', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByRole('searchbox'), 'ДОББЛЬ')
    expect(await screen.findByRole('heading', { level: 1, name: 'Настольные игры' })).toBeInTheDocument()
    expect(cardTitles()).toEqual(['Доббль'])
    await user.click(screen.getByRole('link', { name: /Доббль/ }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Доббль' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/product/dobble')
  })

  it('сообщает, если ничего не найдено', async () => {
    const user = userEvent.setup()
    renderApp('/catalog')
    await user.type(screen.getByRole('searchbox'), 'неттакойигры')
    expect(screen.getByText('Ничего не нашли. Сбросьте фильтр или попробуйте другое название.')).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('фильтрует по нескольким жанрам', async () => {
    const user = userEvent.setup()
    renderApp('/catalog')
    await user.click(screen.getByRole('button', { name: 'для компании' }))
    await user.click(screen.getByRole('button', { name: 'на двоих' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Настольные игры' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'для компании' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { level: 3, name: 'Пэчворк' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Крылья' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Каркассон' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Доббль' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 3, name: 'Ужас Аркхэма' })).not.toBeInTheDocument()
    expect(decodeURIComponent(window.location.search)).toBe('?genre=company,duo')
  })

  it('открывает новинки из меню', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(within(banner()).getByRole('link', { name: 'новинки' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Новинки' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Новинки' })).toHaveAttribute('aria-pressed', 'true')
    expect(cardTitles()).toEqual(['Каркассон'])
  })

  it('сортирует по цене и переключает вид списка', async () => {
    const user = userEvent.setup()
    renderApp('/catalog')
    await user.selectOptions(screen.getByRole('combobox', { name: /Сортировать/ }), 'price-asc')
    expect(cardTitles()[0]).toBe('Доббль')
    expect(cardTitles().at(-1)).toBe('Ужас Аркхэма')

    await user.selectOptions(screen.getByRole('combobox', { name: /Сортировать/ }), 'price-desc')
    expect(cardTitles()[0]).toBe('Ужас Аркхэма')

    await user.click(screen.getByRole('button', { name: 'Список' }))
    expect(screen.getByRole('button', { name: 'Список' })).toHaveClass('is-active')
    expect(document.querySelector('.listing--list')).toBeTruthy()
  })
})

describe('корзина', () => {
  it('не даёт гостю добавить игру', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getAllByRole('button', { name: 'в корзину' })[0])
    expect(await screen.findByRole('heading', { name: 'войти' })).toBeInTheDocument()
    expect(screen.getByText('Войдите, чтобы добавить в корзину')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'корзина · 0' })).toBeInTheDocument()
  })

  it('не даёт гостю менять корзину', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: /корзина/ }))
    const dialog = screen.getByRole('dialog', { name: 'корзина' })
    expect(within(dialog).getByText('Войдите, чтобы собирать корзину и менять её.')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: 'убрать' })).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'войти' }))
    expect(await screen.findByRole('heading', { name: 'войти' })).toBeInTheDocument()
    expect(screen.getByText('Войдите, чтобы пользоваться корзиной')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'корзина · 0' })).toBeInTheDocument()
  })

  it('закрывает корзину по Escape и по меню', async () => {
    const user = userEvent.setup()
    renderApp()
    const menu = screen.getByRole('button', { name: 'Меню' })
    expect(menu).toHaveAttribute('aria-expanded', 'false')
    await user.click(menu)
    expect(menu).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Основное меню' })).toHaveClass('is-open')

    await user.click(screen.getByRole('button', { name: /корзина/ }))
    expect(screen.getByRole('dialog', { name: 'корзина' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'корзина' })).not.toBeInTheDocument()
    expect(menu).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('клиент', () => {
  it('регистрируется и видит кабинет', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await user.type(screen.getByLabelText('имя'), 'Маша')
    await user.type(screen.getByLabelText('электронная почта'), 'masha@bobby.games')
    await user.type(screen.getByLabelText('пароль'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'создать аккаунт' }))

    expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()
    expect(screen.getByText('Здравствуйте, Маша.')).toBeInTheDocument()
    expect(screen.getByText('клиент')).toBeInTheDocument()
    expect(screen.getByText('Пока пусто. Оформите корзину — заявка появится здесь.')).toBeInTheDocument()
    expect(screen.getByText('Аккаунт создан')).toBeInTheDocument()
    expect(within(banner()).getByRole('link', { name: 'кабинет' })).toBeInTheDocument()
    expect(within(banner()).queryByRole('link', { name: 'админка' })).not.toBeInTheDocument()
    expect(currentUser()?.email).toBe('masha@bobby.games')
  })

  it('показывает ошибку короткого пароля и занятого email', async () => {
    const user = userEvent.setup()
    renderApp('/register')
    await user.type(screen.getByLabelText('имя'), 'Маша')
    await user.type(screen.getByLabelText('электронная почта'), 'masha@bobby.games')
    await user.type(screen.getByLabelText('пароль'), '12345')
    await user.click(screen.getByRole('button', { name: 'создать аккаунт' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Пароль — минимум 6 символов')

    await user.clear(screen.getByLabelText('пароль'))
    await user.type(screen.getByLabelText('пароль'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'создать аккаунт' }))
    expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'выйти' }))
    expect(await screen.findByRole('heading', { name: 'настольные игры для своих' })).toBeInTheDocument()
    await user.click(within(banner()).getByRole('link', { name: 'войти' }))
    await user.click(screen.getByRole('link', { name: 'зарегистрироваться' }))
    await user.type(screen.getByLabelText('имя'), 'Маша')
    await user.type(screen.getByLabelText('электронная почта'), 'masha@bobby.games')
    await user.type(screen.getByLabelText('пароль'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'создать аккаунт' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Этот email уже зарегистрирован')
  })

  it('входит после выхода и не открывает чужой пароль', async () => {
    const user = userEvent.setup()
    renderApp()
    await register(user, 'Маша', 'masha@bobby.games')
    await user.click(screen.getByRole('button', { name: 'выйти' }))
    expect(await screen.findByText('Вы вышли')).toBeInTheDocument()
    expect(currentUser()).toBeNull()

    await user.click(within(banner()).getByRole('link', { name: 'войти' }))
    await user.type(screen.getByLabelText('электронная почта'), 'masha@bobby.games')
    await user.type(screen.getByLabelText('пароль'), 'неверный')
    await user.click(screen.getByRole('button', { name: 'войти' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль')

    await user.clear(screen.getByLabelText('пароль'))
    await user.type(screen.getByLabelText('пароль'), 'secret1')
    await user.click(screen.getByRole('button', { name: 'войти' }))
    expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()
    expect(screen.getByText('Здравствуйте, Маша.')).toBeInTheDocument()
  })

  it('сохраняет профиль', async () => {
    const user = userEvent.setup()
    renderApp()
    await register(user, 'Маша', 'masha@bobby.games')
    const name = screen.getByLabelText('имя')
    await user.clear(name)
    await user.type(name, 'Мария')
    await user.type(screen.getByLabelText('телефон'), '+79990001122')
    await user.type(screen.getByLabelText('адрес доставки'), 'Невский, 1')
    expect(screen.getByLabelText('электронная почта')).toHaveAttribute('readonly')
    await user.click(screen.getByRole('button', { name: 'сохранить' }))
    expect(screen.getByText('Сохранили.')).toBeInTheDocument()
    expect(screen.getByText('Здравствуйте, Мария.')).toBeInTheDocument()
    expect(currentUser()).toMatchObject({
      name: 'Мария',
      phone: '+79990001122',
      address: 'Невский, 1',
      email: 'masha@bobby.games',
    })
  })

  it('увеличивает количество одной и той же игры', async () => {
    const user = userEvent.setup()
    renderApp()
    await register(user, 'Маша', 'masha-qty@bobby.games')
    await user.click(within(banner()).getByRole('link', { name: 'главная' }))
    const add = screen.getAllByRole('button', { name: 'в корзину' })[0]
    await user.click(add)
    await user.click(add)
    expect(screen.getByRole('button', { name: 'корзина · 2' })).toBeInTheDocument()
    expect(screen.getByText('Хнефатафл — в корзине')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'корзина · 2' }))
    const dialog = screen.getByRole('dialog', { name: 'корзина' })
    expect(within(dialog).getByText(/2\s×\s6\s490\s₽/)).toBeInTheDocument()
    expect(within(dialog).getByText(/12\s980\s₽/)).toBeInTheDocument()
  })

  it('убирает игру и не оформляет пустую корзину', async () => {
    const user = userEvent.setup()
    renderApp()
    await register(user, 'Маша', 'masha-empty@bobby.games')
    await user.click(within(banner()).getByRole('link', { name: 'главная' }))
    await user.click(screen.getByRole('button', { name: /корзина/ }))
    await user.click(screen.getByRole('button', { name: 'оформить' }))
    expect(screen.getByText('Корзина пустая')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'корзина' })).toBeInTheDocument()
    await user.keyboard('{Escape}')

    await user.click(screen.getAllByRole('button', { name: 'в корзину' })[0])
    await user.click(screen.getByRole('button', { name: /корзина/ }))
    const dialog = screen.getByRole('dialog', { name: 'корзина' })
    await user.click(within(dialog).getByRole('button', { name: 'убрать' }))
    expect(within(dialog).getByText('Пока пусто — выберите игру из каталога.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'корзина · 0' })).toBeInTheDocument()
  })

  it('оформляет заказ и показывает его в кабинете', async () => {
    const user = userEvent.setup()
    renderApp('/catalog')
    await register(user, 'Маша', 'masha@bobby.games')
    await user.click(within(banner()).getByRole('link', { name: 'каталог' }))
    const title = await screen.findByRole('heading', { level: 3, name: 'Доббль' })
    const card = title.closest('article')
    if (!card) throw new Error('карточка Доббля не найдена')
    await user.click(within(card).getByRole('button', { name: 'в корзину' }))
    await user.click(screen.getByRole('button', { name: /корзина/ }))
    await user.click(screen.getByRole('button', { name: 'оформить' }))

    expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()
    expect(screen.getByText('Доббль × 1')).toBeInTheDocument()
    expect(screen.getByText('принят')).toBeInTheDocument()
    expect(screen.getByText(/1\s290\s₽/)).toBeInTheDocument()
    expect(screen.getByText('Заказ принят — он в кабинете')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'корзина · 0' })).toBeInTheDocument()
  })

  it('уводит уже вошедшего со страниц входа и админки', async () => {
    const user = userEvent.setup()
    renderApp()
    await register(user, 'Коля', 'kolya@bobby.games')

    act(() => {
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/account')

    act(() => {
      window.history.pushState({}, '', '/admin')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'админка' })).not.toBeInTheDocument()
    expect(window.location.pathname).toBe('/account')
  })
})

describe('администратор', () => {
  it('видит список пользователей', async () => {
    localStorage.setItem('bobby.session', 'admin')
    renderApp('/admin')
    expect(await screen.findByRole('heading', { name: 'админка' })).toBeInTheDocument()
    expect(screen.getByText('Админ Bobby')).toBeInTheDocument()
    expect(screen.getByText('admin@bobby.games')).toBeInTheDocument()
    expect(screen.getAllByText('администратор')).toHaveLength(2)
    expect(screen.getByText('Клиентов пока нет — кто-то должен зарегистрироваться.')).toBeInTheDocument()
    expect(within(banner()).getByRole('link', { name: 'админка' })).toBeInTheDocument()
    expect(within(banner()).getByRole('link', { name: 'кабинет' })).toBeInTheDocument()
  })

  it('тоже может оформить заказ', async () => {
    const user = userEvent.setup()
    localStorage.setItem('bobby.session', 'admin')
    renderApp('/catalog')
    expect(await screen.findByRole('link', { name: 'админка' })).toBeInTheDocument()
    const title = screen.getByRole('heading', { level: 3, name: 'Доббль' })
    const card = title.closest('article')
    if (!card) throw new Error('карточка Доббля не найдена')
    await user.click(within(card).getByRole('button', { name: 'в корзину' }))
    await user.click(screen.getByRole('button', { name: /корзина/ }))
    await user.click(screen.getByRole('button', { name: 'оформить' }))
    expect(await screen.findByRole('heading', { name: 'личный кабинет' })).toBeInTheDocument()
    expect(screen.getByText('Здравствуйте, Админ Bobby.')).toBeInTheDocument()
    expect(screen.getByText('Доббль × 1')).toBeInTheDocument()
    expect(screen.getByText('принят')).toBeInTheDocument()
  })
})

describe('подбор и рассылка', () => {
  it('подбирает игры и открывает их в каталоге', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'подобрать игру' }))
    const dialog = screen.getByRole('dialog', { name: 'подобрать игру' })
    await user.click(within(dialog).getByRole('radio', { name: 'на двоих' }))
    await user.click(within(dialog).getByRole('radio', { name: 'до 30 минут' }))
    await user.click(within(dialog).getByRole('button', { name: 'показать варианты' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'на двоих' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/catalog')
    expect(window.location.search).toBe('?genre=duo')
    expect(screen.getByText('Собрали подборку в каталоге')).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'подобрать игру' })).not.toBeInTheDocument()
  })

  it('принимает email для рассылки', async () => {
    const user = userEvent.setup()
    renderApp()
    const email = screen.getByPlaceholderText('ваш@email.ru')
    await user.type(email, 'player@bobby.games')
    await user.click(screen.getByRole('button', { name: 'подписаться' }))
    expect(screen.getByText('Готово. Пришлём письмо, когда выйдет что-то стоящее.')).toBeInTheDocument()
    expect(email).toHaveValue('')
  })
})
