import { style } from '@vanilla-extract/css'

export const classes = {
  root: style({
    padding: 20,
    color: 'white',
    '@media': {
      'screen and (max-width: 768px)': {
        color: 'grey',
      },
    },
  }),
  h1: style({
    margin: '0 0 20px 0',
  }),
}
