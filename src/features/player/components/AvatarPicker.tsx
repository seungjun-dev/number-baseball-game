import { AVATARS } from '../logic/nickname'

type Props = { value: string; onChange: (avatar: string) => void }

export function AvatarPicker({ value, onChange }: Props) {
  return (
    <div className="avatar-picker" role="radiogroup" aria-label="아바타">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          role="radio"
          aria-checked={avatar === value}
          aria-label={`아바타 ${avatar}`}
          className={avatar === value ? 'selected' : ''}
          onClick={() => onChange(avatar)}
        >
          {avatar}
        </button>
      ))}
    </div>
  )
}
