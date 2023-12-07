import React from 'react'
import {
  Menu,
  Item,
  useContextMenu,
  ItemParams,
  Separator,
} from 'react-contexify'
import 'react-contexify/ReactContexify.css'
import { ResizableBox } from 'react-resizable'
import 'react-resizable/css/styles.css'
import { cellSize, classes } from './Note.css'
import clsx from 'clsx'

export interface Props {
  id: string
  idx: number
  channel: number
  name: string
  note: { n: number; d: number; tt: number }
  deleteNote: ({
    channel,
    noteIndex,
  }: {
    channel: number
    noteIndex: number
  }) => void
  updateNote: ({
    channel,
    note,
    noteIndex,
  }: {
    channel: number
    note: { n: number; d: number; tt: number }
    noteIndex: number
  }) => void
  style?: React.CSSProperties
}

const Note = React.forwardRef<ResizableBox, Props>((props, ref) => {
  const { id, idx, channel, note, deleteNote, updateNote, style } = props
  const [selected, setSelected] = React.useState(false)

  const menuId = `${id}-menu`
  const { show } = useContextMenu({
    id: menuId,
  })
  function handleContextMenu(
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    channel: number,
    note: Props['note'],
    noteIndex: number,
  ) {
    e.preventDefault()
    show({
      event: e,
      props: {
        channel,
        note,
        noteIndex,
      },
    })
  }
  const handleItemClick = (params: ItemParams) => {
    const { id, props } = params
    switch (id) {
      case 'delete':
        deleteNote({ channel: props.channel, noteIndex: props.noteIndex })
        break
      case 'whole':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 16,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'half':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 8,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'quater':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 4,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'eighth':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 2,
          },
          noteIndex: props.noteIndex,
        })
        break
      case 'sixteenth':
        updateNote({
          channel: props.channel,
          note: {
            ...props.note,
            d: 1,
          },
          noteIndex: props.noteIndex,
        })
        break
    }
  }

  const onResize = (_, { node, size }) => {
    const noteIndex = parseInt(node.parentNode.getAttribute('data-id'), 10)
    const d = Math.round(size.width / cellSize)
    if (d !== note.d) {
      updateNote({
        channel: props.channel,
        note: {
          ...note,
          d,
        },
        noteIndex,
      })
    }
  }

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if ((e.ctrlKey && !e.metaKey) || (!e.ctrlKey && e.metaKey)) {
      setSelected(!selected)
    }
  }

  return (
    <>
      <ResizableBox
        ref={ref}
        id={id}
        data-selected={selected}
        data-channel={channel}
        data-id={idx}
        data-n={note.n}
        data-tt={note.tt}
        width={note.d * cellSize - 2}
        height={cellSize - 2}
        onResizeStart={(e) => e.stopPropagation()}
        onResizeStop={onResize}
        axis="x"
        resizeHandles={['e']}
        draggableOpts={{ grid: [cellSize, cellSize - 2] }}
        minConstraints={[cellSize, cellSize - 2]}
        maxConstraints={[cellSize * 16, cellSize - 2]}
        style={{
          ...style,
          border: selected ? 'thin solid red' : 'thin solid black',
        }}
        className={clsx('note', classes.note)}
        onContextMenu={(e) => handleContextMenu(e, channel, note, idx)}
        onClick={onClick}
      />
      <Menu id={menuId}>
        <Item id="delete" onClick={handleItemClick}>
          Delete
        </Item>
        <Separator />
        <Item id="whole" onClick={handleItemClick}>
          whole
        </Item>
        <Item id="half" onClick={handleItemClick}>
          half
        </Item>
        <Item id="quater" onClick={handleItemClick}>
          quater
        </Item>
        <Item id="eighth" onClick={handleItemClick}>
          eighth
        </Item>
        <Item id="sixteenth" onClick={handleItemClick}>
          sixteenth
        </Item>
      </Menu>
    </>
  )
})

export default Note
