import "./styles/dashboard.css"
import { get } from "./requests"
import { Page } from "./page"
import { PageTitle } from "./page"
import { percentages } from "./simulations"
import { Table } from "./table"
import { TableElement } from "./table"
import { TableRow } from "./table"
import { useAuth } from "./auth"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const SimulationInProgress = ({ job }) => {

    const navigate = useNavigate()

    return(
    <button className="dash-in-progress-sim"
      onClick={() => navigate("simulation/" + String(job.id))}>
      <div className="dash-in-progress-name">{job.name}</div>
      <div className="dash-in-progress-status">Status: {job.status}</div>
      <div className="dash-in-progress-time">Estimated time: ...</div>
      <div className="dash-in-progress-bar">
        <div className="dash-in-progress-bar-content" style={{ width: percentages[job.status] }} />
      </div>
    </button>
    )
}

const SimulationCompleted = ({ job }) => {

    const navigate = useNavigate()
    const { authToken } = useAuth()

    return(
    <TableRow>
      <TableElement>
        <div className="dash-sim-name-wrapper">
          <div>{job.name}</div>
          <div className="dash-sim-name-instances">{job.number_of_simulations} instances</div>
        </div>
      </TableElement>
      <TableElement>
        <div className="dash-sim-date">{job.end_time && job.end_time.slice(0, 10)}</div>
      </TableElement>
      <TableElement>
        <div className="dash-sim-view">
          <button className="dash-sim-view-button"
            onClick={() => navigate("simulation/" + String(job.id))}>
            View
          </button>
        </div>
      </TableElement>
    </TableRow>
    )
}

const SimulationShared = ({ job }) => {

    const navigate = useNavigate()
    const { authToken } = useAuth()

    return(
    <TableRow>
      <TableElement>
        <div className="dash-sim-name-wrapper">
          <div>{job.name}</div>
          <div className="dash-sim-name-instances">{job.number_of_simulations} instances</div>
        </div>
      </TableElement>
      <TableElement>
        <div className="dash-sim-date">{job.start_time && job.start_time.slice(0, 10)}</div>
      </TableElement>
      <TableElement>
        <div className="dash-sim-owner">
          <span className="dash-sim-owner-icon material-symbols-outlined">account_circle</span>
        </div>
      </TableElement>
      <TableElement>
        <div className="dash-sim-view">
          <button className="dash-sim-view-button"
            onClick={() => navigate("simulation/" + String(job.id))}>
            View
          </button>
        </div>
      </TableElement>
    </TableRow>
    )
}

const SimulationInProgressLoading = () => {
    return <div className="dash-in-progress-sim-loading" />
}

const LoadingRow = ({ className, count }) => {
    return (
    <TableRow hideDivider={true}>{Array.from({ length: count }, (_, index) => (
      <TableElement key={index}>
        <div className={className} />
      </TableElement>
    ))}
    </TableRow>
    )
}

const ViewAll = ({ shared }) => {

    const navigate = useNavigate()

    return(
    <button className="dash-view-all" onClick={() => navigate(shared ? "shared" : "simulations")}>
      <div className="dash-view-all-text">View all</div>
      <span className="dash-view-all-icon material-symbols-outlined">arrow_forward</span>
    </button>
    )
}

