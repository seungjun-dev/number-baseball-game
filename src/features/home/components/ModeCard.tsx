type Props = {
  index: string
  emoji: string
  title: string
  description: string
  cta: string
  onSelect: () => void
}

export function ModeCard({ index, emoji, title, description, cta, onSelect }: Props) {
  return (
    <button type="button" onClick={onSelect}>
      <span className="mode-index">{index}</span>
      <b className="mode-emoji" aria-hidden="true">
        {emoji}
      </b>
      <strong>{title}</strong>
      <small>{description}</small>
      <i aria-hidden="true">{cta}</i>
    </button>
  )
}
