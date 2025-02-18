import "./styles/shared.css"
import { ChangePage } from "./simulations"
import { get } from "./requests"
import { LoadingRow } from "./dashboard"
import { Page } from "./page"
import { PageTitle } from "./page"
import { Table } from "./table"
import { TableElement } from "./table"
import { TableRow } from "./table"
import { useAuth } from "./auth"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const SimulationShared = ({ job, jobsEditable }) => {

    const navigate = useNavigate()

    const isEditable = jobsEditable.some(editableJob => editableJob.id === job.id)

    return(
    <TableRow>
      <TableElement>
        <div className="sims-sim-name-wrapper">
          <div>{job.name}{isEditable ? " (editable)" : ""}</div>
          <div className="sims-sim-name-instances">{job.number_of_simulations} instances</div>
        </div>
      </TableElement>
      <TableElement>
        <div className="sims-sim-date">{job.start_time.slice(0, 10)}</div>
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

const Shared = ({ minimized, setMinimized }) => {

    const [currentPage, setCurrentPage] = useState(1)
    const [totalSimulations, setTotalSimulations] = useState(0)
    const [loading, setLoading] = useState(true)
    const [jobs, setJobs] = useState([])
    const [jobsEditable, setJobsEditable] = useState([])

    const { authToken } = useAuth()

    const updateJobs = async () => {

        setLoading(true)
        setJobs([])
        setJobsEditable([])

        let params = {
            "page": currentPage,
            "statuses": "NOT_QUEUED,QUEUED,FINISHED,SUBMITTED,PENDING,RUNNABLE,STARTING,RUNNING,SUCCEEDED,FAILED",
            "shared": 1
        }
        let data = await get("job/", authToken, params)
        setJobs(data.results)
        setTotalSimulations(data.count)

        params = {
            "page": currentPage,
            "statuses": "NOT_QUEUED,QUEUED,FINISHED,SUBMITTED,PENDING,RUNNABLE,STARTING,RUNNING,SUCCEEDED,FAILED",
            "shared": 2
        }
        data = await get("job/", authToken, params)
        setJobsEditable(data.results)

        setLoading(false)
    }

    useEffect(() => {
        //updateJobs()

        setTimeout(() => {
            const shared = [
                {
                    id: 1,
                    name: "Demo job 6",
                    status: "SUCCEEDED",
                    number_of_simulations: 7,
                    start_time: "2024-10-12T20:53:30.45"
                }
            ]
            setJobs(shared)

            setLoading(false)
        }, 2000)

    }, [authToken, currentPage])

    return(
    <Page minimized={minimized}>
      <PageTitle name={"Shared With Me"} minimized={minimized} setMinimized={setMinimized} />
      <div className="sims-completed">
        <div className="sims-completed-title">Simulations</div>
        <ChangePage extraStyle={"sims-change-page"} currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={Math.ceil(totalSimulations / 5)} loading={loading} />
        <div className="sims-completed-table">
          <Table columns={[
            { name: "NAME",         width: "30%" },
            { name: "DATE STARTED", width: "40%" },
            { name: "STATUS",       width: "20%" },
            { name: "",             width: "10%" }
          ]}>
            {loading ?
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={4} key={index} />
              )) : jobs.map(job => <SimulationShared job={job} jobsEditable={jobsEditable} />)}
          </Table>
        </div>
        {(!loading && jobs.length == 0) &&
          <div className="dash-empty-message">There are no simulations shared.</div>}
      </div>
    </Page>
    )
}

export default Shared