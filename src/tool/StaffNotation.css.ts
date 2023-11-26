import { style } from '@vanilla-extract/css'

export const classes = {
  root: style({
    background: 'white',
    color: 'black',
    padding: 10,
  }),
  container: style({
    height: 280,
    position: 'relative',
    overflowX: 'auto',
  }),
  emptyNote: style({
    marginTop: 20,
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
    height: 20,
    position: 'absolute',
    background: 'lime',
  }),
}
