import React from 'react'
import { WebAudioSynth } from './tool/webAudioSynth'
import StaffNotation from './tool/StaffNotation'

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
    }[]
  >([])
  const { webAudioSynth, emptySequence } = React.useMemo(() => {
    const webAudioSynth = new WebAudioSynth()
    webAudioSynth.init()
    const emptySequence = Array(WebAudioSynth.maxChannel)
      .fill(undefined)
      .map((_, i) => ({
        channel: i,
        name:
          i === 9
            ? webAudioSynth.drumNames[0]
            : webAudioSynth.instrumentNames[0],
        notes: [],
      }))
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
        let t = 0
        cur.notes.forEach((note) => {
          const div = note.d || 4
          const dt = (60 / tempo) * (4 / div)
          t += dt
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
          const n = webAudioSynth.getDrummapIdx(drammapPart.name)
          drammapPart.notes.forEach((note) => {
            const div = note.d || 4
            const dt = (60 / tempo) * (4 / div)
            const t = note.t || 0
            if (note.n) {
              webAudioSynth.noteOn({ ch: i, n, t, dt })
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

  const setNote = ({
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

  return (
    <>
      <h1>WebAudioSynth画面</h1>
      <button onClick={() => play({})}>Play</button>
      <button onClick={() => play({ isRecording: true })}>Rec</button>

      <button onClick={saveSequences}>save</button>
      <button onClick={clearSequences}>clear</button>
      <div>
        {sequences.map((s, i) => (
          <StaffNotation
            key={i}
            channel={s.channel}
            name={s.name}
            names={
              s.channel === 9
                ? webAudioSynth.drumNames
                : webAudioSynth.instrumentNames
            }
            notes={s.notes || []}
            setName={setName}
            setNote={setNote}
          />
        ))}
      </div>
    </>
  )
}

export default App
