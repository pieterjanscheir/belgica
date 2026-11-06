'use client'

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'

interface Props<T> {
    label: string
    placeholder?: string
    /** The options for what's typed, best first */
    search: (text: string) => T[]
    /** Announced to screen readers as the options change */
    countLabel: (count: number) => string
    value: T | null
    onChange: (item: T | null) => void
    /** The text in the field for a chosen item */
    display: (item: T) => string
    option: (item: T) => ReactNode
    itemKey: (item: T) => string
}

/**
 * A text field with suggestions, as the ARIA combobox pattern has it: the focus stays in the
 * field, the arrow keys move through the options (aria-activedescendant), Enter picks one and
 * Escape closes the list, or clears the field when it's closed.
 */
export function Combobox<T>({
    label,
    placeholder,
    search,
    countLabel,
    value,
    onChange,
    display,
    option,
    itemKey,
}: Props<T>) {
    const id = useId()
    const [text, setText] = useState(value ? display(value) : '')
    const [shown, setShown] = useState(value)
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)

    // Keep the text in step when the value is set from outside: a link, an example
    if (value !== shown) {
        setShown(value)
        setText(value ? display(value) : '')
    }

    const options = value && text === display(value) ? [] : search(text)
    const expanded = open && options.length > 0
    const optionId = (i: number) => `${id}-option-${i}`

    function choose(item: T) {
        setShown(item)
        setText(display(item))
        setOpen(false)
        onChange(item)
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            if (!expanded) {
                setOpen(true)
                return
            }
            const step = e.key === 'ArrowDown' ? 1 : -1
            setActive((a) => (a + step + options.length) % options.length)
        } else if (e.key === 'Enter' && expanded) {
            e.preventDefault()
            const item = options[active]
            if (item) choose(item)
        } else if (e.key === 'Escape') {
            if (expanded) setOpen(false)
            else if (text) {
                setText('')
                setShown(null)
                onChange(null)
            }
        }
    }

    return (
        <div className="search combobox">
            <label htmlFor={id} className="field-label">
                {label}
            </label>
            <input
                id={id}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={expanded}
                aria-controls={`${id}-listbox`}
                aria-activedescendant={expanded ? optionId(active) : undefined}
                placeholder={placeholder}
                autoComplete="off"
                // Not a login or an address form: keep password managers' icons out of it
                data-1p-ignore
                data-lpignore="true"
                data-bwignore
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                value={text}
                onChange={(e) => {
                    setText(e.target.value)
                    setActive(0)
                    setOpen(true)
                    // Typing over a choice clears it, and keeps what's typed
                    if (value) {
                        setShown(null)
                        onChange(null)
                    }
                }}
                onFocus={() => {
                    setOpen(true)
                }}
                onBlur={() => {
                    setOpen(false)
                }}
                onKeyDown={onKeyDown}
            />
            <ul id={`${id}-listbox`} role="listbox" aria-label={label} hidden={!expanded}>
                {options.map((item, i) => (
                    <li
                        key={itemKey(item)}
                        id={optionId(i)}
                        role="option"
                        aria-selected={i === active}
                        // Keep the focus in the field while an option is clicked
                        onPointerDown={(e) => {
                            e.preventDefault()
                        }}
                        onClick={() => {
                            choose(item)
                        }}
                        onPointerEnter={() => {
                            setActive(i)
                        }}
                    >
                        {option(item)}
                    </li>
                ))}
            </ul>
            <p className="sr-only" aria-live="polite">
                {open && text && !value ? countLabel(options.length) : ''}
            </p>
        </div>
    )
}
