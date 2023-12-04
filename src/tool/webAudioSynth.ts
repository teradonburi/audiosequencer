import { GeneralMIDI, Wave } from './generalMIDI'
import { WebAudioRecorder } from './webAudioRecorder'

export class WebAudioSynth {
  private generalMIDI: GeneralMIDI = null
  private webAudioRecorder: WebAudioRecorder = null
  private actx: AudioContext = null
  private dest: AudioDestinationNode = null
  private comp: DynamicsCompressorNode = null
  // sterao mode pan
  private chpan: StereoPannerNode[] = []
  private chvol: GainNode[] = []
  private chmod: GainNode[] = []
  private out: GainNode = null
  private lfo: OscillatorNode = null

  private selectedInstruments: number[] = []
  private selectedDrummaps: number[] = []
  private notetab: {
    e: number
    o: (AudioBufferSourceNode | OscillatorNode)[]
    g: GainNode[]
    ch: number
  }[] = []
  private timer: NodeJS.Timeout = null

  private readonly releaseRatio = 3.5
  public static readonly maxChannel = 16
  public static readonly drumsetChannel = 9

  public init() {
    if (this.actx) return

    // init MIDI 16ch
    for (let i = 0; i < WebAudioSynth.maxChannel; ++i) {
      this.selectedInstruments[i] = 0
      this.selectedDrummaps[i] = 0
    }
    // 10ch is drum channel
    this.selectedDrummaps[WebAudioSynth.drumsetChannel] = 1

    this.actx = new AudioContext()
    this.generalMIDI = new GeneralMIDI(this.actx)
    this.webAudioRecorder = new WebAudioRecorder()

    // out -> compressor -> destination(output sound)
    this.dest = this.actx.destination
    this.out = this.actx.createGain()
    this.comp = this.actx.createDynamicsCompressor()
    this.out.connect(this.comp)
    this.comp.connect(this.dest)

    this.lfo = this.actx.createOscillator()
    this.lfo.frequency.value = 5
    this.lfo.start(0)
    for (let i = 0; i < WebAudioSynth.maxChannel; ++i) {
      this.chvol[i] = this.actx.createGain()
      // stereo mode
      // gain -> pan -> out
      if (this.actx.createStereoPanner) {
        this.chpan[i] = this.actx.createStereoPanner()
        this.chvol[i].connect(this.chpan[i])
        this.chpan[i].connect(this.out)
      }
      // monaural mode
      // gain -> out
      else {
        this.chpan[i] = null
        this.chvol[i].connect(this.out)
      }
      // oscillator -> chmod
      this.chmod[i] = this.actx.createGain()
      this.lfo.connect(this.chmod[i])
    }

    let relcnt = 0
    // reset note if note end
    this.timer = setInterval(() => {
      // console.log(this.actx.currentTime)
      if (++relcnt >= 3) {
        relcnt = 0
        for (let i = this.notetab.length - 1; i >= 0; --i) {
          const nt = this.notetab[i]
          if (this.actx.currentTime > nt.e) {
            this._pruneNote(nt)
            this.notetab.splice(i, 1)
          }
        }
      }
    }, 60)
  }

  get currentTime() {
    return this.actx.currentTime
  }

  release() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

  async recording(duration: number = 0) {
    return this.webAudioRecorder.init(this.actx).then((node) => {
      this.webAudioRecorder.startRecord({
        audioContext: this.actx,
        bufferDetectorNode: node,
      })
      this.webAudioRecorder.stopRecord({
        audioContext: this.actx,
        bufferDetectorNode: node,
        duration: duration + 1,
        finishCallback: () => {
          this.comp.connect(this.dest)
        },
      })

      this.comp.connect(node)
      node.connect(this.dest)
    })
  }

  get instrumentNames() {
    return this.generalMIDI?.instruments.map((i) => i.name) || []
  }
  get drumNames() {
    return this.generalMIDI?.drummaps.map((d) => d.name) || []
  }

  public setInstrument(ch: number, name: string) {
    this.selectedInstruments[ch] = this.generalMIDI.instruments.findIndex(
      (i) => i.name === name,
    )
  }
  public getDrummapIdx(name: string) {
    return this.generalMIDI.drummaps.findIndex((i) => i.name === name) + 35
  }

  /**
   * play note
   * @param ch MIDI channel 0-15
   * @param n note
   * @param v volume
   */
  public noteOn({
    ch,
    n,
    t,
    dt,
    v = 100,
  }: {
    ch: number
    n: number
    t: number
    dt: number
    v?: number
  }) {
    const time = this.actx.currentTime + t
    // play drum channel
    if (this.selectedDrummaps[ch]) {
      if (n >= 35 && n <= 81) {
        this._note(time, dt, ch, n, v, this.generalMIDI.drummaps[n - 35].p)
      }
      return
    }
    this._note(
      time,
      dt,
      ch,
      n,
      v,
      this.generalMIDI.instruments[this.selectedInstruments[ch]].p,
    )
  }

