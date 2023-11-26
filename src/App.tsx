import React from 'react'
import { classes } from './app.css'

function App() {
  const [count, setCount] = React.useState(0)

  return (
    <div className={classes.root}>
      <h1 className={classes.h1}>Vite + React</h1>
      <div>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App
