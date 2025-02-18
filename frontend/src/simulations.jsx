import "./styles/simulations.css"
import { get } from "./requests"
import { LoadingRow } from "./dashboard"
import { Page } from "./page"
import { PageTitle } from "./page"
import { PulseLoader } from "react-spinners"
import { Table } from "./table"
import { TableElement } from "./table"
import { TableRow } from "./table"
import { truncate } from "./dashboard"
import { useAuth } from "./auth"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const statusColors = {
    "QUEUED": "rgb(190, 190, 190)",
    "FAILED": "rgb(255, 142, 142)",
    "SUCCEEDED": "rgb(127, 205, 127)"
}

const percentages = {
    "SUBMITTED": "5%",
    "PENDING": "5%",
    "RUNNABLE": "10%",
    "STARTING": "20%",
    "RUNNING": "60%",
    "SUCCEEDED": "100%",
    "FAILED": "100%"
}

const SimulationInProgress = ({ job }) => {

    const navigate = useNavigate()

    return(
    <TableRow>
      <TableElement>
        <div className="sims-sim-name-wrapper">
          <div>{job.name}</div>
          <div className="sims-sim-name-instances">{job.number_of_simulations} instances</div>
        </div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-date">{job.start_time && job.start_time.slice(0, 10)}</div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-status">
          <div className="sims-sim-status-badge"
            style={{ backgroundColor: statusColors[job.status] }}>{job.status}</div>
        </div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-progress">
          <div className="sims-sim-progress-bar">
            <div className="sims-sim-progress-bar-content" style={{ width: percentages[job.status] }} />
          </div>
          <div className="sims-sim-progress-time">Estimated time: ...</div>
        </div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-view">
          <button className="sims-sim-view-button"
            onClick={() => navigate("/simulation/" + String(job.id))}>
              View
          </button>
        </div>
      </TableElement>
    </TableRow>
    )
}

const SimulationCompleted = ({ job }) => {

    const navigate = useNavigate()

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return ""
        const dateObject = new Date(dateTimeString)
        const datePart = dateObject.toISOString().split("T")[0]
        const timePart = dateObject.toLocaleTimeString("en-US", { hour12: false })
        return `${datePart} ${timePart}`
    }

    const formattedEndTime = formatDateTime(job.end_time)

    return(
    <TableRow>
      <TableElement>
        <div className="sims-sim-name-wrapper">
          <div>{truncate(job.name, 20)}</div>
          <div className="sims-sim-name-instances">{job.number_of_simulations} instances</div>
        </div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-date">{formattedEndTime}</div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-date">
          <span className="material-symbols-outlined"
            style={{ color: job.status === "SUCCEEDED" ? "green" : "red" }}>
              {job.status === "SUCCEEDED" ? "check" : "close"}
          </span>
        </div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-view">
          <button className="sims-sim-view-button"
            onClick={() => navigate("/simulation/" + String(job.id))}>
              View
          </button>
        </div>
      </TableElement>
    </TableRow>
    )
}

const ChangePage = ({ extraStyle, currentPage, setCurrentPage, totalPages, loading }) => {

    const incrementPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1)
    }

    const decrementPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1)
    }

    return(
    <div className={`change-page ${extraStyle}`}>
      {loading && <PulseLoader className="change-page-loader" color="rgb(161, 183, 224)" />}
      <button className="change-page-button" onClick={decrementPage}
        style={{ visibility: loading ? "hidden" : "" }}>
        <span className="change-page-icon-left material-symbols-outlined">arrow_back_ios</span>
      </button>
      <div className="change-page-text" style={{ visibility: loading ? "hidden" : "" }}>
        {currentPage}/{totalPages === 0 ? "1" : totalPages}
      </div>
      <button className="change-page-button" onClick={incrementPage}
        style={{ visibility: loading ? "hidden" : "" }}>
        <span className="change-page-icon-right material-symbols-outlined">arrow_forward_ios</span>
      </button>
    </div>
    )
}

