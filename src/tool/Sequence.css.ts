import { style } from '@vanilla-extract/css'

export const cellSize = 20

export const classes = {
  instrumentRoot: style({
    background: 'white',
    display: 'flex',
    color: 'black',
    padding: 10,
  }),
  drumRoot: style({
    background: 'white',
    color: 'black',
    padding: 10,
    display: 'flex',
    overflowX: 'auto',
  }),
  instrument: style({
    position: 'sticky',
    left: -10,
    paddingLeft: 10,
    zIndex: 2,
    background: 'white',
  }),
  selectName: style({
    margin: '0px 10px 0px 10px',
    width: 110,
    alignSelf: 'baseline',
  }),
  drumset: style({
    position: 'sticky',
    left: -10,
    paddingLeft: 10,
    zIndex: 2,
    background: 'white',
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
    background: 'lime',
    border: 'thin solid black',
    resize: 'horizontal',
    cursor: 'all-scroll',
  }),
}
