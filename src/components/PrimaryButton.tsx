import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 버튼 오른쪽에 붙는 강조 아이콘 */
  icon?: ReactNode
}

export function PrimaryButton({ icon, children, className, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className={['pitch-button', className].filter(Boolean).join(' ')} {...rest}>
      {children}
      {icon && <span aria-hidden="true">{icon}</span>}
    </button>
  )
}
