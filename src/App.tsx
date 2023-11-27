import React from 'react'
import { WebAudioSynth } from './tool/webAudioSynth'
import Sequence from './tool/Sequence'

const App: React.FC = () => {
  const tempo = 80 // テンポ80
  const [sequences, setSequences] = React.useState<
    {
      channel: number
      name?: string
      // 中央ド=中央ハ=MIDIノートナンバー60
      // n: ド=60, レ=62, ミ=64, ファ=65, ソ=67, ラ=69, シ=71, ド=72
      // d: 4分音符=4, 8分音符=8, 16分音符=16
      // t: 開始時間
      notes?: { n: number; d: number; tt: number; t: number }[]
      mode: 'instrument' | 'drum'
    }[]
  >([])
  const { webAudioSynth, emptySequence } = React.useMemo(() => {
    const webAudioSynth = new WebAudioSynth()
    webAudioSynth.init()
    const emptySequence = Array(WebAudioSynth.maxChannel)
      .fill(undefined)
      .map(
        (_, i) =>
          ({
            channel: i,
            name:
              i === 9
                ? webAudioSynth.drumNames[0]
                : webAudioSynth.instrumentNames[0],
            mode: i === 9 ? 'drum' : 'instrument',
            notes: [],
          }) as (typeof sequences)[0],
      )
    return { webAudioSynth, emptySequence }
  }, [])

  React.useEffect(() => {
    const dataStr = window.localStorage.getItem('sequences')
    if (dataStr) {
      setSequences(JSON.parse(dataStr))
    } else {
      setSequences(emptySequence)
    }
  }, [webAudioSynth, emptySequence])

  const clearSequences = () => {
    window.localStorage.setItem('sequences', JSON.stringify(emptySequence))
    setSequences(emptySequence)
  }
  const saveSequences = () => {
    window.localStorage.setItem('sequences', JSON.stringify(sequences))
  }

  async function play({ isRecording }: { isRecording?: boolean }) {
    const instrumentParts: {
      channel: number
      name?: string
      // 中央ド=中央ハ=MIDIノートナンバー60
      // n: ド=60, レ=62, ミ=64, ファ=65, ソ=67, ラ=69, シ=71, ド=72
      // d: 4分音符=4, 8分音符=8, 16分音符=16
      // t: 開始時間
      notes?: { n: number; d?: number; t?: number }[]
    }[] = sequences.filter((s) => s.channel !== 9)

    const drammapParts: {
      channel: number
      name?: string
      notes?: { n: number; d?: number; t?: number }[]
    }[] = sequences.filter((s) => s.channel === 9)

    const duration = [...instrumentParts, ...drammapParts].reduce(
      (acc, cur) => {
        cur.notes.forEach((note) => {
          const div = note.d || 4
          const dt = (60 / tempo) * (4 / div)
          const t = note.t + dt
          if (acc < t) acc = t
        })
        return acc
      },
      0,
    )

    if (isRecording) {
      await webAudioSynth.recording(duration)
    }

    for (let i = 0; i < WebAudioSynth.maxChannel; ++i) {
      if (i === 9) {
        for (const drammapPart of drammapParts) {
          drammapPart.notes.forEach((note) => {
            const div = note.d || 4
            const dt = (60 / tempo) * (4 / div)
            const t = note.t || 0
            if (note.n) {
              webAudioSynth.noteOn({ ch: i, n: note.n, t, dt })
            }
          })
        }
        continue
      }
      const instrumentPart = instrumentParts[i]
      if (!instrumentPart) continue
      webAudioSynth.setInstrument(i, instrumentPart.name)

      instrumentPart.notes.forEach((note) => {
        const div = note.d || 4
        const dt = (60 / tempo) * (4 / div)
        const t = note.t || 0
        if (note.n) {
          webAudioSynth.noteOn({ ch: i, n: note.n, t, dt })
        }
      })
    }
  }

  const setName = ({ channel, name }: { channel: number; name: string }) => {
    const sequence = sequences[channel]
    sequences[channel] = { ...sequence, name }
    if (channel !== 9) {
      webAudioSynth.setInstrument(channel, sequence.name)
    }
    setSequences([...sequences])
  }

  const addNote = ({
    channel,
    note,
  }: {
    channel: number
    note: { n: number; d: number; tt: number }
  }) => {
    const dt = (60 / tempo) * (4 / note.d)
    webAudioSynth.noteOn({
      ch: channel,
      n: note.n,
      t: 0,
      dt,
    })
    const sequence = sequences[channel]
    const notes = sequence.notes || []
    notes.push({
      n: note.n,
      d: note.d,
      tt: note.tt,
      t: note.tt * (60 / tempo) * (4 / 32),
    })
    sequences[channel] = { ...sequence, notes }
    setSequences([...sequences])
  }

  const deleteNote = ({
    channel,
    noteIndex,
  }: {
    channel: number
    noteIndex: number
  }) => {
    const sequence = sequences[channel]
    const notes = sequence.notes || []
    notes.splice(noteIndex, 1)
    sequences[channel] = { ...sequence, notes }
    setSequences([...sequences])
  }

  const updateNote = ({
    channel,
    note,
    noteIndex,
  }: {
    channel: number
    note: { n: number; d: number; tt: number }
    noteIndex: number
  }) => {
    const sequence = sequences[channel]
    const notes = sequence.notes || []
    if (!notes[noteIndex]) return

    const dt = (60 / tempo) * (4 / note.d)
    webAudioSynth.noteOn({
      ch: channel,
      n: note.n,
      t: 0,
      dt,
    })
    notes[noteIndex] = { ...note, t: note.tt * (60 / tempo) * (4 / 32) }
    sequences[channel] = { ...sequence, notes }
    setSequences([...sequences])
  }

  return (
    <>
      <h1>WebAudioシーケンサー</h1>
      <button onClick={() => play({})}>Play</button>
      <button onClick={() => play({ isRecording: true })}>Rec</button>

      <button onClick={saveSequences}>save</button>
      <button onClick={clearSequences}>clear</button>
      <div>
        {sequences.map((s, i) => (
          <details key={`sequencer-${i}`} open={i === 0 || i === 9}>
            <summary>Channel {i + 1}</summary>
            <dl style={{ margin: 0 }}>
              <Sequence
                channel={s.channel}
                name={s.name}
                names={
                  s.mode === 'drum'
                    ? webAudioSynth.drumNames
                    : webAudioSynth.instrumentNames
                }
                notes={s.notes || []}
                octaveNoteLength={
                  s.mode === 'drum' ? webAudioSynth.drumNames.length : 12
                }
                setName={setName}
                addNote={addNote}
                deleteNote={deleteNote}
                updateNote={updateNote}
                mode={s.mode}
              />
            </dl>
          </details>
        ))}
      </div>
    </>
  )
}

export default App
