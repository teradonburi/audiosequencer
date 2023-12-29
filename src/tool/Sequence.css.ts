import { style } from '@vanilla-extract/css'
import { cellSize } from './Note.css'

export const classes = {
  instrumentRoot: style({
    background: 'white',
    display: 'flex',
    color: 'black',
    padding: '20px 10px 10px',
  }),
  drumRoot: style({
    background: 'white',
    color: 'black',
    padding: '20px 10px 10px',
    display: 'flex',
    overflowX: 'auto',
  }),
  instrument: style({
    position: 'sticky',
    left: -10,
    paddingLeft: 10,
    zIndex: 3,
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
    zIndex: 3,
    background: 'white',
  }),
  name: style({
    fontSize: 12,
    height: cellSize,
    paddingRight: 10,
  }),
  container: style({
    height: cellSize * 13,
    position: 'relative',
    width: '100%',
    overflowX: 'auto',
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
  seekContainer: style({
    position: 'relative',
    cursor: 'pointer',
    top: -20,
    zIndex: 2,
    width: '100%',
    height: 20,
  }),
  seek: style({
    position: 'absolute',
    left: 0,
    width: 2,
    background: 'red',
  }),
}
