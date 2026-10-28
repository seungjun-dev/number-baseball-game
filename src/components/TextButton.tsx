import type { ButtonHTMLAttributes } from 'react'

export function TextButton({ className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={['leave-game', className].filter(Boolean).join(' ')} {...rest} />
}