const Simulations = ({ minimized, setMinimized }) => {

    const [jobsInProgress, setJobsInProgress] = useState([])
    const [jobsCompleted, setJobsCompleted] = useState([])
    const [jobsSearch, setJobsSearch] = useState([])

    const [currentInProgressPage, setCurrentInProgressPage] = useState(1)
    const [totalInProgressSimulations, setTotalInProgressSimulations] = useState(0)
    const [inProgressLoading, setInProgressLoading] = useState(true)
    const [currentCompletedPage, setCurrentCompletedPage] = useState(1)
    const [totalCompletedSimulations, setTotalCompletedSimulations] = useState(0)
    const [completedLoading, setCompletedLoading] = useState(true)
    const [currentSearchPage, setCurrentSearchPage] = useState(1)
    const [totalSearchSimulations, setTotalSearchSimulations] = useState(0)
    const [searchLoading, setSearchLoading] = useState(true)

    const { authToken } = useAuth()

    useEffect(() => {

        setTimeout(() => {
            const inProgress = [
                {
                    id: 1,
                    name: "Demo job 1",
                    status: "SUBMITTED",
                    start_time: "2024-10-12T20:53:30.45",
                    number_of_simulations: 3
                },
                {
                    id: 1,
                    name: "Demo job 2",
                    status: "RUNNING",
                    start_time: "2024-10-12T20:53:30.45",
                    number_of_simulations: 2
                }
            ]
            setJobsInProgress(inProgress)

            const completed = [
                {
                    id: 1,
                    name: "Demo job 3",
                    status: "SUCCEEDED",
                    number_of_simulations: 3,
                    end_time: "2024-10-12T20:53:30.45"
                },
                {
                    id: 1,
                    name: "Demo job 4",
                    status: "SUCCEEDED",
                    number_of_simulations: 10,
                    end_time: "2024-10-12T20:53:30.45"
                },
                {
                    id: 1,
                    name: "Demo job 5",
                    status: "FAILED",
                    number_of_simulations: 5,
                    end_time: "2024-10-12T20:53:30.45"
                }
            ]
            setJobsCompleted(completed)

            setInProgressLoading(false)
            setCompletedLoading(false)

            setTotalCompletedSimulations(6)
        }, 2000)

    }, [])

    useEffect(() => {

        setCompletedLoading(true)

        setTimeout(() => {

            if (currentCompletedPage == 1) {
                const completed = [
                    {
                        id: 1,
                        name: "Demo job 3",
                        status: "SUCCEEDED",
                        number_of_simulations: 3,
                        end_time: "2024-10-12T20:53:30.45"
                    },
                    {
                        id: 1,
                        name: "Demo job 4",
                        status: "SUCCEEDED",
                        number_of_simulations: 10,
                        end_time: "2024-10-12T20:53:30.45"
                    },
                    {
                        id: 1,
                        name: "Demo job 5",
                        status: "FAILED",
                        number_of_simulations: 5,
                        end_time: "2024-10-12T20:53:30.45"
                    },
                    {
                        id: 1,
                        name: "Demo job",
                        status: "FAILED",
                        number_of_simulations: 5,
                        end_time: "2024-10-12T20:53:30.45"
                    }
                ]
                setJobsCompleted(completed)
                setCompletedLoading(false)
            } else {
                const completed = [
                    {
                        id: 1,
                        name: "Demo job 7",
                        status: "SUCCEEDED",
                        number_of_simulations: 5,
                        end_time: "2024-10-12T20:53:30.45"
                    }
                ]
                setJobsCompleted(completed)
                setCompletedLoading(false)
            }
        }, 2000)

        /*setInProgressLoading(true)
        setJobsInProgress([])
        const params = {
            "page": currentInProgressPage,
            "statuses": "NOT_QUEUED,QUEUED,SUBMITTED,PENDING,RUNNABLE,STARTING,RUNNING",
            "shared": 0
        }
        get("job/", authToken, params).then((data) => {
            setJobsInProgress(data.results)
            setTotalInProgressSimulations(data.count)
            setInProgressLoading(false)
        })*/
    }, [currentCompletedPage])


    /*useEffect(() => {
        setCompletedLoading(true)
        setJobsCompleted([])
        const params = {
            "page": currentCompletedPage,
            "statuses": "FINISHED,SUCCEEDED,FAILED",
            "shared": 0
        }
        get("job/", authToken, params).then((data) => {
            setJobsCompleted(data.results)
            setTotalCompletedSimulations(data.count)
            setCompletedLoading(false)
        })
    }, [authToken, currentCompletedPage])*/

    const [searched, setSearched] = useState(false)

    const search = () => {
        /*setSearchLoading(true)
        setJobsSearch([])
        const params = {
            "page": currentSearchPage,
            "statuses": "FINISHED,SUCCEEDED,FAILED",
            "shared": 0
        }
        get("job/", authToken, params).then((data) => {
            setJobsSearch(data.results)
            setTotalSearchSimulations(data.count)
            setSearchLoading(false)
        })*/
    }

    const onSearchClick = () => {
        //setSearched(true)
        //search()
    }

    return(
    <Page minimized={minimized}>
      <PageTitle name={"My Simulations"} minimized={minimized} setMinimized={setMinimized} />
      <div className="sims-search">
        <input className="sims-search-input" placeholder="Search" />
        <button className="sims-search-button" onClick={onSearchClick}>
          <span className="sims-search-icon material-symbols-outlined">search</span>
        </button>
      </div>
      {!searched && <div className="sims-in-progress">
        <div className="sims-in-progress-title">In Progress</div>
        <ChangePage extraStyle={"sims-change-page"} currentPage={currentInProgressPage}
          setCurrentPage={setCurrentInProgressPage}
          totalPages={Math.ceil(totalInProgressSimulations / 5)} loading={inProgressLoading} />
        <div className="sims-in-progress-table">
          <Table columns={[
            { name: "NAME",          width: "23%" },
            { name: "DATE STARTED",  width: "23%" },
            { name: "STAUS",         width: "23%" },
            { name: "PROGRESS",      width: "23%" },
            { name: "",              width: "8%" }
          ]}>
            {inProgressLoading ?
              Array.from({ length: 3 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={5} key={index} />
              )) : jobsInProgress.map(job => <SimulationInProgress job={job} />)}
          </Table>
        </div>
        {(!inProgressLoading && jobsInProgress.length == 0) &&
          <div className="dash-empty-message">There are no simulations in progress.</div>}
      </div>}
      {!searched && <div className="sims-completed">
        <div className="sims-completed-title">Completed</div>
        <ChangePage extraStyle={"sims-change-page"} currentPage={currentCompletedPage}
          setCurrentPage={setCurrentCompletedPage}
          totalPages={Math.ceil(totalCompletedSimulations / 5)} loading={completedLoading} />
        <div className="sims-completed-table">
          <Table columns={[
            { name: "NAME",          width: "30%" },
            { name: "DATE FINISHED", width: "40%" },
            { name: "STATUS",        width: "20%" },
            { name: "",              width: "10%" }
          ]}>
            {completedLoading ?
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={4} key={index} />
              )) : jobsCompleted.map(job => <SimulationCompleted job={job} />)}
          </Table>
        </div>
        {(!completedLoading && jobsCompleted.length == 0) &&
          <div className="dash-empty-message">There are no simulations completed.</div>}
      </div>}
      {searched && <div className="sims-completed">
        <div className="sims-completed-title">Search</div>
        <ChangePage extraStyle={"sims-change-page"} currentPage={currentSearchPage}
          setCurrentPage={setCurrentSearchPage}
          totalPages={Math.ceil(totalSearchSimulations / 5)} loading={searchLoading} />
        <div className="sims-completed-table">
          <Table columns={[
            { name: "NAME",          width: "30%" },
            { name: "DATE FINISHED", width: "40%" },
            { name: "STATUS",        width: "20%" },
            { name: "",              width: "10%" }
          ]}>
            {searchLoading ?
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={4} key={index} />
              )) :
              jobsSearch.map(job => <SimulationCompleted job={job} />)}
          </Table>
        </div>
        {(!searchLoading && jobsSearch.length == 0) &&
          <div className="dash-empty-message">There are no simulations with that name.</div>}
      </div>}
    </Page>
    )
}

export { Simulations, ChangePage, statusColors, percentages }