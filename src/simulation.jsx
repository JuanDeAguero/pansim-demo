import "./styles/simulation.css"
import { Button } from "./new_simulation"
import { CloudWatchLogsClient } from "@aws-sdk/client-cloudwatch-logs"
import { get } from "./requests"
import { GetLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs"
import { memo } from "react"
import { Page } from "./page"
import { PageTitle } from "./page"
import { post } from "./requests"
import { PulseLoader } from "react-spinners"
import { statusColors } from "./simulations"
import { useAuth } from "./auth"
import { useCallback } from "react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import { userColors } from "./profile"
import { useRef } from "react"
import { useState } from "react"
import * as d3 from "d3"

const cloudWatchLogsClient = new CloudWatchLogsClient({
    region: process.env.REACT_APP_AWS_DEFAULT_REGION,
    credentials: {
        accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
    }
})

const colors = {
    "Susceptible": "blue",
    "Infectious": "red",
    "Recovered": "green",
    "Dead": "aqua",
    "Vaccinated": "orange",
    "Hospitalized": "gray",
    "Removed": "black"
}

const LineChart = ({ data, params, width, height, data25, data75 }) => {
    
    const svgRef = useRef()

    useEffect(() => {

        if (!data) return

        const svg = d3.select(svgRef.current)
        const margin = { top: 20, right: 20, bottom: 30, left: 60 }
        const adjustedWidth = width - margin.left - margin.right
        const adjustedHeight = height - margin.top - margin.bottom

        const xDomain = d3.extent(data, d => d.day)
        const xScale = d3.scaleLinear()
            .domain(xDomain)
            .range([margin.left, adjustedWidth + margin.left])
            .nice()

        const max = params.reduce((acc, param) => {
            return Math.max(acc, d3.max(data, d => d[param.toLowerCase()]))
        }, 0)

        const yScale = d3.scaleLinear()
            .domain([0, max])
            .nice()
            .range([adjustedHeight, margin.top])

        const createLine = param => {
            const line = d3.line()
                .x(d => xScale(d.day))
                .y(d => yScale(d[param.toLowerCase()]))

            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", colors[param])
                .attr("stroke-width", 2)
                .attr("d", line)

            svg.selectAll(".dot-" + param.toLowerCase())
                .data(data)
                .enter().append("circle")
                .attr("class", "dot-" + param.toLowerCase())
                .attr("cx", d => xScale(d.day))
                .attr("cy", d => yScale(d[param.toLowerCase()]))
                .attr("r", 1)
                .attr("fill", colors[param])
        }

        svg.selectAll("*").remove()
        
        if (data25 && data75) {
            params.forEach(param => {
                const area = d3.area()
                    .x(d => xScale(d.day))
                    .y0(d => yScale(d[param.toLowerCase()]))
                    .y1((d, i) => yScale(data75[i][param.toLowerCase()]))

                svg.append("path")
                    .datum(data25)
                    .attr("fill", "lightgray")
                    .attr("d", area)
            })
        }

        params.forEach(item => {
            createLine(item)
        })

        svg.attr("width", width)
            .attr("height", height)

        let numTicks = 10
        if (data.length < 10) numTicks = data.length

        const xAxis = d3.axisBottom(xScale)
            .tickValues(d3.ticks(xDomain[0], xDomain[1], numTicks))
            .tickFormat(d3.format("d"))

        svg.append("g")
            .attr("transform", `translate(0,${adjustedHeight})`)
            .call(xAxis)

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale))

    }, [data, width, height, data25, data75])

    return <svg ref={svgRef} />
}

const Filter = memo(({ param, checked, onToggle }) => {

    const [isChecked, setIsChecked] = useState(checked)
    const [color, setColor] = useState("blue")

    const handleClick = () => {
        setIsChecked(prev => !prev)
        onToggle(param)
    }

    useEffect(() => {
        setColor(colors[param])
    }, [param])

    return(
    <button className="sim-filter" onClick={handleClick}>
      <div className="sim-filter-color" style={{ backgroundColor: color }} />
      <div style={{ fontWeight: isChecked ? "500" : "normal" }}>{param}</div>
      <input className="sim-filter-checkbox" type="checkbox" checked={isChecked} />
    </button>
    )
})

