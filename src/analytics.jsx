import "./styles/analytics.css"
import { Page } from "./page"
import { PageTitle } from "./page"

const Analytics = ({ minimized, setMinimized }) => {
    return(
    <Page minimized={minimized}>
      <PageTitle name={"Analytics"} minimized={minimized} setMinimized={setMinimized} />
      <div className="not-available">The analytics feature are not yet available in the current version of PanSim.</div>
    </Page>
    )
}

export default Analytics