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

        data = [...data].sort((a, b) => a.day - b.day)

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
    const [selectedParams, setSelectedParams] = useState(["Infectious", "Dead", "Vaccinated", "Hospitalized"])

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
        /*if (resultType === "Population") {
            update(selectedInst, selectedMode)
        } else if (resultType === "Health Authority") {
            update(selectedInst, selectedId, selectedMode)
        } else if (resultType === "Home Community") {
            update(selectedInst, selectedId, selectedMode)
        }*/
    }, [selectedInst, selectedId, selectedMode])

    useEffect(() => {
        if (resultType === "Home Community") {
            setSelectedId(1)
        } else if (resultType === "Health Authority") {
            setSelectedParams(["Susceptible"])
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
        {resultType === "Population" ? <>
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
        </> : null}
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
          <Filter key={param} param={param} checked={(resultType === "Population" && (param === "Infectious" || param === "Dead" || param === "Vaccinated" || param === "Hospitalized")) || (resultType === "Health Authority" && param === "Susceptible")}
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

        setTimeout(() => {

            setLogs([
                {
                    message: "Process completed successfully."
                },
                {
                    message: "Successfully saved data."
                },
                {
                    message: "Saving the data to the database"
                },
                {
                    message: "Running the aggregator"
                },
                {
                    message: "1239164kB"
                },
                {
                    message: "Rank 1 - CPU time: 98 sec, Memory usage: Rank 0 - CPU time: 98 sec, Memory usage: 21480kB"
                },
                {
                    message: "Simulation Finished"
                },
                {
                    message: "Simulation data cleared"
                },
                {
                    message: "Clearing the simulation data"
                },
                {
                    message: "TIME to record files: 0s (0min)"
                },
                {
                    message: "Recording school statistics"
                },
                {
                    message: "Recording general statistics"
                },
                {
                    message: "TIME to run the simulation: 96s (1.6min)"
                },
                {
                    message: "..."
                }
            ])

            setLoading(false)

        }, 2000)

        
        /*setLoading(true)
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
        })*/
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
        /*setJobLoading(true)
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
        })*/
    }

    useEffect(() => {

        setTimeout(() => {

            setJobStatus("SUCCEEDED")

            setConfigName("Config 1")
            setRootFileName("base_root.txt")

            const data =
                [
                    {
                        "day": 0,
                        "susceptible": 506287,
                        "infectious": 989,
                        "dead": 0,
                        "vaccinated": 234,
                        "hospitalized": 0,
                        "removed": 0
                    },
                    {
                        "day": 1,
                        "susceptible": 506117,
                        "infectious": 840,
                        "dead": 319,
                        "vaccinated": 468,
                        "hospitalized": 0,
                        "removed": 0
                    },
                    {
                        "day": 2,
                        "susceptible": 505950,
                        "infectious": 940,
                        "dead": 386,
                        "vaccinated": 702,
                        "hospitalized": 0,
                        "removed": 0
                    },
                    {
                        "day": 3,
                        "susceptible": 505769,
                        "infectious": 1054,
                        "dead": 453,
                        "vaccinated": 936,
                        "hospitalized": 0,
                        "removed": 0
                    },
                    {
                        "day": 4,
                        "susceptible": 505577,
                        "infectious": 1171,
                        "dead": 528,
                        "vaccinated": 1170,
                        "hospitalized": 0,
                        "removed": 0
                    },
                    {
                        "day": 5,
                        "susceptible": 505372,
                        "infectious": 1307,
                        "dead": 597,
                        "vaccinated": 1404,
                        "hospitalized": 7,
                        "removed": 0
                    },
                    {
                        "day": 6,
                        "susceptible": 505121,
                        "infectious": 1482,
                        "dead": 673,
                        "vaccinated": 1638,
                        "hospitalized": 7,
                        "removed": 0
                    },
                    {
                        "day": 7,
                        "susceptible": 504819,
                        "infectious": 1660,
                        "dead": 797,
                        "vaccinated": 1872,
                        "hospitalized": 10,
                        "removed": 0
                    },
                    {
                        "day": 8,
                        "susceptible": 504498,
                        "infectious": 1871,
                        "dead": 907,
                        "vaccinated": 2106,
                        "hospitalized": 11,
                        "removed": 0
                    },
                    {
                        "day": 9,
                        "susceptible": 504164,
                        "infectious": 2043,
                        "dead": 1069,
                        "vaccinated": 2340,
                        "hospitalized": 13,
                        "removed": 0
                    },
                    {
                        "day": 10,
                        "susceptible": 503797,
                        "infectious": 2251,
                        "dead": 1228,
                        "vaccinated": 2574,
                        "hospitalized": 14,
                        "removed": 0
                    },
                    {
                        "day": 11,
                        "susceptible": 503421,
                        "infectious": 2378,
                        "dead": 1371,
                        "vaccinated": 2808,
                        "hospitalized": 15,
                        "removed": 106
                    },
                    {
                        "day": 12,
                        "susceptible": 503033,
                        "infectious": 2516,
                        "dead": 1506,
                        "vaccinated": 3042,
                        "hospitalized": 17,
                        "removed": 221
                    },
                    {
                        "day": 13,
                        "susceptible": 502619,
                        "infectious": 2627,
                        "dead": 1673,
                        "vaccinated": 3276,
                        "hospitalized": 18,
                        "removed": 357
                    },
                    {
                        "day": 14,
                        "susceptible": 502195,
                        "infectious": 2729,
                        "dead": 1840,
                        "vaccinated": 3510,
                        "hospitalized": 19,
                        "removed": 512
                    },
                    {
                        "day": 15,
                        "susceptible": 501747,
                        "infectious": 2809,
                        "dead": 2037,
                        "vaccinated": 3744,
                        "hospitalized": 18,
                        "removed": 683
                    },
                    {
                        "day": 16,
                        "susceptible": 501287,
                        "infectious": 2963,
                        "dead": 2259,
                        "vaccinated": 3978,
                        "hospitalized": 22,
                        "removed": 767
                    },
                    {
                        "day": 17,
                        "susceptible": 500802,
                        "infectious": 3125,
                        "dead": 2463,
                        "vaccinated": 4212,
                        "hospitalized": 23,
                        "removed": 886
                    },
                    {
                        "day": 18,
                        "susceptible": 500281,
                        "infectious": 3342,
                        "dead": 2653,
                        "vaccinated": 4446,
                        "hospitalized": 23,
                        "removed": 1000
                    },
                    {
                        "day": 19,
                        "susceptible": 499731,
                        "infectious": 3509,
                        "dead": 2903,
                        "vaccinated": 4680,
                        "hospitalized": 22,
                        "removed": 1133
                    },
                    {
                        "day": 20,
                        "susceptible": 499167,
                        "infectious": 3686,
                        "dead": 3111,
                        "vaccinated": 4914,
                        "hospitalized": 20,
                        "removed": 1312
                    },
                    {
                        "day": 21,
                        "susceptible": 498563,
                        "infectious": 3957,
                        "dead": 3290,
                        "vaccinated": 5148,
                        "hospitalized": 22,
                        "removed": 1466
                    },
                    {
                        "day": 22,
                        "susceptible": 497916,
                        "infectious": 4199,
                        "dead": 3523,
                        "vaccinated": 5382,
                        "hospitalized": 20,
                        "removed": 1638
                    },
                    {
                        "day": 23,
                        "susceptible": 497258,
                        "infectious": 4465,
                        "dead": 3730,
                        "vaccinated": 5616,
                        "hospitalized": 23,
                        "removed": 1823
                    },
                    {
                        "day": 24,
                        "susceptible": 496531,
                        "infectious": 4758,
                        "dead": 3968,
                        "vaccinated": 5850,
                        "hospitalized": 26,
                        "removed": 2019
                    },
                    {
                        "day": 25,
                        "susceptible": 495764,
                        "infectious": 5018,
                        "dead": 4239,
                        "vaccinated": 6084,
                        "hospitalized": 30,
                        "removed": 2255
                    },
                    {
                        "day": 26,
                        "susceptible": 494983,
                        "infectious": 5239,
                        "dead": 4594,
                        "vaccinated": 6318,
                        "hospitalized": 26,
                        "removed": 2460
                    },
                    {
                        "day": 27,
                        "susceptible": 494121,
                        "infectious": 5463,
                        "dead": 4995,
                        "vaccinated": 6552,
                        "hospitalized": 28,
                        "removed": 2697
                    },
                    {
                        "day": 28,
                        "susceptible": 493223,
                        "infectious": 5826,
                        "dead": 5270,
                        "vaccinated": 6786,
                        "hospitalized": 33,
                        "removed": 2957
                    },
                    {
                        "day": 29,
                        "susceptible": 492247,
                        "infectious": 6138,
                        "dead": 5678,
                        "vaccinated": 7020,
                        "hospitalized": 36,
                        "removed": 3213
                    },
                    {
                        "day": 30,
                        "susceptible": 491315,
                        "infectious": 6323,
                        "dead": 6151,
                        "vaccinated": 7254,
                        "hospitalized": 37,
                        "removed": 3487
                    },
                    {
                        "day": 31,
                        "susceptible": 490327,
                        "infectious": 6522,
                        "dead": 6652,
                        "vaccinated": 7488,
                        "hospitalized": 35,
                        "removed": 3775
                    },
                    {
                        "day": 32,
                        "susceptible": 489304,
                        "infectious": 6777,
                        "dead": 7121,
                        "vaccinated": 7722,
                        "hospitalized": 30,
                        "removed": 4074
                    },
                    {
                        "day": 33,
                        "susceptible": 488205,
                        "infectious": 6960,
                        "dead": 7686,
                        "vaccinated": 7956,
                        "hospitalized": 31,
                        "removed": 4425
                    },
                    {
                        "day": 34,
                        "susceptible": 487166,
                        "infectious": 6881,
                        "dead": 8486,
                        "vaccinated": 8190,
                        "hospitalized": 27,
                        "removed": 4743
                    },
                    {
                        "day": 35,
                        "susceptible": 486143,
                        "infectious": 7240,
                        "dead": 8840,
                        "vaccinated": 8424,
                        "hospitalized": 29,
                        "removed": 5053
                    },
                    {
                        "day": 36,
                        "susceptible": 485109,
                        "infectious": 7467,
                        "dead": 9299,
                        "vaccinated": 8658,
                        "hospitalized": 34,
                        "removed": 5401
                    },
                    {
                        "day": 37,
                        "susceptible": 484054,
                        "infectious": 7543,
                        "dead": 9929,
                        "vaccinated": 8892,
                        "hospitalized": 31,
                        "removed": 5750
                    },
                    {
                        "day": 38,
                        "susceptible": 482945,
                        "infectious": 7824,
                        "dead": 10385,
                        "vaccinated": 9126,
                        "hospitalized": 33,
                        "removed": 6122
                    },
                    {
                        "day": 39,
                        "susceptible": 481780,
                        "infectious": 8096,
                        "dead": 10887,
                        "vaccinated": 9360,
                        "hospitalized": 37,
                        "removed": 6513
                    },
                    {
                        "day": 40,
                        "susceptible": 480589,
                        "infectious": 8403,
                        "dead": 11362,
                        "vaccinated": 9594,
                        "hospitalized": 46,
                        "removed": 6922
                    },
                    {
                        "day": 41,
                        "susceptible": 479429,
                        "infectious": 8616,
                        "dead": 11845,
                        "vaccinated": 9828,
                        "hospitalized": 47,
                        "removed": 7386
                    },
                    {
                        "day": 42,
                        "susceptible": 478246,
                        "infectious": 8939,
                        "dead": 12271,
                        "vaccinated": 10062,
                        "hospitalized": 50,
                        "removed": 7820
                    },
                    {
                        "day": 43,
                        "susceptible": 476954,
                        "infectious": 9272,
                        "dead": 12772,
                        "vaccinated": 10296,
                        "hospitalized": 51,
                        "removed": 8278
                    },
                    {
                        "day": 44,
                        "susceptible": 475603,
                        "infectious": 9462,
                        "dead": 13418,
                        "vaccinated": 10530,
                        "hospitalized": 53,
                        "removed": 8793
                    },
                    {
                        "day": 45,
                        "susceptible": 474218,
                        "infectious": 9904,
                        "dead": 13843,
                        "vaccinated": 10764,
                        "hospitalized": 63,
                        "removed": 9311
                    },
                    {
                        "day": 46,
                        "susceptible": 472781,
                        "infectious": 10117,
                        "dead": 14502,
                        "vaccinated": 10998,
                        "hospitalized": 66,
                        "removed": 9876
                    },
                    {
                        "day": 47,
                        "susceptible": 471320,
                        "infectious": 10486,
                        "dead": 15085,
                        "vaccinated": 11232,
                        "hospitalized": 72,
                        "removed": 10385
                    },
                    {
                        "day": 48,
                        "susceptible": 469838,
                        "infectious": 10805,
                        "dead": 15685,
                        "vaccinated": 11466,
                        "hospitalized": 73,
                        "removed": 10948
                    },
                    {
                        "day": 49,
                        "susceptible": 468301,
                        "infectious": 11109,
                        "dead": 16373,
                        "vaccinated": 11700,
                        "hospitalized": 75,
                        "removed": 11493
                    },
                    {
                        "day": 50,
                        "susceptible": 466705,
                        "infectious": 11474,
                        "dead": 17004,
                        "vaccinated": 11934,
                        "hospitalized": 67,
                        "removed": 12093
                    },
                    {
                        "day": 51,
                        "susceptible": 465147,
                        "infectious": 11692,
                        "dead": 17714,
                        "vaccinated": 12168,
                        "hospitalized": 70,
                        "removed": 12723
                    },
                    {
                        "day": 52,
                        "susceptible": 463508,
                        "infectious": 12037,
                        "dead": 18329,
                        "vaccinated": 12402,
                        "hospitalized": 81,
                        "removed": 13402
                    },
                    {
                        "day": 53,
                        "susceptible": 461864,
                        "infectious": 12069,
                        "dead": 19307,
                        "vaccinated": 12636,
                        "hospitalized": 71,
                        "removed": 14036
                    },
                    {
                        "day": 54,
                        "susceptible": 460291,
                        "infectious": 12276,
                        "dead": 19968,
                        "vaccinated": 12870,
                        "hospitalized": 81,
                        "removed": 14741
                    },
                    {
                        "day": 55,
                        "susceptible": 458629,
                        "infectious": 12461,
                        "dead": 20758,
                        "vaccinated": 13104,
                        "hospitalized": 77,
                        "removed": 15428
                    },
                    {
                        "day": 56,
                        "susceptible": 456997,
                        "infectious": 12614,
                        "dead": 21498,
                        "vaccinated": 13338,
                        "hospitalized": 83,
                        "removed": 16167
                    },
                    {
                        "day": 57,
                        "susceptible": 455343,
                        "infectious": 12716,
                        "dead": 22285,
                        "vaccinated": 13572,
                        "hospitalized": 80,
                        "removed": 16932
                    },
                    {
                        "day": 58,
                        "susceptible": 453679,
                        "infectious": 12691,
                        "dead": 23233,
                        "vaccinated": 13806,
                        "hospitalized": 82,
                        "removed": 17673
                    },
                    {
                        "day": 59,
                        "susceptible": 452044,
                        "infectious": 13027,
                        "dead": 23822,
                        "vaccinated": 14040,
                        "hospitalized": 93,
                        "removed": 18383
                    },
                    {
                        "day": 60,
                        "susceptible": 450407,
                        "infectious": 13177,
                        "dead": 24555,
                        "vaccinated": 14274,
                        "hospitalized": 92,
                        "removed": 19137
                    },
                    {
                        "day": 61,
                        "susceptible": 448700,
                        "infectious": 13428,
                        "dead": 25175,
                        "vaccinated": 14508,
                        "hospitalized": 86,
                        "removed": 19973
                    },
                    {
                        "day": 62,
                        "susceptible": 446951,
                        "infectious": 13689,
                        "dead": 25852,
                        "vaccinated": 14742,
                        "hospitalized": 92,
                        "removed": 20784
                    },
                    {
                        "day": 63,
                        "susceptible": 445144,
                        "infectious": 13939,
                        "dead": 26534,
                        "vaccinated": 14976,
                        "hospitalized": 108,
                        "removed": 21659
                    },
                    {
                        "day": 64,
                        "susceptible": 443238,
                        "infectious": 12923,
                        "dead": 28556,
                        "vaccinated": 15210,
                        "hospitalized": 71,
                        "removed": 22559
                    },
                    {
                        "day": 65,
                        "susceptible": 441636,
                        "infectious": 13022,
                        "dead": 29230,
                        "vaccinated": 15444,
                        "hospitalized": 79,
                        "removed": 23388
                    },
                    {
                        "day": 66,
                        "susceptible": 440051,
                        "infectious": 12962,
                        "dead": 30060,
                        "vaccinated": 15678,
                        "hospitalized": 71,
                        "removed": 24203
                    },
                    {
                        "day": 67,
                        "susceptible": 438458,
                        "infectious": 12730,
                        "dead": 31119,
                        "vaccinated": 15912,
                        "hospitalized": 69,
                        "removed": 24969
                    },
                    {
                        "day": 68,
                        "susceptible": 436858,
                        "infectious": 12763,
                        "dead": 31849,
                        "vaccinated": 16146,
                        "hospitalized": 62,
                        "removed": 25806
                    },
                    {
                        "day": 69,
                        "susceptible": 435285,
                        "infectious": 12890,
                        "dead": 32471,
                        "vaccinated": 16380,
                        "hospitalized": 76,
                        "removed": 26630
                    },
                    {
                        "day": 70,
                        "susceptible": 433692,
                        "infectious": 12837,
                        "dead": 33296,
                        "vaccinated": 16614,
                        "hospitalized": 59,
                        "removed": 27451
                    },
                    {
                        "day": 71,
                        "susceptible": 432010,
                        "infectious": 13175,
                        "dead": 33847,
                        "vaccinated": 16848,
                        "hospitalized": 65,
                        "removed": 28244
                    },
                    {
                        "day": 72,
                        "susceptible": 430430,
                        "infectious": 13081,
                        "dead": 34670,
                        "vaccinated": 17082,
                        "hospitalized": 63,
                        "removed": 29095
                    },
                    {
                        "day": 73,
                        "susceptible": 428807,
                        "infectious": 13225,
                        "dead": 35297,
                        "vaccinated": 17316,
                        "hospitalized": 69,
                        "removed": 29947
                    },
                    {
                        "day": 74,
                        "susceptible": 427139,
                        "infectious": 12909,
                        "dead": 36402,
                        "vaccinated": 17550,
                        "hospitalized": 53,
                        "removed": 30826
                    },
                    {
                        "day": 75,
                        "susceptible": 425593,
                        "infectious": 12871,
                        "dead": 37095,
                        "vaccinated": 17784,
                        "hospitalized": 67,
                        "removed": 31717
                    },
                    {
                        "day": 76,
                        "susceptible": 423975,
                        "infectious": 12940,
                        "dead": 37821,
                        "vaccinated": 18018,
                        "hospitalized": 78,
                        "removed": 32540
                    }
                ]
            
            setPopulationData(data)
            setHealthAuthorityData(data)

            setJobLoading(false)
            setConfigLoading(false)
            setHealthAuthorityDataLoading(false)
            setPopulationDataLoading(false)

        }, 2000)

        /*updatePopulationData(0, "custom")
        updateHealthAuthorityData(0, 0, "custom")
        updateHomeCommunityData(0, 1, "custom")

        updateJob()*/

    }, [id, authToken])

    const navigate = useNavigate()

    const onOpenConfigClick = () => {
        /*if (configLoading || !config) return
        setConfigEditMode(false)
        navigate("/configurations/" + config.id)*/
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
        
        array.sort((a, b) => {
            if (a.num_sim !== b.num_sim) {
                return a.num_sim - b.num_sim
            } else {
                return a.num_day - b.num_day
            }
        })

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

        array.sort((a, b) => {
            if (a.num_sim !== b.num_sim) {
                return a.num_sim - b.num_sim
            } else if (a.health_authority_id !== b.health_authority_id) {
                return a.health_authority_id - b.health_authority_id
            } else {
                return a.num_day - b.num_day
            }
        })

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
        return
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
        return
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
        return
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
            {false && <button className="sim-share-button" onClick={onAllowEditClick}>Allow Edit</button>}
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