const Results = ({ resultType, data, numSimulations, loading, update, data25, data75 }) => {

    let params = ["Susceptible", "Infectious", "Recovered", "Dead", "Vaccinated", "Hospitalized"]

    if (resultType === "Population") {
        params.splice(params.indexOf("Recovered"), 1)
    }

    const [selectedInst, setSelectedInst] = useState(0)
    const [selectedId, setSelectedId] = useState(0)
    const [selectedParams, setSelectedParams] = useState(["Susceptible"])

    const toggleParam = (param) => {
        setSelectedParams(prev => {
            if (prev.includes(param)) {
                return prev.filter(item => item !== param)
            } else {
                return [...prev, param]
            }
        })
    }

    const [selectedMode, setSelectedMode] = useState("custom")

    const onRefreshClick = useCallback(() => {
        if (resultType === "Population") {
            update(selectedInst, selectedMode)
        } else if (resultType === "Health Authority") {
            update(selectedInst, selectedId, selectedMode)
        } else if (resultType === "Home Community") {
            update(selectedInst, selectedId, selectedMode)
        }
    }, [selectedInst, selectedId, selectedMode])

    useEffect(() => {
        if (resultType === "Home Community") {
            setSelectedId(1)
        }
    }, [selectedMode])

    return (
    <div className="sim-results">
      <div className="sim-results-title">{resultType} Data</div>
      <div className="sim-results-modes">
        <button className="sim-results-mode"
          style={{ backgroundColor: selectedMode === "custom" ? "rgb(220, 220, 220)" : "" }}
          onClick={() => setSelectedMode("custom")}>
            Custom
        </button>
        <button className="sim-results-mode"
          style={{ backgroundColor: selectedMode === "median" ? "rgb(220, 220, 220)" : "" }}
          onClick={() => setSelectedMode("median")}>
            Median
        </button>
        <button className="sim-results-mode"
          style={{ backgroundColor: selectedMode === "average" ? "rgb(220, 220, 220)" : "" }}
          onClick={() => { setSelectedMode("average") } }>
            Average
        </button>
      </div>
      {selectedMode === "custom" && <div className="sim-results-numbers">
        <div className="sim-results-number">
          <div>Instance number (0-{numSimulations - 1})</div>
          <input className="sim-results-number-input" defaultValue={0} placeholder="0"
            type="number" min={0} max={numSimulations - 1}
            onChange={(event) => setSelectedInst(event.target.value)} />
        </div>
        {resultType === "Health Authority" && <div className="sim-results-number">
          <div>Health authority id (0-3)</div>
          <input className="sim-results-number-input" defaultValue={0} placeholder="0"
            type="number" min={0} max={3} onChange={(event) => setSelectedId(event.target.value)} />
        </div>}
        {resultType === "Home Community" && <div className="sim-results-number">
        <div>Home community id (1-10)</div>
        <input className="sim-results-number-input" defaultValue={1} placeholder="1"
          type="number" min={1} max={10} onChange={(event) => setSelectedId(event.target.value)} />
        </div>}
      </div>}
      <div className="sim-filters">
        {params.map((param) =>
          <Filter key={param} param={param} checked={selectedParams.includes(param)}
            onToggle={toggleParam} />)}
      </div>
      <Button onClick={onRefreshClick} extraStyle={"sim-refresh-button"} loading={loading}>
        <div className="sim-refresh-button-content">
          <div>REFRESH</div>
          <span className="sim-refresh-icon material-symbols-outlined">refresh</span>
        </div>
      </Button>
      <div className="sim-results-chart">
        <LineChart data={data} params={selectedParams} width={500} height={500} data25={data25} data75={data75} />
      </div>
    </div>
    )
}

