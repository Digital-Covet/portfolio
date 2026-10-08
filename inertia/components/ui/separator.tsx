import { Separator as BaseSeparator } from '@base-ui/react/separator'

export function UiSeparator(props: BaseSeparator.Props) {
  const { className, ...rest } = props
  return (
    <BaseSeparator
      className={className}
      style={{ height: 1, background: 'var(--hairline)', margin: '8px 4px' }}
      {...rest}
    />
  )
}

export { BaseSeparator as Separator }
