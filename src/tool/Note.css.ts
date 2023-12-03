import { style } from '@vanilla-extract/css'

export const cellSize = 20

export const classes = {
  note: style({
    background: 'lime',
    border: 'thin solid black',
    resize: 'horizontal',
    cursor: 'all-scroll',
  }),
}
