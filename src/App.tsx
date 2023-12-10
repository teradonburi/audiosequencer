import React from 'react'
import { WebAudioSynth } from './tool/webAudioSynth'
import Sequence from './tool/Sequence'
import { cellSize } from './tool/Note.css'

const App: React.FC = () => {
  // 60秒 ⁄ 120 = 0.5秒（「Tempo = 120.000」 は、「１分間に４分音符が 120個」 の意）
  const [tempo, setTempo] = React.useState(100)
  const [player, setPlayer] = React.useState({
    pos: 0,
    startTime: 0,
    status: 'stop',
  })
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
  const copyTargets = React.useRef([])
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
              i === WebAudioSynth.drumsetChannel
                ? webAudioSynth.drumNames[0]
                : webAudioSynth.instrumentNames[0],
            mode: i === WebAudioSynth.drumsetChannel ? 'drum' : 'instrument',
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

    return () => {
      webAudioSynth.release()
    }
  }, [webAudioSynth, emptySequence])

  const onKeyDown = (e) => {
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      const notes = document.querySelectorAll('div.note[data-selected="true"]')
      const targets = Array.from(notes)
        .map((n) => {
          const channel = parseInt(n.getAttribute('data-channel'), 10)
          const noteIndex = parseInt(n.getAttribute('data-id'), 10)
          const note = sequences.find((s) => s.channel === channel)?.notes[
            noteIndex
          ]
          return note ? { channel, note } : null
        })
        .filter((n) => n)
      copyTargets.current = targets
    } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      const targets = copyTargets.current
      for (const target of targets) {
        addNote({
          channel: target.channel,
          note: {
            n: target.note.n,
            d: target.note.d,
            tt: target.note.tt,
          },
        })
      }
      copyTargets.current = []
    }
  }

  React.useEffect(() => {
    let handle = null
    const loop = () => {
      switch (player.status) {
        case 'play':
          {
            const pos = webAudioSynth.currentTime - player.startTime
            setPlayer({ ...player, pos })
          }
          break
        case 'pause':
        case 'stop':
          {
            setPlayer({ ...player, startTime: webAudioSynth.currentTime })
          }
          break
      }
      handle = requestAnimationFrame(loop)
    }
    handle = requestAnimationFrame(loop)

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      cancelAnimationFrame(handle)
    }
  })

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
    }[] = sequences.filter((s) => s.channel !== WebAudioSynth.drumsetChannel)

    const drammapParts: {
      channel: number
      name?: string
      notes?: { n: number; d?: number; t?: number }[]
    }[] = sequences.filter((s) => s.channel === WebAudioSynth.drumsetChannel)

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

    const pos = player.pos
    setPlayer({
      ...player,
      startTime: webAudioSynth.currentTime - pos,
      status: 'play',
    })

    for (let i = 0; i < WebAudioSynth.maxChannel; ++i) {
      if (i === WebAudioSynth.drumsetChannel) {
        for (const drammapPart of drammapParts) {
          drammapPart.notes.forEach((note) => {
            const div = note.d || 4
            const dt = (60 / tempo) * (4 / div)
            const t = note.t || 0
            if (note.n && t >= pos) {
              webAudioSynth.noteOn({ ch: i, n: note.n, t: t - pos, dt })
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
        if (note.n && t >= pos) {
          webAudioSynth.noteOn({ ch: i, n: note.n, t: t - pos, dt })
        }
      })
    }
  }

  const pause = () => {
    for (let ch = 0; ch < WebAudioSynth.maxChannel; ++ch) {
      webAudioSynth.allSoundOff(ch)
    }
    setPlayer({
      ...player,
      status: 'pause',
    })
  }

  const stop = () => {
    for (let ch = 0; ch < WebAudioSynth.maxChannel; ++ch) {
      webAudioSynth.allSoundOff(ch)
    }
    setPlayer({
      ...player,
      pos: 0,
      status: 'stop',
    })
  }

  const setName = ({ channel, name }: { channel: number; name: string }) => {
    const sequence = sequences[channel]
    sequences[channel] = { ...sequence, name }
    if (channel !== WebAudioSynth.drumsetChannel) {
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
      t: note.tt * (60 / tempo) * (4 / 16), // 16分音符
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

    if (note.n !== notes[noteIndex].n) {
      const dt = (60 / tempo) * (4 / note.d)
      webAudioSynth.noteOn({
        ch: channel,
        n: note.n,
        t: 0,
        dt,
      })
    }
    notes[noteIndex] = { ...note, t: note.tt * (60 / tempo) * (4 / 16) }
    sequences[channel] = { ...sequence, notes }
    setSequences([...sequences])
  }

  const updateTempo = (tempo: number) => {
    setSequences(
      sequences.map((s) => ({
        ...s,
        notes: (s.notes || []).map((n) => ({
          ...n,
          t: n.tt * (60 / tempo) * (4 / 16),
        })),
      })),
    )
    setTempo(tempo)
  }

  const onSeekSet = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const newPos =
      Math.round((e.clientX - rect.left) / cellSize) / 4 / (tempo / 60)
    setPlayer({
      ...player,
      pos: newPos,
    })
  }

  return (
    <>
      <h1>WebAudioシーケンサー</h1>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 4,
          background: 'white',
          padding: 10,
        }}
      >
        <button onClick={() => (player.status === 'play' ? pause() : play({}))}>
          {player.status === 'play' ? 'Pause' : 'Play'}
        </button>
        <button onClick={stop}>Stop</button>
        <button onClick={() => play({ isRecording: true })}>Rec</button>

        <button onClick={saveSequences}>save</button>
        <button onClick={clearSequences}>clear</button>
        <span>
          tempo:
          <input
            type="number"
            onChange={(e) => updateTempo(parseInt(e.target.value, 10))}
            defaultValue={tempo}
            style={{ width: 50, textAlign: 'right' }}
          />
        </span>
      </div>
      <div>
        {sequences.map((s, i) => {
          const octaveNoteLength =
            s.mode === 'drum' ? webAudioSynth.drumNames.length : 13
          return (
            <details
              key={`sequencer-${i}`}
              open={i === 0 || i === WebAudioSynth.drumsetChannel}
            >
              <summary>Channel {i + 1}</summary>
              <dl style={{ margin: 0 }}>
                <Sequence
                  pos={player.pos * cellSize * 4 * (tempo / 60)}
                  channel={s.channel}
                  name={s.name}
                  names={
                    s.mode === 'drum'
                      ? webAudioSynth.drumNames
                      : webAudioSynth.instrumentNames
                  }
                  notes={s.notes || []}
                  timeLineMax={100}
                  octaveNoteLength={octaveNoteLength}
                  setName={setName}
                  addNote={addNote}
                  deleteNote={deleteNote}
                  updateNote={updateNote}
                  onSeekSet={onSeekSet}
                  mode={s.mode}
                />
              </dl>
            </details>
          )
        })}
      </div>
    </>
  )
}

export default App
