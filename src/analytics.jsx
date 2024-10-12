import "./styles/analytics.css"
import { Page } from "./page"
import { PageTitle } from "./page"

const Analytics = ({ minimized, setMinimized }) => {
    return(
    <Page minimized={minimized}>
      <PageTitle name={"Analytics"} minimized={minimized} setMinimized={setMinimized} />
    </Page>
    )
}

export default Analytics