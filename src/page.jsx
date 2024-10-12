import "./styles/page.css"

const Page = ({ minimized, ...props }) => {
    return(
    <div className={minimized ? "page-wrapper-minimized" : "page-wrapper"}>
      <div className="page" {...props} />
    </div>
    )
}

const PageTitle = ({ name, minimized, setMinimized, ...props }) => {
    return(
    <div className="page-title">
      <button onClick={() => setMinimized(!minimized)}>
        <span className="page-hamburger material-symbols-outlined">menu</span>
      </button>
      <div className="page-title-text">{name}</div>
      <div {...props}/>
    </div>
    )
}

export { Page, PageTitle }