  private _note(
    t: number,
    dt: number,
    ch: number,
    n: number,
    v: number,
    p: Wave[],
  ) {
    const fp: number[] = []
    const o: (AudioBufferSourceNode | OscillatorNode)[] = []
    const g: GainNode[] = []
    const vp: number[] = []
    const r: number[] = []
    const f: number = 440 * Math.pow(2, (n - 69) / 12)
    for (let i = 0; i < p.length; ++i) {
      const pn: Wave = p[i]
      let sc: number = 0
      let out: GainNode | AudioParam = null
      const dt = t + pn.a + pn.h
      if (pn.g == 0) {
        out = this.chvol[ch]
        sc = (v * v) / 16384
        fp[i] = f * pn.t + pn.f
      } else if (pn.g > 10) {
        out = g[pn.g - 11].gain
        sc = 1
        fp[i] = fp[pn.g - 11] * pn.t + pn.f
      } else if ((o[pn.g - 1] as OscillatorNode).frequency) {
        out = (o[pn.g - 1] as OscillatorNode).frequency
        sc = fp[pn.g - 1]
        fp[i] = fp[pn.g - 1] * pn.t + pn.f
      } else {
        out = (o[pn.g - 1] as AudioBufferSourceNode).playbackRate
        sc = fp[pn.g - 1] / 440
        fp[i] = fp[pn.g - 1] * pn.t + pn.f
      }
      switch (pn.w[0]) {
        case 'n': {
          const src = this.actx.createBufferSource()
          src.buffer = this.generalMIDI.noiseBuf[pn.w]
          src.loop = true
          src.playbackRate.value = fp[i] / 440
          if (pn.p != 1)
            this._setParamTarget(
              src.playbackRate,
              (fp[i] / 440) * pn.p,
              t,
              pn.q,
            )
          if (src.detune) {
            // chmod -> buffer source
            this.chmod[ch].connect(src.detune)
            src.detune.value = 0
          }
          // set buffer source
          o[i] = src
          break
        }
        default: {
          const osc = this.actx.createOscillator()
          osc.frequency.value = fp[i]
          if (pn.p !== 1) {
            this._setParamTarget(osc.frequency, fp[i] * pn.p, t, pn.q)
          }
          if (pn.w === 'w9999') {
            osc.setPeriodicWave(this.generalMIDI.wave[pn.w])
          } else if (!['w9999', 'n0', 'n1'].some((t) => t === pn.w)) {
            osc.type = pn.w as OscillatorType
          }
          if (osc.detune) {
            // chmod -> oscillator
            this.chmod[ch].connect(osc.detune)
            osc.detune.value = 0
          }
          // set oscililator
          o[i] = osc
          break
        }
      }
      //  o[i] -> gain -> out
      g[i] = this.actx.createGain()
      r[i] = pn.r
      o[i].connect(g[i])
      g[i].connect(out as AudioNode)
      vp[i] = sc * pn.v
      if (pn.k) {
        vp[i] *= Math.pow(2, ((n - 60) / 12) * pn.k)
      }
      if (pn.a) {
        g[i].gain.value = 0
        g[i].gain.setValueAtTime(0, t)
        g[i].gain.linearRampToValueAtTime(vp[i], t + pn.a)
      } else {
        g[i].gain.setValueAtTime(vp[i], t)
      }
      this._setParamTarget(g[i].gain, pn.s * vp[i], dt, pn.d)
      o[i].start(t)
      if (this.selectedDrummaps[ch]) {
        o[i].onended = () => {
          try {
            if (o[i].detune) this.chmod[ch].disconnect(o[i].detune)
          } catch (e) {
            // nothing
          }
        }
        o[i].stop(t + p[0].d * this.releaseRatio)
      }
    }
    if (!this.selectedDrummaps[ch]) {
      this.notetab.push({
        e: t + dt + 1,
        ch,
        o,
        g,
      })
    }
  }

  private _setParamTarget(p: AudioParam, v: number, t: number, d: number) {
    if (d !== 0) p.setTargetAtTime(v, t, d)
    else p.setValueAtTime(v, t)
  }

  private _pruneNote(nt: {
    o: (AudioBufferSourceNode | OscillatorNode)[]
    g: GainNode[]
    ch: number
  }) {
    for (let k = nt.o.length - 1; k >= 0; --k) {
      if ((nt.o[k] as OscillatorNode).frequency) {
        ;(nt.o[k] as OscillatorNode).frequency.cancelScheduledValues(0)
      } else {
        ;(nt.o[k] as AudioBufferSourceNode).playbackRate.cancelScheduledValues(
          0,
        )
      }
      nt.g[k].gain.cancelScheduledValues(0)

      nt.o[k].stop()
      if (nt.o[k].detune) {
        try {
          this.chmod[nt.ch].disconnect(nt.o[k].detune)
        } catch (e) {
          // nothing
        }
      }
      nt.g[k].gain.value = 0
    }
  }

  public allSoundOff(ch) {
    for (let i = this.notetab.length - 1; i >= 0; --i) {
      const nt = this.notetab[i]
      if (nt.ch == ch) {
        this._pruneNote(nt)
        this.notetab.splice(i, 1)
      }
    }
  }
}
