# Style Guide - Number Pyramids Trainer

Единый стилевой гайд для всех UI элементов приложения.

## Кнопки

### Основные кнопки действий

Все основные кнопки должны использовать единый стиль:

```tsx
// Активная кнопка
className="
  flex-1 py-3 px-4
  rounded-xl
  font-bold text-base sm:text-lg
  transition-all duration-200
  flex items-center justify-center gap-2
  bg-gradient-to-r [color-gradient]
  text-white
  shadow-lg hover:shadow-xl
  hover:scale-[1.02] active:scale-[0.98]
"

// Неактивная/отключенная кнопка
className="
  bg-gray-200 text-gray-400 cursor-not-allowed
  [остальные классы как у активной]
"
```

### Цветовые схемы кнопок

- **Подсказка**: `from-amber-400 to-orange-400` (желто-оранжевый градиент)
- **Новая задача**: `from-blue-400 to-indigo-500` (сине-индиго градиент)
- **Проверить/Основное действие**: `from-primary-500 to-primary-600` или `bg-primary-500 hover:bg-primary-600`
- **Успех**: `bg-green-500` (зеленый)
- **Отключено**: `bg-gray-200 text-gray-400`

### Иконки в кнопках

- Используем эмодзи для визуальной привлекательности
- Размер: `text-xl` (20px)
- Отступ между иконкой и текстом: `gap-2`

Примеры:
- 💡 Подсказка
- 🔄 Новая задача
- ✓ Проверить

### Кнопка "Проверить"

Специальная кнопка для проверки ответа:

```tsx
className={`
  px-8 py-3 rounded-xl font-bold text-lg text-white
  transition-all duration-200
  ${isCorrect
    ? 'bg-green-500'
    : 'bg-primary-500 hover:bg-primary-600 active:scale-95'
  }
  disabled:opacity-50 disabled:cursor-not-allowed
`}
```

## Контейнеры кнопок

Кнопки должны быть в контейнере с единым стилем:

```tsx
<div className="flex justify-center gap-4 w-full max-w-md mx-auto">
  {/* кнопки */}
</div>
```

Или для кнопок разной ширины:

```tsx
<div className="flex gap-4 w-full max-w-md mx-auto">
  {/* кнопки с flex-1 или фиксированной шириной */}
</div>
```

## Адаптивность

- Все кнопки должны быть достаточно большими для удобного нажатия на мобильных
- Минимальная высота: `py-3` (12px padding)
- Минимальная ширина для тач-таргетов: 44px (рекомендация Apple/Google)

## Анимации

- **Hover**: `hover:scale-[1.02]` - легкое увеличение
- **Active**: `active:scale-[0.98]` - легкое уменьшение при нажатии
- **Transition**: `transition-all duration-200` - плавные переходы

## Тени

- Активные кнопки: `shadow-lg hover:shadow-xl`
- Неактивные: без теней

## Примеры использования

### Кнопка подсказки
```tsx
<button
  onClick={onHint}
  disabled={!canUseHint}
  className={`
    flex-1 py-3 px-4 rounded-xl font-bold text-base sm:text-lg
    transition-all duration-200
    flex items-center justify-center gap-2
    ${canUseHint
      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
    }
  `}
>
  <span className="text-xl">💡</span>
  <span>Подсказка</span>
  {hintsUsed > 0 && <span className="text-sm opacity-75">({hintsUsed})</span>}
</button>
```

### Кнопка новой задачи
```tsx
<button
  onClick={onNewPuzzle}
  className="
    flex-1 py-3 px-4 rounded-xl
    bg-gradient-to-r from-blue-400 to-indigo-500
    text-white font-bold text-base sm:text-lg
    shadow-lg hover:shadow-xl
    transition-all duration-200
    hover:scale-[1.02] active:scale-[0.98]
    flex items-center justify-center gap-2
  "
>
  <span className="text-xl">🔄</span>
  <span>Новая задача</span>
</button>
```

### Кнопка проверки
```tsx
<button
  onClick={onCheck}
  disabled={isDisabled}
  className={`
    px-8 py-3 rounded-xl font-bold text-lg text-white
    transition-all duration-200
    ${isCorrect
      ? 'bg-green-500'
      : 'bg-primary-500 hover:bg-primary-600 active:scale-95'
    }
    disabled:opacity-50 disabled:cursor-not-allowed
  `}
>
  {isCorrect ? 'Верно!' : 'Проверить'}
</button>
```

## Цветовая палитра

Основные цвета из `tailwind.config.js`:

- **Primary**: `#6366f1` (indigo-500)
- **Success**: `#22c55e` (green-500)
- **Warning/Amber**: `#fbbf24` (amber-400)
- **Orange**: `#fb923c` (orange-400)
- **Blue**: `#60a5fa` (blue-400)
- **Indigo**: `#6366f1` (indigo-500)
- **Gray (disabled)**: `#e5e7eb` (gray-200)

## Типографика

- **Заголовки кнопок**: `font-bold text-base sm:text-lg`
- **Вспомогательный текст**: `text-sm opacity-75`
- **Основной текст**: стандартный размер

## Доступность

- Все кнопки должны иметь `aria-label` для скринридеров
- Отключенные кнопки должны иметь `disabled` атрибут
- Контрастность текста должна соответствовать WCAG AA (минимум 4.5:1)

---

*Последнее обновление: январь 2026*