const Logs = ({ id, authToken }) => {

    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchLogs = async () => {
        setLoading(true)
        setLogs([])
        get("job/" + String(id), authToken).then(async (job) => {
            try {
                let dataAll = []

                let params = {
                    logGroupName: "/aws/batch/job",
                    logStreamName: job.log_stream_name,
                    limit: 10000,
                    startFromHead: true
                }
                let command = new GetLogEventsCommand(params)
                let data = await cloudWatchLogsClient.send(command)
                console.log(data)
                dataAll = [...dataAll, ...data.events]

                // TODO: use a function to fetch the next log

                params = {
                    logGroupName: "/aws/batch/job",
                    logStreamName: job.log_stream_name,
                    limit: 10000,
                    startFromHead: true,
                    nextToken: data.nextForwardToken
                }
                command = new GetLogEventsCommand(params)
                data = await cloudWatchLogsClient.send(command)
                console.log(data)
                dataAll = [...dataAll, ...data.events]

                params = {
                    logGroupName: "/aws/batch/job",
                    logStreamName: job.log_stream_name,
                    limit: 10000,
                    startFromHead: true,
                    nextToken: data.nextForwardToken
                }
                command = new GetLogEventsCommand(params)
                data = await cloudWatchLogsClient.send(command)
                console.log(data)
                dataAll = [...dataAll, ...data.events]

                params = {
                    logGroupName: "/aws/batch/job",
                    logStreamName: job.log_stream_name,
                    limit: 10000,
                    startFromHead: true,
                    nextToken: data.nextForwardToken
                }
                command = new GetLogEventsCommand(params)
                data = await cloudWatchLogsClient.send(command)
                console.log(data)
                dataAll = [...dataAll, ...data.events]

                params = {
                    logGroupName: "/aws/batch/job",
                    logStreamName: job.log_stream_name,
                    limit: 10000,
                    startFromHead: true,
                    nextToken: data.nextForwardToken
                }
                command = new GetLogEventsCommand(params)
                data = await cloudWatchLogsClient.send(command)
                console.log(data)
                dataAll = [...dataAll, ...data.events]

                params = {
                    logGroupName: "/aws/batch/job",
                    logStreamName: job.log_stream_name,
                    limit: 10000,
                    startFromHead: true,
                    nextToken: data.nextForwardToken
                }
                command = new GetLogEventsCommand(params)
                data = await cloudWatchLogsClient.send(command)
                console.log(data)
                dataAll = [...dataAll, ...data.events]

                params = {
                    logGroupName: "/aws/batch/job",
                    logStreamName: job.log_stream_name,
                    limit: 10000,
                    startFromHead: true,
                    nextToken: data.nextForwardToken
                }
                command = new GetLogEventsCommand(params)
                data = await cloudWatchLogsClient.send(command)
                console.log(data)
                dataAll = [...dataAll, ...data.events]

                console.log(dataAll)

                setLogs(dataAll.reverse())
            } catch (error) {
                console.error("Error fetching logs: ", error)
            }
            setLoading(false)
        })
    }

    useEffect(() => {
        fetchLogs()
    }, [id, authToken])

    return(
    <div className="sim-logs">
      <div className="sim-results-title">Logs</div>
      <div className="sim-logs-list">
        {logs.map((log, index) =>
          <div className="sim-log" key={index}>{log.message}</div>)}
      </div>
      <Button onClick={fetchLogs} extraStyle={"sim-refresh-button"} loading={loading}>
        <div className="sim-refresh-button-content">
          <div>REFRESH</div>
          <span className="sim-refresh-icon material-symbols-outlined">refresh</span>
        </div>
      </Button>
    </div>
    )
}

