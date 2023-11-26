import { SVG, Svg } from '@svgdotjs/svg.js'
import '@svgdotjs/svg.draggable.js'

export class SVGFactory {
  private draw: Svg = null
  private previewUrl: string = null
  private preview: HTMLImageElement = null

  constructor({
    selector,
    w,
    h,
    style,
  }: {
    selector: string
    w: number
    h: number
    style?: Partial<CSSStyleDeclaration>
  }) {
    this.draw = SVG().addTo(selector).size(w, h).viewbox(0, 0, w, h)
    this.draw.css(style)
  }

  createCircle({ r, draggable = true }: { r: number; draggable?: boolean }) {
    const circle = this.draw.circle(r, 100)
    if (draggable) {
      circle.draggable()
    }
    return circle
  }

  createRect({
    w,
    h,
    draggable = true,
  }: {
    w: number
    h: number
    draggable?: boolean
  }) {
    const rect = this.draw.rect(w, h)
    if (draggable) {
      rect.draggable()
    }
    return rect
  }

  createImage(selector) {
    const svg = this.draw.svg()
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    this.previewUrl = URL.createObjectURL(blob)

    this.preview = document.createElement('img')
    this.preview.src = this.previewUrl
    document.querySelector(selector).appendChild(this.preview)
  }

  download() {
    const downloadLink = document.createElement('a')
    downloadLink.href = this.previewUrl
    downloadLink.download = 'image.svg'
    downloadLink.click()
    // 高速化のため、ブラウザの一時URLを解放する（右クリックDLはできなくなる）
    this.preview.addEventListener(
      'load',
      () => URL.revokeObjectURL(this.previewUrl),
      {
        once: true,
      },
    )
  }
}
