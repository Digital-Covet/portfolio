/**
 * Covet Grid signature backdrop. Static CSS/SVG, aria-hidden,
 * never placed behind tables or forms.
 */
export default function CovetGrid({
  className = '',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      className={`covet-grid covet-grid--auto pointer-events-none absolute inset-0 ${className}`}
      style={style}
    />
  )
}
