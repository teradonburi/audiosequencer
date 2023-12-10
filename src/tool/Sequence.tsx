import React from 'react'
import { classes } from './Sequence.css'
import 'react-contexify/ReactContexify.css'
import { cellSize } from './Note.css'
import Note, { Props as NoteProps } from './Note'

interface Props {
  pos: number
  channel: number
  name: string
  names: string[]
  setName: ({ channel, name }: { channel: number; name: string }) => void
  addNote: ({
    channel,
    note,
  }: {
    channel: number
    note: NoteProps['note']
  }) => void
  notes: NoteProps['note'][]
  deleteNote: NoteProps['deleteNote']
  updateNote: NoteProps['updateNote']
  timeLineMax: number
  octaveNoteLength: number
  mode: 'instrument' | 'drum'
}

const Sequence: React.FC<Props> = (props) => {
  const {
    pos,
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
  const base = mode === 'instrument' ? 60 : 35

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
          targets.push({ id: noteComponent.props.id, noteIndex, n, tt })
        }
        // 複数選択モード
        else if (elem.getAttribute('data-selected') === 'true') {
          targets.push({ id: noteComponent.props.id, noteIndex, n, tt })
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

        if (n < base || n > base + octaveNoteLength - 1) continue
        if (tt < 0 || tt > timeLineMax) continue
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
                    ? (octaveNoteLength + base - note.n - 1) * cellSize
                    : (note.n - base) * cellSize,
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
        <div
          className={classes.seek}
          style={{
            left: pos,
            height: cellSize * (octaveNoteLength + 1),
          }}
        />
        {Array(timeLineMax * octaveNoteLength)
          .fill(undefined)
          .map((_, i) => (
            <div
              key={`note-${i}`}
              id={`channel-${channel}-note-block-${i}`}
              style={{
                top: (i % octaveNoteLength) * cellSize,
                left: Math.floor(i / octaveNoteLength) * cellSize,
                // n: ド=60, レ=62, ミ=64, ファ=65, ソ=67, ラ=69, シ=71, ド=72
                background:
                  mode === 'instrument' &&
                  [2, 4, 6, 9, 11].includes(i % octaveNoteLength)
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
                        ? base + octaveNoteLength - (i % octaveNoteLength) - 1
                        : (i % octaveNoteLength) + base,
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

export default Sequence
