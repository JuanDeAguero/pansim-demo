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
    <button className={"custom-button " + extraStyle} onClick={onClick} disabled={loading}>
      {loading ? <PulseLoader className="custom-button-loader" color="white" /> : children}
    </button>
    )
}

const Template = ({ name, selectedTemplate, setSelectedTemplate, setScenarioName, description, setDescription, setNumFilesInZip, setRootFile, setZipFile }) => {

    const onClick = async () => {

        setSelectedTemplate(name)
        setScenarioName(name)

        let rootFilePath = "/templates/NoVaccinationNoSocialDistancing/NL_modelParams_iso8_fk.txt"
        let zipFilePath = "/templates/NoVaccinationNoSocialDistancing/NoVaccinationNoSocialDistancing.zip"
        setNumFilesInZip(39)

        if (name === "No Vaccination No Social Distancing") {
            setDescription("This scenario depicts the absence of both vaccination and social distancing, leading to high transmission rates. Community contacts, household sizes, and public transport usage increase significantly. Hospitals face high occupancy and contact durations rise in all settings, including workplaces. The lack of preventive measures results in slower recoveries and elevated fatalities, exacerbating the spread of infection.")
            setNumFilesInZip(39)
            rootFilePath = "/templates/NoVaccinationNoSocialDistancing/NL_modelParams_iso8_fk.txt"
            zipFilePath = "/templates/NoVaccinationNoSocialDistancing/NoVaccinationNoSocialDistancing.zip"
        } else if (name === "No Vaccination Social Distancing") {
            setDescription("Here, strong social distancing is implemented, with reduced community contacts, smaller household sizes, and limited public transport usage. Contact tracing is active, and isolation measures are enforced. Vaccine coverage is minimal, leading to slower recovery times and higher fatality rates. The emphasis is on controlling transmission through reduced interaction, with lower risk in workplaces and public spaces.")
            setNumFilesInZip(39)
            rootFilePath = "/templates/NoVaccinationSocialDistancing/NL_modelParams_iso8_fk.txt"
            zipFilePath = "/templates/NoVaccinationSocialDistancing/NoVaccinationSocialDistancing.zip"
        } else if (name === "Vaccination No Social Distancing") {
            setDescription("This scenario assumes a highly effective vaccination campaign with 99% vaccine effectiveness and rapid immunity build-up, targeting broad age groups, including active community members. Social distancing measures are removed, leading to increased community contacts, larger household sizes, and higher public transport density. While vaccination reduces fatalities and symptom duration, the lack of distancing raises transmission rates, with increased hospital and workplace interactions reflecting this heightened risk.")
            setNumFilesInZip(39)
            rootFilePath = "/templates/VaccinationNoSocialDistancing/NL_modelParams_iso8_fk.txt"
            zipFilePath = "/templates/VaccinationNoSocialDistancing/VaccinationNoSocialDistancing.zip"
        } else if (name === "Default") {
            setDescription("The Default scenario explores the consequences of removing access to vaccinations entirely by assuming that no individuals seek out or receive vaccines. This scenario aims to establish a baseline for disease progression in the absence of immunization efforts, highlighting the critical role vaccines play in reducing infection rates and controlling the spread of disease within a population.")
            setNumFilesInZip(39)
            rootFilePath = "/templates/NoVaccination/base_root.txt"
            zipFilePath = "/templates/NoVaccination/BaseCase.zip"
        } else if (name === "Lethal Infectious") {
            setDescription("The Lethal Infectious scenario simulates an extreme and catastrophic outcome where the disease is entirely lethal, resulting in all infected individuals passing away. This case provides a stark view of the potential severity of a highly virulent pathogen and underscores the importance of early interventions and strategies to mitigate such outcomes.")
            setNumFilesInZip(39)
            rootFilePath = "/templates/MaximumDeaths/deathRate_root.txt"
            zipFilePath = "/templates/MaximumDeaths/deathRate.zip"
        } else if (name === "No Social Distancing") {
            setDescription("The No Social Distancing scenario examines the effects of removing key public health interventions like social distancing, contact tracing, and isolation measures. By significantly increasing interpersonal interactions and reducing enforced isolation for infected individuals, this scenario illustrates how quickly a disease can spread in the absence of behavioural and policy controls, emphasizing the critical role these measures play in preventing widespread infections.")
            setNumFilesInZip(39)
            rootFilePath = "/templates/NoDistancing/noDistancing_root.txt"
            zipFilePath = "/templates/NoDistancing/noDistancing.zip"
        }

        const rootFileResponse = await fetch(rootFilePath)
        if (!rootFileResponse.ok) throw new Error("Failed to fetch root file")
        const rootFileBlob = await rootFileResponse.blob()
        const rootFileName = rootFilePath.split("/").pop()
        const fetchedRootFile = new File([rootFileBlob], rootFileName)
        console.log(fetchedRootFile)

        const zipFileResponse = await fetch(zipFilePath)
        if (!zipFileResponse.ok) throw new Error("Failed to fetch zip file")
        const zipFileBlob = await zipFileResponse.blob()
        const zipFileName = zipFilePath.split("/").pop()
        const fetchedZipFile = new File([zipFileBlob], zipFileName)
        console.log(fetchedZipFile)

        setRootFile(fetchedRootFile)
        setZipFile(fetchedZipFile)
    }

    return(
    <div className="new-config-template">
      <button className="new-config-template-name"
        style={{ fontWeight: selectedTemplate === name ? "500" : "400" }}
        onClick={() => onClick()}>{name}</button>
      {selectedTemplate === name ? <div className="new-config-template-desc">{description}</div> : null}
    </div>
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
    const [numSimulations, setNumSimulations] = useState(0)
    const [numDays, setNumDays] = useState(0)

    const [createConfigLoading, setCreateConfigLoading] = useState(null)
    const [createSimLoading, setCreateSimLoading] = useState(null)

    const { authToken } = useAuth()

    const [description, setDescription] = useState("")
    const descriptionRef = useRef(null)

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

    const modifyRootFileContent = (content, numDays, scenarioName, description) => {
        const lines = content.split('\n')
        const newLines = []

        newLines.push('% Number of simulations (only used if number of simulations is not specified in command line)')
        newLines.push('1')
        newLines.push('')
        newLines.push('% Number of days in the outbreak')
        newLines.push(String(numDays))
        newLines.push('')
        newLines.push('% Scenario name')
        newLines.push(scenarioName)
        newLines.push('')
        newLines.push('% Scenario description')
        newLines.push('"' + description + '"')
        newLines.push('')
        newLines.push('% Input directory; requires closing slash /data02/morPOP/data/ : /data/')
        newLines.push('./')
        newLines.push('')
        newLines.push('% Output directory (not including scenario name folder); requires closing slash /data02/morPOP/output/vaccines/  /morLAB/morPOP/output/test/')
        newLines.push('output/')
        newLines.push('')
    
        // Now find the line "% File: Vaccine plan info" and copy everything from there on
        let fileInfoFound = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith("% File: Vaccine plan info")) {
                newLines.push(lines[i])
                for (let j = i + 1; j < lines.length; j++) {
                    newLines.push(lines[j])
                }
                fileInfoFound = true
                break
            }
        }

        if (!fileInfoFound) {
            return []
            //throw new Error('The file does not contain "% File: Vaccine plan info" line.')
        }
    
        return newLines.join('\n')
    }     

    const processRootFile = (rootFile, numDays, scenarioName, description) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target.result
                const modifiedContent = modifyRootFileContent(content, numDays, scenarioName, description)
                console.log("Modified Root File Content:\n", modifiedContent)
                const modifiedRootFile = new File([modifiedContent], rootFile.name, { type: rootFile.type })
                resolve(modifiedRootFile)
            }
            reader.onerror = (error) => {
                reject(error)
            }
            reader.readAsText(rootFile)
        })
    }

    const numDaysRef = useRef(null)

    const onCreateConfigClick = () => {
        setNumFilesProcessed(0)
        setConfigSuccess(false)
        setConfigError(false)
        if (createConfigLoading) return;
        setCreateConfigLoading(true)

        const formData = new FormData()

        //if (configMode === "custom") {
            processRootFile(rootFile, numDays, scenarioName, description).then((modifiedRootFile) => {
                formData.append("scenario_name", scenarioName)
                formData.append("description", description)
                formData.append("number_of_simulations", 1)
                formData.append("root_file", modifiedRootFile)
                formData.append("files_zip", zipFile)
                formData.append("files", modifiedRootFile)

                post("job-config/", authToken, formData).then((response) => {
                    console.log(response)
                    updateConfigs()
                    setScenarioName("")
                    setDescription("")
                    if (scenarioNameRef.current) {
                        scenarioNameRef.current.value = ""
                    }
                    if (descriptionRef.current) {
                        descriptionRef.current.value = ""
                    }
                    setNumDays(0)
                    if (numDaysRef.current) {
                        numDaysRef.current.value = ""
                    }
                    setRootFile(null)
                    setZipFile(null)
                    setConfigSuccess(true)
                    setConfigError(false)
                    setCreateConfigLoading(false)
                    setNumFilesProcessed(0)
                }).catch((error) => {
                    console.log(error)
                    setConfigError(true)
                    setConfigSuccess(false)
                    setCreateConfigLoading(false)
                    setNumFilesProcessed(0)
                })
            }).catch((error) => {
                console.log(error)
                setConfigError(true)
                setConfigSuccess(false)
                setCreateConfigLoading(false)
            })
        //}
        /*else {
            formData.append("scenario_name", scenarioName)
            formData.append("description", description)
            formData.append("number_of_simulations", 1)
            formData.append("root_file", rootFile)
            formData.append("files_zip", zipFile)
            formData.append("files", rootFile)

            post("job-config/", authToken, formData).then((response) => {
                console.log(response)
                updateConfigs()
                setScenarioName("")
                setDescription("")
                if (scenarioNameRef.current) {
                    scenarioNameRef.current.value = ""
                }
                if (descriptionRef.current) {
                    descriptionRef.current.value = ""
                }
                setRootFile(null)
                setZipFile(null)
                setConfigSuccess(true)
                setConfigError(false)
                setCreateConfigLoading(false)
                setNumFilesProcessed(0)
            }).catch((error) => {
                console.log(error)
                setConfigError(true)
                setConfigSuccess(false)
                setCreateConfigLoading(false)
                setNumFilesProcessed(0)
            })
        }*/
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
        }).catch((error) => {
            console.log(error)
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
                    const latestPage = Math.ceil(data.count / 5)
                    const params = { page: latestPage }
                    get("job-config/", authToken, params).then((data) => {
                        setNumFilesProcessed(data.results[data.results.length - 1].files.length)
                        console.log(data.results)
                    })
                })
            }, 1000)
        }
        return () => {
            clearInterval(intervalId)
        };
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
            setNumSimulations(0)
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

    const [configMode, setConfigMode] = useState("custom")
    const [selectedTemplate, setSelectedTemplate] = useState("")

    return(
    <Page minimized={minimized}>
      <PageTitle name={"New Simulation"} minimized={minimized} setMinimized={setMinimized} />
      <div className="new-sim-create-config">
        <div className="new-sim-create-config-title">Create Configuration</div>
        <div className="create-config-mode">
            <button className="sim-results-mode"
                style={{ backgroundColor: configMode === "custom" ? "rgb(220, 220, 220)" : "" }}
                onClick={() => setConfigMode("custom")}>
                    Custom
            </button>
            <button className="sim-results-mode"
                style={{ backgroundColor: configMode === "template" ? "rgb(220, 220, 220)" : "" }}
                onClick={() => setConfigMode("template")}>
                    From Template
            </button>
        </div>
        {configMode === "custom" ? <>
          <div className="new-sim-divider" />
          <div className="new-sim-param">
            <div>Scenario name</div>
            <input className="new-sim-input-text" ref={scenarioNameRef} placeholder="Name"
              onChange={(event) => setScenarioName(event.target.value)} />
          </div>
          <div className="new-sim-divider" />
          <div className="new-sim-param new-sim-param-description">
            <div>Description</div>
            <textarea 
              className="new-sim-input-textarea" 
              ref={descriptionRef}
              placeholder="Description"
              defaultValue=""
              onChange={(event) => setDescription(event.target.value)} 
            />
          </div>
          <div className="new-sim-divider" />
          <div className="new-sim-param">
            <div>Number of days in the outbreak</div>
            <input className="new-sim-create-input-number" ref={numDaysRef} placeholder="0"
              type="number" min={0} onChange={(event) => setNumDays(event.target.value)} />
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
        </> : <>
          <div className="new-sim-divider" />
          <div className="new-config-templates">
          <Template name="Default" selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} setScenarioName={setScenarioName} description={description} setDescription={setDescription} setNumFilesInZip={setNumFilesInZip} setRootFile={setRootFile} setZipFile={setZipFile} />
            <Template name="No Vaccination No Social Distancing" selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} setScenarioName={setScenarioName} description={description} setDescription={setDescription} setNumFilesInZip={setNumFilesInZip} setRootFile={setRootFile} setZipFile={setZipFile} />
            <Template name="No Vaccination Social Distancing" selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} setScenarioName={setScenarioName} description={description} setDescription={setDescription} setNumFilesInZip={setNumFilesInZip} setRootFile={setRootFile} setZipFile={setZipFile} />
            <Template name="Vaccination No Social Distancing" selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} setScenarioName={setScenarioName} description={description} setDescription={setDescription} setNumFilesInZip={setNumFilesInZip} setRootFile={setRootFile} setZipFile={setZipFile} />
            <Template name="No Social Distancing" selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} setScenarioName={setScenarioName} description={description} setDescription={setDescription} setNumFilesInZip={setNumFilesInZip} setRootFile={setRootFile} setZipFile={setZipFile} />
            <Template name="Lethal Infectious" selectedTemplate={selectedTemplate} setSelectedTemplate={setSelectedTemplate} setScenarioName={setScenarioName} description={description} setDescription={setDescription} setNumFilesInZip={setNumFilesInZip} setRootFile={setRootFile} setZipFile={setZipFile} />
          </div>
          <div className="new-sim-divider" />
          <div className="new-sim-param">
            <div>Number of days in the outbreak</div>
            <input className="new-sim-create-input-number" ref={numDaysRef} placeholder="0"
              type="number" min={0} onChange={(event) => setNumDays(event.target.value)} />
          </div>
          <div className="new-sim-divider" />
        </>}
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