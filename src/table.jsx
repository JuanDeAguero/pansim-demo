import "./styles/table.css"
import { Children } from "react"
import { cloneElement } from "react"
import { createContext } from "react"
import { useContext } from "react"
import { useMemo } from "react"

const TableContext = createContext()

const Table = ({ columns, children }) => {
    
    const columnWidth = useMemo(() => `${100 / columns.length}%`, [columns.length])
    const columnStyles = useMemo(() => columns.map((column) =>
        ({ width: column.width || columnWidth })), [columns, columnWidth])

    return (
    <TableContext.Provider value={{ columnStyles }}>
      <div className="table-columns">
        {columns.map((column, index) => (
          <div key={index} className="table-column" style={{ width: column.width || columnWidth }}>
            {column.name}
          </div>
        ))}
      </div>
      {children}
    </TableContext.Provider>
    )
}

const TableRow = ({ children, hideDivider }) => {

    const { columnStyles } = useContext(TableContext)
    const childrenWithProps = Children.map(children, (child, index) =>
        cloneElement(child, { columnIndex: index, style: columnStyles[index] }))

    return (
    <>
      {!hideDivider && <div className="table-divider" />}
      <div className="table-elements">{childrenWithProps}</div>
    </>
    )
}

const TableElement = ({ children, style }) => {
    return (
    <div className="table-element" style={style}>
      {children}
    </div>
    )
}

export { Table, TableRow, TableElement }