import "./styles/configuration.css"
import { Button } from "./new_simulation"
import { del } from "./requests"
import { get } from "./requests"
import { LoadingRow } from "./dashboard"
import { Page } from "./page"
import { PageTitle } from "./page"
import { post } from "./requests"
import { Table } from "./table"
import { TableElement } from "./table"
import { TableRow } from "./table"
import { update } from "./requests"
import { useAuth } from "./auth"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import { useRef } from "react"
import { useState } from "react"

const File = ({ file, config, configEditMode, onDelete }) => {

    const onOpenClick = () => {
        if (!file) return
        window.open(file.file, "_blank", "noopener,noreferrer")
    }

    return(
    <TableRow>
      <TableElement>
        <div className="config-file-name">{file && file.name}</div>
      </TableElement>
      <TableElement>
        <div className="config-file-name">{file && file.created_at && file.created_at.slice(0, 10)}</div>
      </TableElement>
      <TableElement>
        <div className="configs-config-action">
          <button className="configs-config-action-button" onClick={onOpenClick}>
            <span className="configs-config-icon material-symbols-outlined">open_in_new</span>
          </button>
          {(configEditMode && config && file.id !== config.root_file.id) &&
            <button className="configs-config-action-button configs-config-delete"
              onClick={() => onDelete(file)}>
                <span className="configs-config-icon material-symbols-outlined">delete</span>
            </button>}
        </div>
      </TableElement>
    </TableRow>
    )
}

const Upload = ({ onClick }) => {
    return(
    <button className="config-upload" onClick={onClick}>
        <div className="config-upload-text">Upload</div>
        <span className="material-symbols-outlined">upload</span>
    </button>
    )
}

