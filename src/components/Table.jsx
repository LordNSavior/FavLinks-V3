import React from 'react'
import { Button } from './ui'

const TableHeader = (props) => {
  // boilerplate table header functional component
  return (
    <thead>
      <tr>
        <th className="px-4 py-2 text-left text-slate-400">Name</th>
        <th className="px-4 py-2 text-left text-slate-400">URL</th>
        {props.showSharedBy && <th className="px-4 py-2 text-left text-slate-400">Shared By</th>}
        {props.showRemove !== false && <th className="px-4 py-2 text-left text-slate-400">Remove</th>}
      </tr>
    </thead>
  )
}

const TableBody = (props) => {
  // boilerplate table body functional component
  // we use Array.map to create table rows from LinkData passed via props
  const rows = props.linkData.map((row) => {
    return (
      <tr key={row.id}>
        <td className="px-4 py-3 align-top text-slate-100">{row.name}</td>
        <td className="px-4 py-3 align-top"><a className="text-indigo-300 hover:text-indigo-200" href={row.url} target="_blank" rel="noopener noreferrer">{row.url}</a></td>
        {props.showSharedBy ? <td className="px-4 py-3 align-top text-slate-300">{row.shared_by || '—'}</td> : null}
        <td className="px-4 py-3 align-top">{props.removeLink ? <Button variant="danger" onClick={() => props.removeLink(row.id)}>Delete</Button> : null}</td>
      </tr>
    )
  })

  return <tbody>{rows}</tbody>
}




const Table = (props) => {
  const showSharedBy = props.data && props.data.length > 0 && Object.prototype.hasOwnProperty.call(props.data[0], 'shared_by')
  return(
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-700">
        <TableHeader showRemove={props.showRemove} showSharedBy={showSharedBy} />
        <TableBody linkData={props.data} removeLink={props.removeLink} showSharedBy={showSharedBy} />
      </table>
    </div>
  )
}

export default Table