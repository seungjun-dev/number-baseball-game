import { useId, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  /** 입력 아래에 보여줄 안내/에러 */
  hint?: string | null
}

export function TextField({ label, hint, className, ...rest }: Props) {
  const id = useId()
  const hintId = `${id}-hint`
  return (
    <div className={['text-field', className].filter(Boolean).join(' ')}>
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-describedby={hint ? hintId : undefined} aria-invalid={hint ? true : undefined} {...rest} />
      {hint && (
        <small id={hintId} className="form-error">
          {hint}
        </small>
      )}
    </div>
  )
}
