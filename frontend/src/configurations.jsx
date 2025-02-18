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
import { truncate } from "./dashboard"
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
        <div className="configs-config-name">{!deleting ? truncate(config.scenario_name, 22) : "Deleting..."}</div>
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

const Template = ({  }) => {

    return(
    <TableRow>
      <TableElement>
        <div className="configs-config-name">template 1</div>
      </TableElement>
      <TableElement>
        <div className="configs-config-name"></div>
      </TableElement>
      <TableElement>
        <div className="dash-sim-view">
          <button className="dash-sim-view-button"
            onClick={() => {}}>
            Add
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
            data.results.reverse()
            setConfigurations(data.results)
            setConfigsLoading(false)
        }).catch((error) => {
            console.log(error)
            setCurrentConfigPage(1)
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
      {false ? <div className="configs-my">
        <div className="configs-my-title">Templates</div>
        <ChangePage extraStyle={"configs-change-page"} currentPage={currentConfigPage}
          setCurrentPage={setCurrentConfigPage} totalPages={Math.ceil(totalConfigs / 5)}
          loading={configsLoading} />
        <div className="configs-my-table">
          <Table columns={[
            { name: "SCENARIO NAME", width: "30%" },
            { name: "DESCRIPTION",  width: "55%" },
            { name: "",  width: "15%" }
          ]}>
            {configsLoading ?
              Array.from({ length: 5 }).map((_, index) => (
                <LoadingRow className="dash-sim-loading" count={3} key={index} />
              )) :
              configurations.map(config => <Template />)}
          </Table>
        </div>
        {(!configsLoading && configurations.length == 0) &&
          <div className="dash-empty-message">There are no configurations.</div>}
      </div> : null}
    </Page>
    )
}

export default Configurations