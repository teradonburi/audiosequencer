import React from 'react'
import { cellSize, classes } from './Sequence.css'
import {
  Menu,
  Item,
  useContextMenu,
  ItemParams,
  Separator,
} from 'react-contexify'
import 'react-contexify/ReactContexify.css'
import 'react-resizable/css/styles.css'
import { ResizableBox } from 'react-resizable'
// import Draggable from 'react-draggable'

interface Props {
  channel: number
  name: string
  names: string[]
  notes: { n: number; d: number; tt: number }[]
  setName: ({ channel, name }: { channel: number; name: string }) => void
  addNote: ({
    channel,
    note,
  }: {
    channel: number
    note: { n: number; d: number; tt: number }
  }) => void
  deleteNote: ({
    channel,
    noteIndex,
  }: {
    channel: number
    noteIndex: number
  }) => void
  updateNote: ({
    channel,
    note,
    noteIndex,
  }: {
    channel: number
    note: { n: number; d: number; tt: number }
    noteIndex: number
  }) => void
  timeLineMax: number
  octaveNoteLength: number
  mode: 'instrument' | 'drum'
}

const Sequence: React.FC<Props> = (props) => {
  const {
    channel,
    name,
    names,
    notes,
    timeLineMax,
    octaveNoteLength,
    setName,
    addNote,
    deleteNote,
    updateNote,
    mode,
  } = props
  const [drag, setDrag] = React.useState(null)
  const noteRefs = React.useRef([])

  const onDragStart = (e) => {
    const targets = []
    for (let i = 0; i < noteRefs.current.length; i++) {
      const noteComponent = noteRefs.current[i]
      if (noteComponent) {
        const elem = document.getElementById(noteComponent.props.id)
        const rect = elem.getBoundingClientRect()
        const noteIndex = parseInt(elem.getAttribute('data-id'), 10)
        const n = parseInt(elem.getAttribute('data-n'), 10)
        const tt = parseInt(elem.getAttribute('data-tt'), 10)

        // マウスがノートの範囲内にあるかどうか
        if (
          rect.left < e.clientX &&
          e.clientX < rect.right &&
          rect.top < e.clientY &&
          e.clientY < rect.bottom
        ) {
          targets.push({ noteIndex, n, tt })
        }
        // 複数選択モード
        else if (elem.getAttribute('data-selected') === 'true') {
          targets.push({ noteIndex, n, tt })
        }
      }
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setDrag({ x, y, targets })
  }

  const onDrag = (e) => {
    if (drag) {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const diffX = Math.floor((x - drag.x) / cellSize)
      const diffY = Math.round((y - drag.y) / cellSize)
      if (diffX === 0 && diffY === 0) return
      for (const target of drag.targets) {
        const noteIndex = target.noteIndex
        const note = notes[noteIndex]
        const n = target.n + diffY * (mode === 'instrument' ? -1 : 1)
        const tt = target.tt + diffX
        updateNote({
          channel: props.channel,
          note: {
            ...note,
            n,
            tt,
          },
          noteIndex: target.noteIndex,
        })
      }
    }
  }

  return (
    <div
      className={
        mode === 'instrument' ? classes.instrumentRoot : classes.drumRoot
      }
      onMouseDown={onDragStart}
      onMouseMove={onDrag}
      onMouseUp={() => setDrag(null)}
    >
      {mode === 'instrument' && (
        <div className={classes.instrument}>
          <select
            defaultValue={name}
            onChange={(e) => setName({ channel, name: e.target.value })}
            className={classes.selectName}
          >
            {names.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>
      )}
      {mode === 'drum' && (
        <div className={classes.drumset}>
          {names.map((name) => (
            <div key={name} className={classes.name}>
              {name}
            </div>
          ))}
        </div>
      )}

      <div className={classes.container}>
        {notes.map((note, i) => {
          const id = `channel-${channel}-note-${i}`
          return (
            <div
              key={id}
              style={{
                top:
                  mode === 'instrument'
                    ? (octaveNoteLength + 60 - note.n) * cellSize
                    : (note.n - 35) * cellSize,
                left: note.tt * cellSize,
                position: 'absolute',
                zIndex: 1,
              }}
            >
              <Note
                ref={(elem) => (noteRefs.current[i] = elem)}
                id={id}
                idx={i}
                channel={channel}
                name={name}
                note={note}
                deleteNote={deleteNote}
                updateNote={updateNote}
                style={{
                  width: note.d * cellSize - 2,
                  height: cellSize - 2,
                }}
              />
            </div>
          )
        })}
        {Array(timeLineMax * octaveNoteLength)
          .fill(undefined)
          .map((_, i) => (
            <div
              key={`note-${i}`}
              style={{
                top: (i % octaveNoteLength) * cellSize,
                left: Math.floor(i / octaveNoteLength) * cellSize,
                // n: ド=60, レ=62, ミ=64, ファ=65, ソ=67, ラ=69, シ=71, ド=72
                background:
                  mode === 'instrument' &&
                  [1, 3, 6, 8, 10].includes(i % octaveNoteLength)
                    ? '#888'
                    : '#fff',
              }}
              className={classes.emptyNote}
              onClick={() =>
                addNote({
                  channel,
                  note: {
                    d: mode === 'instrument' ? 4 : 1,
                    n:
                      mode === 'instrument'
                        ? octaveNoteLength - (i % octaveNoteLength) + 60
                        : (i % octaveNoteLength) + 35,
                    tt: Math.floor(i / octaveNoteLength),
                  },
                })
              }
            />
          ))}
      </div>
    </div>
  )
}

interface NoteProps {
  id: string
  idx: number
  channel: number
  name: string
  note: Props['notes'][0]
  deleteNote: Props['deleteNote']
  updateNote: Props['updateNote']
  style?: React.CSSProperties
}

const Note = React.forwardRef<unknown, NoteProps>((props, ref) => {
  const { id, idx, channel, note, deleteNote, updateNote, style } = props
  const [selected, setSelected] = React.useState(false)

  const menuId = `${id}-menu`
  const { show } = useContextMenu({
    id: menuId,
  })
  function handleContextMenu(
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    channel: number,
    note: NoteProps['note'],
    noteIndex: number,
  ) {
    e.preventDefault()
    show({
      event: e,
      props: {
        channel,
        note,
        noteIndex,
      },
    })
  }
  const handleItemClick = (params: ItemParams) => {
    const { id, props } = params
    switch (id) {
      case 'delete':
        deleteNote({ channel: props.channel, noteIndex: props.noteIndex })
        break
      case 'whole':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 16,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'half':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 8,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'quater':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 4,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'eighth':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 2,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'sixteenth':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 1,
          },
          noteIndex: props.noteIndex,
        })
        break
    }
  }

  const onResize = (_, { node, size }) => {
    const noteIndex = parseInt(node.parentNode.getAttribute('data-id'), 10)
    const d = Math.round(size.width / cellSize)
    if (d !== note.d) {
      updateNote({
        channel: props.channel,
        note: {
          ...note,
          d,
        },
        noteIndex,
      })
    }
  }

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)) {
      setSelected(!selected)
    } else {
      setSelected(false)
    }
  }

  return (
    <>
      <ResizableBox
        ref={ref}
        id={id}
        data-id={idx}
        data-selected={selected}
        data-n={note.n}
        data-tt={note.tt}
        width={note.d * cellSize - 2}
        height={cellSize - 2}
        onResizeStart={(e) => e.stopPropagation()}
        onResizeStop={onResize}
        axis="x"
        resizeHandles={['e']}
        draggableOpts={{ grid: [cellSize, cellSize - 2] }}
        minConstraints={[cellSize, cellSize - 2]}
        maxConstraints={[cellSize * 16, cellSize - 2]}
        style={{
          ...style,
          border: selected ? 'thin solid red' : 'thin solid black',
        }}
        className={classes.note}
        onContextMenu={(e) => handleContextMenu(e, channel, note, idx)}
        onClick={onClick}
      />
      <Menu id={menuId}>
        <Item id="delete" onClick={handleItemClick}>
          Delete
        </Item>
        <Separator />
        <Item id="whole" onClick={handleItemClick}>
          whole
        </Item>
        <Item id="half" onClick={handleItemClick}>
          half
        </Item>
        <Item id="quater" onClick={handleItemClick}>
          quater
        </Item>
        <Item id="eighth" onClick={handleItemClick}>
          eighth
        </Item>
        <Item id="sixteenth" onClick={handleItemClick}>
          sixteenth
        </Item>
      </Menu>
    </>
  )
})

export default Sequence