const Simulation = ({ setConfigEditMode, minimized, setMinimized }) => {

    const { id } = useParams()

    const [job, setJob] = useState(null)
    const [jobName, setJobName] = useState("")
    const [jobStatus, setJobStatus] = useState("")
    const [jobLoading, setJobLoading] = useState(true)
    const [numSimulations, setNumSimulations] = useState(1)

    const [healthAuthorityData, setHealthAuthorityData] = useState(null)
    const [homeCommunityData, setHomeCommunityData] = useState(null)

    const [populationData, setPopulationData] = useState(null)
    const [populationData25, setPopulationData25] = useState(null)
    const [populationData75, setPopulationData75] = useState(null)

    const [healthAuthorityDataLoading, setHealthAuthorityDataLoading] = useState(true)
    const [homeCommunityDataLoading, setHomeCommunityDataLoading] = useState(true)
    const [populationDataLoading, setPopulationDataLoading] = useState(true)

    const { authToken } = useAuth()

    const [config, setConfig] = useState(null)
    const [configName, setConfigName] = useState("")
    const [rootFileName, setRootFileName] = useState("")
    const [rootFileUrl, setRootFileUrl] = useState("")
    const [configLoading, setConfigLoading] = useState(true)

    const updatePopulationData = async (instanceNumber, mode) => {
        setPopulationDataLoading(true)
        const params = {
            "instance_number": mode !== "custom" ? mode : instanceNumber,
            "include_population": 1
        }
        try {
            const data = await get("job/" + String(id) + "/results", authToken, params)
            if (mode !== "custom") {
                setPopulationData(data[0].aggregate_population_data)
            } else {
                setPopulationData(data[0].aggregate_population_data[0].population_hazard_rates_data)
            }

            if (mode === "median") {
                const percentile25Params = {
                    "instance_number": "percentile25",
                    "include_population": 1
                }
                const percentile25Data = await get("job/" + String(id) + "/results", authToken, percentile25Params)
                
                setPopulationData25(percentile25Data[0].aggregate_population_data)
                const percentile75Params = {
                    "instance_number": "percentile75",
                    "include_population": 1
                }
                const percentile75Data = await get("job/" + String(id) + "/results", authToken, percentile75Params)
                setPopulationData75(percentile75Data[0].aggregate_population_data)
            } else {
                setPopulationData25(null)
                setPopulationData75(null)
            }

        } catch (error) {
            console.error(error)
        } finally {
            setPopulationDataLoading(false)
        }
    }    

    const updateHealthAuthorityData = (instanceNumber, healthAuthorityId, mode) => {
        setHealthAuthorityDataLoading(true)
        const params = {
            "instance_number": mode !== "custom" ? mode : instanceNumber,
            "health_authority_id": healthAuthorityId
        }
        get("job/" + String(id) + "/results", authToken, params).then((data) => {
            try {
                if (mode !== "custom") {
                    setHealthAuthorityData(data[0].health_authority_data)
                } else {
                    setHealthAuthorityData(data[0].health_authority_data[0].hazard_rates_data)
                }
            } catch (error) {}
            setHealthAuthorityDataLoading(false)
        }).catch((error) => setHealthAuthorityDataLoading(false))
    }

    const updateHomeCommunityData = (instanceNumber, homeCommunityId, mode) => {
        setHomeCommunityDataLoading(true)
        const params = {
            "instance_number": mode !== "custom" ? mode : instanceNumber,
            "home_community_id": homeCommunityId
        }
        get("job/" + String(id) + "/results", authToken, params).then((data) => {
            try {
                if (mode !== "custom") {
                    setHomeCommunityData(data[0].home_community_data)
                } else {
                    setHomeCommunityData(data[0].home_community_data[0].hazard_rates_data)
                }
            } catch (error) {}
            setHomeCommunityDataLoading(false)
        }).catch((error) => setHomeCommunityDataLoading(false))
    }

    const updateJob = () => {
        setJobLoading(true)
        get("job/" + String(id), authToken).then((job) => {
            setJob(job)
            setJobName(job.name)
            setJobStatus(job.status)
            setJobLoading(false)
            setNumSimulations(job.number_of_simulations)
            get("job-config/" + job.job_configuration.id, authToken).then((config) => {
                setConfig(config)
                setConfigName(config.scenario_name)
                setRootFileName(config.root_file.name)
                setRootFileUrl(config.root_file.file)
                setConfigLoading(false)
            })
        })
    }

    useEffect(() => {

        updatePopulationData(0, "custom")
        updateHealthAuthorityData(0, 0, "custom")
        updateHomeCommunityData(0, 1, "custom")

        updateJob()

    }, [id, authToken])

    const navigate = useNavigate()

    const onOpenConfigClick = () => {
        if (configLoading || !config) return
        setConfigEditMode(false)
        navigate("/configurations/" + config.id)
    }

    const [downloading, setDownloading] = useState(false)

    const convertPopulationToCSV = (data) => {
        const array = data.map((item, index) => {
            const num_sim = index + 1
            return item.aggregate_population_data[0].population_hazard_rates_data.map(rates => ({
                num_sim,
                num_day: rates.day,
                dead: rates.dead,
                hospitalized: rates.hospitalized,
                infectious: rates.infectious,
                removed: rates.removed,
                susceptible: rates.susceptible,
                vaccinated: rates.vaccinated
            }))
        }).flat()
        const header = "num_sim,num_day,dead,hospitalized,infectious,removed,susceptible,vaccinated\n"
        const csvRows = array.map(row => `${row.num_sim},${row.num_day},${row.dead},${row.hospitalized},${row.infectious},${row.removed},${row.susceptible},${row.vaccinated}`).join("\n")
        return header + csvRows
    }

    const convertHealthAuthorityToCSV = (data) => {
        const array = data.map((item, index) => {
            const num_sim = index + 1
            return item.health_authority_data.flatMap((healthAuthority, healthAuthorityId) => {
                return healthAuthority.hazard_rates_data.map(rates => ({
                    num_sim,
                    num_day: rates.day,
                    health_authority_id: healthAuthorityId,
                    dead: rates.dead,
                    hospitalized: rates.hospitalized,
                    infectious: rates.infectious,
                    recovered: rates.recovered,
                    removed: rates.removed,
                    susceptible: rates.susceptible,
                    vaccinated: rates.vaccinated
                }))
            })
        }).flat()
        const header = "num_sim,num_day,health_authority_id,dead,hospitalized,infectious,recovered,removed,susceptible,vaccinated\n"
        const csvRows = array.map(row => `${row.num_sim},${row.num_day},${row.health_authority_id},${row.dead},${row.hospitalized},${row.infectious},${row.recovered},${row.removed},${row.susceptible},${row.vaccinated}`).join("\n")
        return header + csvRows
    }

    const downloadCSV = (csvData, filename) => {
        const blob = new Blob([csvData], { type: "text/csv" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const onDownloadClick = () => {
        setDownloading(true)
        const params = {
            "instance_number": "all",
            "include_population": 1,
            "health_authority_id": "all"
        }
        get("job/" + String(id) + "/results", authToken, params).then((data) => {
            console.log(data)
            const csvDataPopulation = convertPopulationToCSV(data)
            const csvDataHealthAuthority = convertHealthAuthorityToCSV(data)
            downloadCSV(csvDataPopulation, "population_aggregate.csv")
            downloadCSV(csvDataHealthAuthority, "health_authorities.csv")
            setDownloading(false)
        }).catch((error) => setDownloading(false))
    }

    const [shareOpen, setShareOpen] = useState(false)
    const [shareLoading, setShareLoading] = useState(true)
    const [shareSuccess, setShareSuccess] = useState(false)
    const [shareError, setShareError] = useState(false)
    const [userToEdit, setUserToEdit] = useState(null)

    const onAllowViewClick = () => {
        setShareLoading(true)
        setShareSuccess(false)
        setShareError(false)
        const formData = new FormData()
        formData.append("user_id", userToEdit.id)
        post("job/" + String(id) + "/grant/view", authToken, formData).then((response) => {
            setShareLoading(false)
            setShareSuccess(true)
            setShareError(false)
            updateViewersAndEditors()
        }).catch((error) => {
            setShareLoading(false)
            setShareSuccess(false)
            setShareError(true)
            updateViewersAndEditors()
        })
    }

    const onAllowEditClick = () => {
        setShareLoading(true)
        setShareSuccess(false)
        setShareError(false)
        const formData = new FormData()
        formData.append("user_id", userToEdit.id)
        post("job/" + String(id) + "/grant/edit", authToken, formData).then((response) => {
            setShareLoading(false)
            setShareSuccess(true)
            setShareError(false)
            updateViewersAndEditors()
        }).catch((error) => {
            setShareLoading(false)
            setShareSuccess(false)
            setShareError(true)
            updateViewersAndEditors()
        })
    }

    const onRemoveAccessClick = () => {
        setShareLoading(true)
        setShareSuccess(false)
        setShareError(false)
        const formData = new FormData()
        formData.append("user_id", userToEdit.id)
        post("job/" + String(id) + "/grant/none", authToken, formData).then((response) => {
            setShareLoading(false)
            setShareSuccess(true)
            setShareError(false)
            updateViewersAndEditors()
        }).catch((error) => {
            setShareLoading(false)
            setShareSuccess(false)
            setShareError(true)
            updateViewersAndEditors()
        })
    }

    const [viewers, setViewers] = useState([])
    const [editors, setEditors] = useState([])
    
    const fetchUserObjects = async (userIds, authToken) => {
        const userPromises = userIds.map(id => get(`users/${id}`, authToken))
        return Promise.all(userPromises)
    };
    
    const updateViewersAndEditors = async () => {

        setShareLoading(true)
        setViewers([])
        setEditors([])

        try {
            const job = await get(`job/${String(id)}`, authToken)
    
            const readerIds = job.readers
            const editorIds = [...job.editors, job.owner.id]
    
            const [readers, editors] = await Promise.all([
                fetchUserObjects(readerIds, authToken),
                fetchUserObjects(editorIds, authToken)
            ])
    
            setViewers(readers)
            setEditors(editors)
        } catch (error) {
            console.error("Error updating viewers and editors:", error)
        }

        setShareLoading(false)
    }

    const [foundUsers, setFoundUsers] = useState([])
    const [findingUsers, setFindingUsers] = useState(false)

    const searchUsers = () => {
        if (findingUsers) return
        setFoundUsers([])
        setFindingUsers(true)
        get("users/list/", authToken).then((users) => {
            setFoundUsers(users.results)
            setFindingUsers(false)
        })
    }

    useEffect(() => {
        updateViewersAndEditors()
    }, [])

    const ViewerOrEditor = ({ user }) => {
        return(
        <button className="sim-share-user" style={{ backgroundColor: userColors[user.color_id] }} onClick={() => setUserToEdit(user)}>{user.username.charAt(0).toUpperCase()}</button>
        )
    }

    const FoundUser = ({ user }) => {
        return(
        <button className="sim-share-user-list" onClick={() => setUserToEdit(user)}>
          {user.username}
        </button>
        )
    }

    return(
    <Page minimized={minimized}>
      <PageTitle name={"Simulation " + jobName} minimized={minimized} setMinimized={setMinimized}>
        <div className="sim-title-props">
          {!jobLoading && <div className="sim-title-status"
            style={{ backgroundColor: statusColors[jobStatus] }}>
              {jobStatus}
          </div>}
          <Button onClick={updateJob} extraStyle={"sim-status-refresh"} loading={jobLoading}>
            <div className="sim-refresh-button-content">
              <span className="sim-status-refresh-icon material-symbols-outlined">refresh</span>
            </div>
          </Button>
          {(!jobLoading && !populationDataLoading && !healthAuthorityDataLoading &&
            !homeCommunityDataLoading) &&
              <Button extraStyle={"sim-refresh-button sim-download-button"} loading={downloading}
                onClick={onDownloadClick}>
                  <div className="sim-refresh-button-content">
                    <div>DOWNLOAD</div>
                    <span className="sim-download-icon material-symbols-outlined">download</span>
                  </div>
              </Button>}
          {(!jobLoading) &&
            <Button extraStyle={"sim-refresh-button sim-download-button"} loading={false} onClick={() => setShareOpen(true)}>
              <div className="sim-refresh-button-content">
                <div>SHARE</div>
                <span className="sim-refresh-icon material-symbols-outlined">person_add</span>
              </div>
            </Button>}
        </div>
      </PageTitle>
      {shareOpen && <div className="sim-share-wrapper">
        <div className="sim-share">
          <div className="sim-share-title-wrapper">
            <div className="sim-share-title">Share</div>
            {shareLoading && <PulseLoader className="custom-button-loader" color="rgb(161, 183, 224)" />}
          </div>
          <button className="sim-share-close" onClick={() => setShareOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="sim-share-viewers-title">Viewers</div>
          <div className="sim-share-viewers-list">
            {viewers && viewers.map((viewer, index) => <ViewerOrEditor user={viewer} />)}
          </div>
          <div className="sim-share-viewers-title">Editors</div>
          <div className="sim-share-viewers-list">
            {editors && editors.map((editor, index) => <ViewerOrEditor user={editor} />)}
          </div>
          <div className="sim-share-find-title">Find user to share</div>
          <div className="sim-share-find-search">
            <input className="sim-share-find-input" type="text" placeholder="Username" />
            <button className="sims-search-button" onClick={searchUsers}>
              {!findingUsers ? <span className="sims-search-icon material-symbols-outlined">search</span> :
              <PulseLoader className="custom-button-loader" color="white" />}
            </button>
          </div>
          <div className="sim-share-users-list">
            {foundUsers && foundUsers.map((user, index) => <FoundUser user={user}/>)}
          </div>
          <div className="sim-share-buttons">
            <button className="sim-share-button" onClick={onAllowViewClick}>Allow View</button>
            <button className="sim-share-button" onClick={onAllowEditClick}>Allow Edit</button>
            <button className="sim-share-button sim-share-button-red" onClick={onRemoveAccessClick}>Remove Access</button>
          </div>
          {userToEdit && <div className="sim-share-selected">Selected user: {userToEdit.username}</div>}
          {shareSuccess && <div className="success-message message-share">Success!</div>}
          {shareError && <div className="error-message message-share">Error</div>}
        </div>
      </div>}
      <div className="sim-config">
        <div className="sim-config-title">Configuration</div>
        <div className="sim-config-text">Scenario name: {configName}</div>
        <div className="sim-config-text">Root file: {rootFileName}</div>
        <Button onClick={onOpenConfigClick} extraStyle={"sim-config-button"}
          loading={configLoading}>
            <div className="sim-config-button-content">
              <div>OPEN</div>
              <span className="sim-open-icon material-symbols-outlined">open_in_new</span>
            </div>
        </Button>
      </div>
      <Logs id={id} authToken={authToken} />
      <Results resultType={"Population"} data={populationData} numSimulations={numSimulations}
        loading={populationDataLoading} update={updatePopulationData} data25={populationData25} data75={populationData75} />
      <Results resultType={"Health Authority"} data={healthAuthorityData}
        numSimulations={numSimulations} loading={healthAuthorityDataLoading}
        update={updateHealthAuthorityData} />
      {false && <Results resultType={"Home Community"} data={homeCommunityData}
        numSimulations={numSimulations} loading={homeCommunityDataLoading}
        update={updateHomeCommunityData} />}
    </Page>
    )
}

export default Simulation