const Dashboard = ({ minimized, setMinimized }) => {

    const [jobsInProgress, setJobsInProgress] = useState([])
    const [jobsCompleted, setJobsCompleted] = useState([])
    const [jobsShared, setJobsShared] = useState([])
    const [jobsInProgressLoading, setJobsInProgressLoading] = useState(true)
    const [jobsCompletedLoading, setJobsCompletedLoading] = useState(true)
    const [jobsSharedLoading, setJobsSharedLoading] = useState(true)

    const navigate = useNavigate()

    const { authToken } = useAuth()

    useEffect(() => {
        const fetchJobs = async (statuses, shared) => {
            return []
            setJobsInProgressLoading(true)
            setJobsCompletedLoading(true)
            setJobsSharedLoading(true)
            let results = []
            try {
                const job1 = await get("job/", authToken, {
                    "statuses": statuses,
                    "shared": shared ? "1" : "0"
                }).catch(() => {})
                const totalCount = job1.count
                if (totalCount <= 5) {
                    results = job1.results.reverse()
                } else if (totalCount > 5) {
                    const lastPage = Math.ceil(totalCount / 5)
                    const penultimatePage = lastPage - 1
                    const job2 = await get("job/", authToken, {
                        "page": penultimatePage,
                        "statuses": statuses,
                        "shared": shared ? "1" : "0"
                    }).catch(() => {})
                    const job3 = await get("job/", authToken, {
                        "page": lastPage,
                        "statuses": statuses,
                        "shared": shared ? "1" : "0"
                    }).catch(() => {})
                    results = [...job2.results, ...job3.results].reverse()
                }
            } catch (error) {
                setJobsInProgressLoading(false)
                setJobsCompletedLoading(false)
                setJobsSharedLoading(false)
                return
            }
            results = results.slice(0, 5)
            return results
        }
        fetchJobs("NOT_QUEUED,QUEUED,SUBMITTED,PENDING,RUNNABLE,STARTING,RUNNING", false).then((results) => {
            setJobsInProgress(results)
            //setJobsInProgressLoading(false)
        })
        fetchJobs("FINISHED,SUCCEEDED,FAILED", false).then((results) => {
            setJobsCompleted(results)
            //setJobsCompletedLoading(false)
        })
        fetchJobs("NOT_QUEUED,QUEUED,FINISHED,SUBMITTED,PENDING,RUNNABLE,STARTING,RUNNING,SUCCEEDED,FAILED", true).then((results) => {
            setJobsShared(results)
            //setJobsSharedLoading(false)
        })

        setTimeout(() => {
            const inProgress = [
                {
                    name: "Demo job 1",
                    status: "SUBMITTED"
                },
                {
                    name: "Demo job 2",
                    status: "RUNNING"
                }
            ]
            setJobsInProgress(inProgress)

            const completed = [
                {
                    name: "Demo job 3",
                    status: "SUCCEEDED",
                    number_of_simulations: 3,
                    end_time: "2024-10-12T20:53:30.45"
                },
                {
                    name: "Demo job 4",
                    status: "SUCCEEDED",
                    number_of_simulations: 10,
                    end_time: "2024-10-12T20:53:30.45"
                },
                {
                    name: "Demo job 5",
                    status: "FAILED",
                    number_of_simulations: 5,
                    end_time: "2024-10-12T20:53:30.45"
                }
            ]
            setJobsCompleted(completed)

            const shared = [
                {
                    name: "Demo job 6",
                    status: "SUCCEEDED",
                    number_of_simulations: 7,
                    start_time: "2024-10-12T20:53:30.45"
                }
            ]
            setJobsShared(shared)

            setJobsInProgressLoading(false)
            setJobsCompletedLoading(false)
            setJobsSharedLoading(false)
        }, 2000)
    }, [authToken])

    const filterInProgress = (job) => {
        return true
    }

    const filterCompleted = (job) => {
        return true
    }

    const filterShared = (job) => {
        return true
    }

    return(
    <Page minimized={minimized}>
      <PageTitle name={"Dashboard"} minimized={minimized} setMinimized={setMinimized} />
      <div className="dash-row-1">
        <button className="dash-new-sim" onClick={() => navigate("/new-simulation")}>
          <span className="dash-new-sim-icon material-symbols-outlined">add_circle</span>
          <div className="dash-new-sim-text">Create New Simulation</div>
        </button>
        <div className="dash-in-progress">
          <ViewAll />
          <div className="dash-in-progress-title">Simulations In Progress</div>
          <div className="dash-in-progress-sims">
            {jobsInProgressLoading ?
            Array.from({ length: 3 }).map((_, index) => (
              <SimulationInProgressLoading key={index} />
            )) :
            jobsInProgress && jobsInProgress.filter(filterInProgress).map(job => <SimulationInProgress job={job} />)}
          </div>
          {(!jobsInProgressLoading && jobsInProgress && jobsInProgress.length == 0) &&
            <div className="dash-empty-message dash-empty-message-in-progress">
              There are no simulations in progress.
            </div>}
        </div>
      </div>
      <div className="dash-row-2">
        <div className="dash-completed">
          <ViewAll />
          <div className="dash-completed-title">Simulations Completed</div>
          <div className="dash-completed-table">
            <Table columns={[
              { name: "NAME",          width: "45%" },
              { name: "DATE FINISHED", width: "40%" },
              { name: "",              width: "15%" }
            ]}>
              {jobsCompletedLoading ?
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={3} key={index} />
              )) :
              jobsCompleted && jobsCompleted.filter(filterCompleted).map(job => <SimulationCompleted job={job} />)}
            </Table>
          </div>
          {(!jobsCompletedLoading && jobsCompleted && jobsCompleted.length == 0) &&
            <div className="dash-empty-message">There are no simulations completed.</div>}
        </div>
        <div className="dash-shared">
          <ViewAll shared={true}/>
          <div className="dash-shared-title">Shared With Me</div>
          <div className="dash-shared-table">
            <Table columns={[
              { name: "NAME",          width: "32%" },
              { name: "DATE STARTED",  width: "34%" },
              { name: "OWNER",         width: "19%" },
              { name: "",              width: "15%" }
            ]}>
              {jobsSharedLoading ?
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={4} key={index} />
              )) :
              jobsShared && jobsShared.filter(filterShared).map(job => <SimulationShared job={job} />)}
            </Table>
          </div>
          {(!jobsSharedLoading && jobsShared && jobsShared.length == 0) &&
            <div className="dash-empty-message">There are no simulations shared.</div>}
        </div>
      </div>
    </Page>
    )
}

export { Dashboard, LoadingRow }