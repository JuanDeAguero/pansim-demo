import "./styles/new_simulation.css"
import { ChangePage } from "./simulations"
import { get } from "./requests"
import { Page } from "./page"
import { PageTitle } from "./page"
import { post } from "./requests"
import { PulseLoader } from "react-spinners"
import { useAuth } from "./auth"
import { useCallback } from "react"
import { useEffect } from "react"
import { useRef } from "react"
import { useState } from "react"
import JSZip from "jszip"

const Button = ({ onClick, loading, extraStyle, children }) => {
    return(
    <button className={"custom-button " + extraStyle} onClick={onClick}>
      {loading ? <PulseLoader className="custom-button-loader" color="white" /> : children}
    </button>
    )
}

const NewSimulation = ({ minimized, setMinimized }) => {

    const [scenarioName, setScenarioName] = useState("")
    const [rootFile, setRootFile] = useState(null)
    const [zipFile, setZipFile] = useState(null)

    const scenarioNameRef = useRef(null)
    const rootFileInputRef = useRef(null)
    const zipFileInputRef = useRef(null)
    const simulationNameRef = useRef(null)
    const numSimulationsRef = useRef(null)

    const [configurations, setConfigurations] = useState([])
    const [configuration, setConfiguration] = useState({ id: 0, scenario_name: "" })
    const [showConfigurations, setShowConfigurations] = useState(false)
    const [simulationName, setSimulationName] = useState("")
    const [numSimulations, setNumSimulations] = useState("")

    const [createConfigLoading, setCreateConfigLoading] = useState(null)
    const [createSimLoading, setCreateSimLoading] = useState(null)

    const { authToken } = useAuth()

    const handleRootFileUpload = (event) => {
        const file = event.target.files[0]
        if (file) setRootFile(file)
        else setRootFile(null)
        event.target.value = null
    }

    const handleZipFileUpload = (event) => {
        const file = event.target.files[0]
        if (file) {
            setZipFile(file)
            const zip = new JSZip()
            zip.loadAsync(file).then((zip) => {
                setNumFilesInZip(Object.keys(zip.files).length)
                //setNumFilesInZip(Math.floor(Object.keys(zip.files).length / 2))
            }).catch((error) => {
                console.error("Error reading zip file:", error)
            })
        } else setZipFile(null)
        event.target.value = null
    }

    const [numFilesInZip, setNumFilesInZip] = useState(0)
    const [numFilesProcessed, setNumFilesProcessed] = useState(0)

    const onCreateConfigClick = () => {
        setNumFilesProcessed(0)
        setConfigSuccess(false)
        setConfigError(false)
        if (createConfigLoading) return;
        setCreateConfigLoading(true)
        const formData = new FormData()
        formData.append("scenario_name", scenarioName)
        formData.append("number_of_simulations", 1)
        formData.append("root_file", rootFile)
        formData.append("files_zip", zipFile)
        formData.append("files", rootFile)
        post("job-config/", authToken, formData).then((response) => {
            updateConfigs()
            setScenarioName("")
            scenarioNameRef.current.value = ""
            setRootFile(null)
            setZipFile(null)
            setConfigSuccess(true)
            setConfigError(false)
            setCreateConfigLoading(false)
            setNumFilesProcessed(0)
        }).catch((error) => {
            setConfigError(true)
            setConfigSuccess(false)
            setCreateConfigLoading(false)
            setNumFilesProcessed(0)
        })
    }

    const onSelectConfigClick = () => {
        if (showConfigurations) setShowConfigurations(false)
        else setShowConfigurations(true)
    }

    const onConfigClick = (id, name) => {
        setConfiguration({ id: id, scenario_name: name })
        setShowConfigurations(false)
    }

    const [currentConfigPage, setCurrentConfigPage] = useState(1)
    const [totalConfigs, setTotalConfigs] = useState(0)
    const [configsLoading, setConfigsLoading] = useState(true)

    const updateConfigs = useCallback(() => {
        setConfigsLoading(true)
        setConfigurations([])
        const params = { "page": currentConfigPage }
        get("job-config/", authToken, params).then((data) => {
            setTotalConfigs(data.count)
            setConfigurations(data.results)
            setConfigsLoading(false)
        })
    }, [authToken, currentConfigPage])

    useEffect(() => {
        updateConfigs()
    }, [currentConfigPage])

    useEffect(() => {
        let intervalId
        if (createConfigLoading) {
            intervalId = setInterval(() => {
                get("job-config/", authToken).then((data) => {
                    setNumFilesProcessed(data.results[data.results.length - 1].files.length)
                })
            }, 1000)
        }
        return () => {
            clearInterval(intervalId)
        }
    }, [createConfigLoading])

    const onCreateSimClick = () => {
        setSimulationSuccess(false)
        setSimulationError(false)
        if (createSimLoading) return
        setCreateSimLoading(true)
        const formData = new FormData()
        formData.append("job_configuration", configuration.id)
        formData.append("name", simulationName)
        formData.append("number_of_simulations", numSimulations)
        post("job/", authToken, formData).then((response) => {
            setConfiguration({ id: 0, scenario_name: "" })
            setShowConfigurations(false)
            setSimulationName("")
            simulationNameRef.current.value = ""
            setNumSimulations("")
            numSimulationsRef.current.value = ""
            setSimulationSuccess(true)
            setSimulationError(false)
            setCreateSimLoading(false)
        }).catch((error) => {
            setSimulationSuccess(false)
            setSimulationError(true)
            setCreateSimLoading(false)
        })
    }

    const [configSuccess, setConfigSuccess] = useState(false)
    const [configError, setConfigError] = useState(false)
    const [simulationSuccess, setSimulationSuccess] = useState(false)
    const [simulationError, setSimulationError] = useState(false)

    return(
    <Page minimized={minimized}>
      <PageTitle name={"New Simulation"} minimized={minimized} setMinimized={setMinimized} />
      <div className="new-sim-create-config">
        <div className="new-sim-create-config-title">Create Configuration</div>
        <div className="new-sim-divider" />
        <div className="new-sim-param">
          <div>Scenario name</div>
          <input className="new-sim-input-text" ref={scenarioNameRef} placeholder="Name"
            onChange={(event) => setScenarioName(event.target.value)} />
        </div>
        <div className="new-sim-divider" />
        <div className="new-sim-param">
          <div>
            <div>Root configuration file</div>
            <div className="new-sim-file-text">{rootFile && rootFile.name}</div>
          </div>
          <input type="file" ref={rootFileInputRef} onChange={handleRootFileUpload}
            style={{ display: "none" }} />
          <button className="new-sim-upload-button"
            onClick={() => rootFileInputRef.current.click()}>
              <span className="new-sim-upload-icon material-symbols-outlined">upload_file</span>
              <div className="new-sim-upload-text">Upload</div>
          </button>
        </div>
        <div className="new-sim-divider" />
        <div className="new-sim-param">
          <div>
            <div>Batch parameter files upload</div>
            <div className="new-sim-file-text">{zipFile && zipFile.name}</div>
          </div>
          <input type="file" ref={zipFileInputRef} onChange={handleZipFileUpload}
            style={{ display: "none" }} />
          <button className="new-sim-upload-button"
            onClick={() => zipFileInputRef.current.click()}>
            <span className="new-sim-upload-icon material-symbols-outlined">upload</span>
            <div className="new-sim-upload-text">Upload</div>
          </button>
        </div>
        <div className="new-sim-divider" />
        <div className="new-sim-create-button-wrapper">
          <Button onClick={onCreateConfigClick} loading={createConfigLoading}>
            <div>CREATE</div>
          </Button>
        </div>
        {createConfigLoading && <div>
          <div className="new-sim-loading">
            <div className="new-sim-loading-progress" style={{ width: `${numFilesInZip !== 0 ? (numFilesProcessed / numFilesInZip) * 100 : 0}%` }} />
          </div>
          <div className="new-sim-loading-numbers">{numFilesProcessed}/{numFilesInZip}</div>
        </div>}
        {configSuccess && <div className="success-message">Configuration created successfully</div>}
        {configError && <div className="error-message">Error creating configuration</div>}
      </div>
      <div className="new-sim-create">
        <div className="new-sim-create-title">Create Simulation</div>
        <div className="new-sim-select-config-wrapper">
          <button className="new-sim-select-config" onClick={onSelectConfigClick}>
            <div className="new-sim-select-config-text">{configuration.scenario_name !== "" ?
              configuration.scenario_name : "Select Configuration"}</div>
            <span className="new-sim-select-config-icon material-symbols-outlined">
              {showConfigurations ? "expand_less" : "expand_more"}
            </span>
          </button>
          <ChangePage currentPage={currentConfigPage} setCurrentPage={setCurrentConfigPage}
            totalPages={Math.ceil(totalConfigs / 5)} loading={configsLoading} />
        </div>
        {configurations.length > 0 && showConfigurations && <div className="new-sim-configs">
          {configurations.map((config) => (
            <button key={config.id} onClick={() => onConfigClick(config.id, config.scenario_name)}>
              {config.scenario_name}
            </button>
          ))}
        </div>}
        <div className="new-sim-divider new-sim-divider-name" />
        <div className="new-sim-param">
          <div>Name</div>
          <input className="new-sim-input-text" ref={simulationNameRef} placeholder="Name"
            onChange={(event) => setSimulationName(event.target.value)} />
        </div>
        <div className="new-sim-divider" />
        <div className="new-sim-param">
          <div>Number of simulations</div>
          <input className="new-sim-create-input-number" ref={numSimulationsRef} placeholder="0"
            type="number" min={0} onChange={(event) => setNumSimulations(event.target.value)} />
        </div>
        <div className="new-sim-divider" />
        <div className="new-sim-create-button-wrapper">
          <Button text={"CREATE"} onClick={onCreateSimClick} loading={createSimLoading}>
            <div>CREATE</div>
          </Button>
        </div>
        {simulationSuccess && <div className="success-message">Simulation created successfully</div>}
        {simulationError && <div className="error-message">Error creating simulation</div>}
      </div>
    </Page>
    )
}

export { NewSimulation, Button }