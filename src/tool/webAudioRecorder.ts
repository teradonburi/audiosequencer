declare global {
  interface AudioParamDescriptor {
    name: string
    defaultValue: number
    minValue: number
    maxValue: number
  }
  class AudioWorkletProcessor extends AudioWorkletNode {
    static get parameterDescriptors(): AudioParamDescriptor[]
    process(
      inputs: Float32Array[][],
      outputs: Float32Array[][],
      parameters: Record<string, Float32Array>,
    ): boolean
  }
}

function createAudioWorklet() {
  let audioBuffer = null
  return class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: 'isRecording',
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
        },
      ]
    }

    convertToFloat32ToInt16(inputs: Float32Array[][]) {
      const inputChannelData = inputs[0][0]

      const data = Int16Array.from(inputChannelData, (n) => {
        const res = n < 0 ? n * 32768 : n * 32767 // convert in range [-32768, 32767]
        return Math.max(-32768, Math.min(32767, res)) // clamp
      })

      audioBuffer = Int16Array.from([...(audioBuffer || []), ...data])
      // efficiency sending data when stack buffering data
      if (audioBuffer.length >= 3200) {
        this.port.postMessage({
          eventType: 'data',
          audioBuffer: audioBuffer,
        })
        audioBuffer = null
      }
    }

    process(
      inputs: Float32Array[][],
      _: Float32Array[][],
      parameters: Record<string, Float32Array>,
    ) {
      if (parameters.isRecording[0] === 1) {
        if (inputs[0].length === 0) {
          console.warn('From Convert Bits Worklet, input is null')
          return false
        }
        this.convertToFloat32ToInt16(inputs)
      }

      return true
    }
  }
}

export class WebAudioRecorder {
  private audioData: Float32Array[] = []

  init(audioContext: AudioContext) {
    const processorName = 'buffer-detector'
    const url = window.URL.createObjectURL(
      new Blob(
        [
          `
          registerProcessor(
            '${processorName}',
            (${createAudioWorklet.toString()})()
          )
`,
        ],
        {
          type: 'text/javascript',
        },
      ),
    )

    // Register the worklet.
    return audioContext.audioWorklet.addModule(url).then(() => {
      // Create our custom node.
      const bufferDetectorNode: AudioWorkletNode = new AudioWorkletNode(
        audioContext,
        processorName,
      )

      bufferDetectorNode.port.addEventListener('message', (event) => {
        if (event.data.eventType === 'data') {
          this.audioData.push(event.data.audioBuffer)
        }
      })

      return bufferDetectorNode
    })
  }

  startRecord({
    audioContext,
    bufferDetectorNode,
  }: {
    audioContext: AudioContext
    bufferDetectorNode: AudioWorkletNode
  }) {
    // start recording
    bufferDetectorNode.port.start()
    const parameter = bufferDetectorNode.parameters.get('isRecording')
    parameter.setValueAtTime(1, audioContext.currentTime)
  }

  stopRecord({
    audioContext,
    bufferDetectorNode,
    duration,
    finishCallback,
  }: {
    audioContext: AudioContext
    bufferDetectorNode: AudioWorkletNode
    duration: number
    finishCallback?: () => void
  }) {
    // finish recording after t seconds
    setTimeout(() => {
      // stop recording
      bufferDetectorNode.port.close()
      const parameter = bufferDetectorNode.parameters.get('isRecording')
      parameter.setValueAtTime(0, audioContext.currentTime)
      this.saveAudio(audioContext)
      finishCallback?.()
    }, duration * 1000)
  }

  // export WAV from audio float data
  exportWAV(audioContext: AudioContext) {
    const wavRawData = [this.getWAVHeader(audioContext), ...this.audioData]
    const blob = new Blob(wavRawData, { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    return url
  }

  private getWAVHeader(audioContext: AudioContext) {
    const BYTES_PER_SAMPLE = Int16Array.BYTES_PER_ELEMENT
    const channel = 1
    const sampleRate = audioContext.sampleRate

    const dataLength = this.audioData.reduce(
      (acc, cur) => acc + cur.byteLength,
      0,
    )

    function writeString(dataView: DataView, offset: number, string: string) {
      for (let i = 0; i < string.length; i++) {
        dataView.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    const header = new ArrayBuffer(44)
    const view = new DataView(header)
    writeString(view, 0, 'RIFF') // RIFF identifier 'RIFF'
    view.setUint32(4, 36 + dataLength, true) // file length minus RIFF identifier length and file description length
    writeString(view, 8, 'WAVE') // RIFF type 'WAVE'
    writeString(view, 12, 'fmt ') // format chunk identifier 'fmt '
    view.setUint32(16, 16, true) // format chunk length
    view.setUint16(20, 1, true) // sample format (raw)
    view.setUint16(22, channel, true) // channel count
    view.setUint32(24, sampleRate, true) // sample rate
    view.setUint32(28, sampleRate * BYTES_PER_SAMPLE * channel, true) // byte rate (sample rate * block align)
    view.setUint16(32, BYTES_PER_SAMPLE * channel, true) // block align (channel count * bytes per sample)
    view.setUint16(34, 8 * BYTES_PER_SAMPLE, true) // bits per sample
    writeString(view, 36, 'data') // data chunk identifier 'data'
    view.setUint32(40, dataLength, true) // data chunk length

    return header
  }

  saveAudio(audioContext: AudioContext) {
    const downloadLink = document.createElement('a')
    downloadLink.href = this.exportWAV(audioContext)
    downloadLink.download = 'test.wav'
    downloadLink.click()
  }
}
