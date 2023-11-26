import React from 'react'
import { classes } from './StaffNotation.css'

interface Props {
  idx: number
  channel: number
  names: string[]
  notes: { n: number; d?: number; t?: number }[]
  setNote: ({
    idx,
    channel,
    name,
    note,
  }: {
    idx: number
    channel: number
    name: string
    note: { n: number; d: number; t: number }
  }) => void
}

const StaffNotation: React.FC<Props> = (props) => {
  const { idx, channel, names, notes, setNote } = props
  const octaveNoteLength = 12
  const [name, setName] = React.useState(names[0])

  return (
    <div className={classes.root}>
      <select onChange={(e) => setName(e.target.value)}>
        {names.map((name) => (
          <option key={name}>{name}</option>
        ))}
      </select>
      <div className={classes.container}>
        {Array(100 * octaveNoteLength)
          .fill(undefined)
          .map((_, i) => (
            <div
              key={`note-${i}`}
              style={{
                top: (i % octaveNoteLength) * 20,
                left: Math.floor(i / octaveNoteLength) * 20,
              }}
              className={classes.emptyNote}
              onClick={() =>
                setNote({
                  idx,
                  channel,
                  name,
                  note: {
                    n: 12 - (i % octaveNoteLength) + 60,
                    d: 4,
                    t: Math.floor(i / octaveNoteLength),
                  },
                })
              }
            />
          ))}
        {notes.map((note, i) => (
          <div
            key={`note-${i}`}
            style={{
              top: 240 - ((note.n % octaveNoteLength) - 1) * 20,
              left: note.t * 20,
              width: note.d * 20,
            }}
            className={classes.note}
          />
        ))}
      </div>
    </div>
  )
}

export default StaffNotation
