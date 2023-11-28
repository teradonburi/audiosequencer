import { style } from '@vanilla-extract/css'

export const cellSize = 20

export const classes = {
  instrumentRoot: style({
    background: 'white',
    color: 'black',
    padding: 10,
  }),
  drumRoot: style({
    background: 'white',
    color: 'black',
    padding: 10,
    display: 'flex',
  }),
  selectName: style({
    marginBottom: 20,
  }),
  name: style({
    fontSize: 12,
    height: cellSize,
    paddingRight: 10,
  }),
  container: style({
    height: cellSize * 12,
    position: 'relative',
  }),
  emptyNote: style({
    width: 19,
    height: 19,
    position: 'absolute',
    border: '0.5px solid black',
    '::before': {
      position: 'absolute',
      content: '',
      border: '0.5px solid black',
      width: '100%',
      height: '100%',
    },
    ':hover': {
      background: 'aqua !important',
    },
  }),
  note: style({
    position: 'absolute',
    background: 'lime',
    cursor: 'pointer',
    border: 'thin solid black',
  }),
}