const Configuration = ({ configEditMode, setConfigEditMode, minimized, setMinimized }) => {

    const { id } = useParams()

    const [config, setConfig] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saveLoading, setSaveLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [rootFile, setRootFile] = useState(null)
    const [files, setFiles] = useState([])
    const [newRootFile, setNewRootFile] = useState(null)
    const [filesToDelete, setFilesToDelete] = useState([])
    const [filesToUpload, setFilesToUpload] = useState([])

    const rootFileInputRef = useRef(null)
    const fileInputRef = useRef(null)

    const nameRef = useRef(null)
    const descriptionRef = useRef(null)

    const { authToken } = useAuth()

    const [description, setDescription] = useState("")

    const fetchConfig = () => {
        searchRef.current.value = ""
        setLoading(true)
        setConfig(null)
        get("job-config/" + id, authToken).then((config) => {
            setConfig(config)
            setRootFile(config.root_file)
            setFiles(config.files)
            setDescription(config.description || "")
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchConfig()
    }, [id, authToken])

    useEffect(() => {
        if (!config || !nameRef || !nameRef.current || !descriptionRef || !descriptionRef.current) return
        nameRef.current.value = config.scenario_name
        if (config.description) {
            descriptionRef.current.value = config.description
            setDescription(config.description)
        }
    }, [config, configEditMode])

    const onEditClick = () => {
        setConfigEditMode(true)
        fetchConfig()
    }

    const navigate = useNavigate()

    const onDeleteClick = () => {
        setDeleting(true)
        del(`job-config/${id}`, authToken).then(() => {
            setDeleting(false)
            navigate("/configurations")
        }).catch(() => {
            setDeleting(false)
        })
    }

    const showErrorSaving = () => {
        alert("Error saving.")
        setSaveLoading(false)
    }

    const onSaveClick = () => {
        if (!rootFile) {
            alert("You have to upload a root file.")
            return
        }
        setSaveLoading(true)
        const formData = new FormData()
        formData.append("scenario_name", nameRef.current.value)
        formData.append("description", descriptionRef.current.value)
        update(`job-config/${id}`, authToken, formData).then((response) => {
            const formData = new FormData()
            if (newRootFile) {
                formData.append("root_file", newRootFile.localFile)
            }
            filesToUpload.forEach(file => {
                formData.append("files", file.localFile)
            })
            post(`job-config/${id}/upload`, authToken, formData).then((response) => {
                const deletePromises = filesToDelete.map(file => {
                    del(`job-config/file/${file.id}/delete`, authToken).catch(() => {
                        showErrorSaving(); return
                    })
                })
                Promise.all(deletePromises).then(() => {
                    fetchConfig()
                    setConfigEditMode(false)
                    setSaveLoading(false)
                    searchRef.current.value = ""
                }).catch(() => { showErrorSaving(); return })
            }).catch(() => { showErrorSaving(); return })
        }).catch(() => { showErrorSaving(); return})
    }

    const handleFileDelete = (file) => {
        if (rootFile && file.id === rootFile.id) {
            setRootFile(config.root_file)
            setNewRootFile(null)
        } else {
            setFilesToUpload(filesToUpload.filter(f => f.id !== file.id))
            if (file.file) {
                setFilesToDelete([...filesToDelete, file])
            }
        }
        setFiles(files.filter(f => f.id !== file.id))
    }

    const handleFileUpload = (event, isRootFile) => {
        const file = event.target.files[0]
        if (!file) return
        const fileObject = {
            id: files.reduce((max, f) => Math.max(max, f.id), 0) + 1,
            name: file.name,
            localFile: file
        }
        if (isRootFile) {
            setRootFile(fileObject)
            setNewRootFile(fileObject)
        } else {
            setFilesToUpload([...filesToUpload, fileObject])
        }
        setFiles([...files, fileObject])
        event.target.value = null
    }

    const searchRef = useRef(null)
    const [loadingFiles, setLoadingFiles] = useState(false)

    const fetchFiles = async () => {
        setLoadingFiles(true)
        setFiles([])
        try {
            const config = await get("job-config/" + id, authToken);
            setFiles(config.files)
            setLoadingFiles(false)
            return config.files
        } catch (error) {
            setLoadingFiles(false)
            console.error("Error fetching files:", error)
            return []
        }
    }

    const searchFile = async () => {
        const originalFiles = await fetchFiles()
        const searchTerm = searchRef.current.value.toLowerCase()
        if (searchTerm === "") {
            return
        } else {
            const filteredFiles = originalFiles.filter(file => 
                file.name.toLowerCase().includes(searchTerm)
            )
            setFiles(filteredFiles)
        }
    }

    return(
    <Page minimized={minimized}>
      <PageTitle name={config ? "Configuration " + config.scenario_name : "Configuration"} minimized={minimized} setMinimized={setMinimized}>
        <div className="config-title-props">
          <Button onClick={() => { !configEditMode ? onEditClick() : onSaveClick() }}
            extraStyle={!configEditMode ? "config-edit-button" : ""}
            loading={loading || saveLoading}>
              <div className="config-button">
                <div>{configEditMode ? "SAVE" : "EDIT"}</div>
                <span className="config-edit-icon material-symbols-outlined"
                  style={{ transform: configEditMode ? "scale(100%)" : "" }}>
                    {configEditMode ? "check" : "border_color"}
                </span>
              </div>
          </Button>
          {!loading && <Button onClick={onDeleteClick} extraStyle="config-delete" loading={deleting}>
              <div className="config-button">
                <div>DELETE</div>
                <span className="config-edit-icon material-symbols-outlined">delete</span>
              </div>
          </Button>}
        </div>
      </PageTitle>
      {configEditMode && <div className="config-change-name">
        <div className="config-files-title">Change Name</div>
        <input className="config-name-input" ref={nameRef} placeholder="Name" />
        <div className="config-files-title">Description</div>
        <textarea 
          className="config-description-input" 
          ref={descriptionRef} 
          placeholder="Description" 
        />
      </div>}
      {!configEditMode && <div className="config-description">
        <div className="config-files-title">Description</div>
        <div className="config-description-text">
          {description || ""}
        </div>
      </div>}
      <div className="config-root-file">
        <div className="config-files-title">Root File</div>
        {(configEditMode && !loading) &&
          <Upload onClick={() => rootFileInputRef.current.click()} />}
        <input type="file" ref={rootFileInputRef}
          onChange={(event) => handleFileUpload(event, true)} style={{ display: "none" }} />
        {rootFile && <div className="config-root-file-name-wrapper">
          <div className="config-root-file-name">{rootFile.name}</div>
          {(config && config.root_file.id === rootFile.id) &&
            <button className="configs-config-action-button"
              onClick={() => window.open(config.root_file.file, "_blank", "noopener,noreferrer")}>
                <span className="configs-config-icon material-symbols-outlined">open_in_new</span>
            </button>}
        </div>}
      </div>
      <div className="config-files">
        {(configEditMode && !loading) && <Upload onClick={() => fileInputRef.current.click()} />}
        <input type="file" ref={fileInputRef}
          onChange={(event) => handleFileUpload(event, false)} style={{ display: "none" }} />
        <div className="config-files-title">Files {"(" + files.length + ")"}</div>
        <div className="sims-search config-files-search">
          <input className="sims-search-input" placeholder="Search" ref={searchRef} />
          <button className="sims-search-button" onClick={() => searchFile()}>
            <span className="sims-search-icon material-symbols-outlined">search</span>
          </button>
        </div>
        <div className="config-files-table">
          <Table columns={[
            { name: "NAME", width: configEditMode ? "65%" : "65%" },
            { name: configEditMode ? "DATE CREATED" : "DATE CREATED",
              width: configEditMode ? "19%" : "25%" },
            { name: configEditMode ? "ACTION" : "", width: configEditMode ? "16%" : "10%" }
          ]}>
            {(loading || loadingFiles) ?
              Array.from({ length: 10 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={3} key={index} />
              )) :
              files.map(file => <File file={file} config={config} configEditMode={configEditMode}
                onDelete={handleFileDelete} />)}
          </Table>
        </div>
      </div>
    </Page>
    )
}

export default Configuration