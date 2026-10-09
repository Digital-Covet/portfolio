import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, ArrowRight, GripVertical, Trash2 } from 'lucide-react'

export type GalleryImage = { id: string; name: string; url: string }

type Props = {
  items: GalleryImage[]
  onChange: (next: GalleryImage[]) => void
}

const btn =
  'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary'

function Frame({
  item,
  index,
  count,
  onMove,
  onRemove,
}: {
  item: GalleryImage
  index: number
  count: number
  onMove: (delta: -1 | 1) => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-surface-raised ${isDragging ? 'relative z-10 opacity-80 outline-2 outline-primary' : ''}`}
    >
      <img
        src={item.url}
        alt={item.name}
        width={640}
        height={480}
        loading="lazy"
        draggable={false}
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="flex items-center justify-between px-1 py-0.5">
        <span className="flex items-center">
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={`Reorder ${item.name}, position ${index + 1} of ${count}. Press space to pick up.`}
            className={`${btn} cursor-grab touch-none active:cursor-grabbing`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} strokeWidth={1.75} aria-hidden />
          </button>
          <span className="font-mono text-[10px] text-muted-foreground">
            {String(index + 1).padStart(2, '0')}
          </span>
        </span>
        <span className="flex">
          <button
            type="button"
            className={btn}
            disabled={index === 0}
            aria-label={`Move ${item.name} earlier`}
            onClick={() => onMove(-1)}
          >
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className={btn}
            disabled={index === count - 1}
            aria-label={`Move ${item.name} later`}
            onClick={() => onMove(1)}
          >
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
          <button
            type="button"
            className={btn}
            aria-label={`Remove ${item.name}`}
            onClick={onRemove}
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </span>
      </div>
    </li>
  )
}

/**
 * Contact-sheet strip with drag-and-drop reordering. Keyboard users can pick a frame up
 * with space and move it with the arrow keys; the earlier/later buttons stay as a
 * simpler fallback.
 */
export function SortableGallery({ items, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from >= 0 && to >= 0) onChange(arrayMove(items, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <ul
          aria-label="Gallery images, in display order"
          className="grid grid-cols-2 gap-0.5 rounded-md bg-surface-raised p-0.5 sm:grid-cols-3"
        >
          {items.map((item, i) => (
            <Frame
              key={item.id}
              item={item}
              index={i}
              count={items.length}
              onMove={(d) => onChange(arrayMove(items, i, i + d))}
              onRemove={() => onChange(items.filter((x) => x.id !== item.id))}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
