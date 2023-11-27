import React from 'react'
import { cellSize, classes } from './Sequence.css'

interface Props {
  channel: number
  name: string
  names: string[]
  notes: { n: number; d: number; tt: number }[]
  setName: ({ channel, name }: { channel: number; name: string }) => void
  setNote: ({
    channel,
    note,
  }: {
    channel: number
    note: { n: number; d: number; tt: number }
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
    setNote,
    mode,
  } = props

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
                setNote({
                  channel,
                  note: {
                    n:
                      mode === 'instrument'
                        ? octaveNoteLength - (i % octaveNoteLength) + 60
                        : (i % octaveNoteLength) + 35,
                    d: 4,
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
              width: note.d * cellSize,
            }}
            className={classes.note}
          />
        ))}
      </div>
    </div>
  )
}

export default Sequence
