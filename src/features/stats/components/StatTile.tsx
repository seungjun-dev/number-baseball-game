type Props = { label: string; value: string; sub?: string }

export function StatTile({ label, value, sub }: Props) {
  return (
    <div className="stat-tile">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  )
}
