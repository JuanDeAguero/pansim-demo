import "./styles/configurations.css"
import { ChangePage } from "./simulations"
import { del } from "./requests"
import { get } from "./requests"
import { LoadingRow } from "./dashboard"
import { Page } from "./page"
import { PageTitle } from "./page"
import { Table } from "./table"
import { TableElement } from "./table"
import { TableRow } from "./table"
import { useAuth } from "./auth"
import { useCallback } from "react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

const Config = ({ config, setConfigEditMode, updateConfigs, authToken }) => {

    const navigate = useNavigate()

    const [deleting, setDeleting] = useState(false)

    const onOpenClick = () => {
        setConfigEditMode(false)
        navigate("/configurations/" + String(config.id))
    }

    const onEditClick = () => {
        setConfigEditMode(true)
        navigate("/configurations/" + String(config.id))
    }
    
    const onDeleteClick = () => {
        setDeleting(true)
        del(`job-config/${config.id}`, authToken).then(() => {
            updateConfigs()
        }).catch(() => {
            updateConfigs()
            setDeleting(false)
        })
    }

    return(
    <TableRow>
      <TableElement>
        <div className="configs-config-name">{!deleting ? config.scenario_name : "Deleting..."}</div>
      </TableElement>
      <TableElement>
        <div className="configs-config-date">{config.created_at.slice(0, 10)}</div>
      </TableElement>
      <TableElement>
        <div className="configs-config-date">{config.last_updated.slice(0, 10)}</div>
      </TableElement>
      <TableElement>
        <div className="configs-config-action">
          <button className="configs-config-action-button" onClick={onOpenClick}>
            <span className="configs-config-icon material-symbols-outlined">open_in_new</span>
          </button>
          <button className="configs-config-action-button" onClick={onEditClick}>
            <span className="configs-config-icon material-symbols-outlined">border_color</span>
          </button>
          <button className="configs-config-action-button configs-config-delete"
            onClick={onDeleteClick}>
              <span className="configs-config-icon material-symbols-outlined">delete</span>
          </button>
        </div>
      </TableElement>
    </TableRow>
    )
}

const Configurations = ({ setConfigEditMode, minimized, setMinimized }) => {

    const [configurations, setConfigurations] = useState([])
    const [currentConfigPage, setCurrentConfigPage] = useState(1)
    const [totalConfigs, setTotalConfigs] = useState(0)
    const [configsLoading, setConfigsLoading] = useState(true)

    const { authToken } = useAuth()

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

    const navigate = useNavigate()

    return(
    <Page minimized={minimized}>
      <PageTitle name={"Configurations"} minimized={minimized} setMinimized={setMinimized}>
        <button className="configs-create" onClick={() => navigate("/new-simulation")}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </PageTitle>
      <div className="configs-my">
        <div className="configs-my-title">My Configurations</div>
        <ChangePage extraStyle={"configs-change-page"} currentPage={currentConfigPage}
          setCurrentPage={setCurrentConfigPage} totalPages={Math.ceil(totalConfigs / 5)}
          loading={configsLoading} />
        <div className="configs-my-table">
          <Table columns={[
            { name: "SCENARIO NAME", width: "30%" },
            { name: "DATE CREATED",  width: "23%" },
            { name: "LAST UPDATED",  width: "23%" },
            { name: "ACTION",        width: "24%" }
          ]}>
            {configsLoading ?
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={4} key={index} />
              )) :
              configurations.map(config => <Config config={config}
                setConfigEditMode={setConfigEditMode} updateConfigs={updateConfigs}
                authToken={authToken} />)}
          </Table>
        </div>
        {(!configsLoading && configurations.length == 0) &&
          <div className="dash-empty-message">There are no configurations.</div>}
      </div>
    </Page>
    )
}

export default Configurations