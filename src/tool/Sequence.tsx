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
import { ResizableBox } from 'react-resizable'
import 'react-resizable/css/styles.css'

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
  octaveNoteLength: number
  mode: 'instrument' | 'drum'
}

const Sequence: React.FC<Props> = (props) => {
  const {
    channel,
    name,
    names,
    notes,
    octaveNoteLength,
    setName,
    addNote,
    deleteNote,
    updateNote,
    mode,
  } = props

  const MENU_ID = 'menu'
  const { show } = useContextMenu({
    id: MENU_ID,
  })

  function handleContextMenu(
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    channel: number,
    note: (typeof notes)[0],
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
    const note = notes[noteIndex]
    const d = Math.round(size.width / cellSize)
    updateNote({
      channel: props.channel,
      note: {
        ...note,
        d,
      },
      noteIndex,
    })
  }

  return (
    <div
      className={
        mode === 'instrument' ? classes.instrumentRoot : classes.drumRoot
      }
    >
      {mode === 'instrument' && (
        <select
          defaultValue={name}
          onChange={(e) => setName({ channel, name: e.target.value })}
          className={classes.selectName}
        >
          {names.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      )}
      {mode === 'drum' && (
        <div>
          {names.map((name) => (
            <div key={name} className={classes.name}>
              {name}
            </div>
          ))}
        </div>
      )}
      <div className={classes.container}>
        {Array(100 * octaveNoteLength)
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
                    n:
                      mode === 'instrument'
                        ? octaveNoteLength - (i % octaveNoteLength) + 60
                        : (i % octaveNoteLength) + 35,
                    d: mode === 'instrument' ? 4 : 1,
                    tt: Math.floor(i / octaveNoteLength),
                  },
                })
              }
            />
          ))}
        {notes.map((note, i) => (
          <div
            key={`note-${i}`}
            style={{
              top:
                mode === 'instrument'
                  ? octaveNoteLength * cellSize - (note.n - 60) * cellSize
                  : (note.n - 35) * cellSize,
              left: note.tt * cellSize,
            }}
            className={classes.note}
            onContextMenu={(e) => handleContextMenu(e, channel, note, i)}
          >
            <ResizableBox
              width={note.d * cellSize - 2}
              height={cellSize - 2}
              onResizeStop={onResize}
              axis="x"
              resizeHandles={['e']}
              draggableOpts={{ grid: [cellSize, cellSize - 2] }}
              minConstraints={[cellSize, cellSize - 2]}
              maxConstraints={[cellSize * 16, cellSize - 2]}
              data-id={i}
            />
          </div>
        ))}
        <Menu id={MENU_ID}>
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
      </div>
    </div>
  )
}

export default Sequence
