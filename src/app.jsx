import { AuthProvider } from "./auth"
import { BrowserRouter } from "react-router-dom"
import { Dashboard } from "./dashboard"
import { NewSimulation } from "./new_simulation"
import { Profile } from "./profile"
import { Route } from "react-router-dom"
import { Routes } from "react-router-dom"
import { Simulations } from "./simulations"
import { useAuth } from "./auth"
import { useState } from "react"
import Analytics from "./analytics"
import Configuration from "./configuration"
import Configurations from "./configurations"
import Login from "./login"
import Nav from "./nav"
import Shared from "./shared"
import Simulation from "./simulation"

const App = () => {
    return(
    <AuthProvider>
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </AuthProvider>
    )
}

const AuthenticatedApp = () => {

    const { isAuthenticated } = useAuth()

    const [configEditMode, setConfigEditMode] = useState(false)
    const [minimized, setMinimized] = useState(false)

    return(
    <>
      <div className="demo">This is a DEMO version of PanSim.</div>
      <Nav minimized={minimized} setMinimized={setMinimized} />
      <Routes>
        <Route path="/" element={<Dashboard minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/simulations" element={<Simulations minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/simulation/:id" element={<Simulation setConfigEditMode={setConfigEditMode} minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/shared" element={<Shared minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/analytics" element={<Analytics minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/configurations" element={<Configurations setConfigEditMode={setConfigEditMode} minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/configurations/:id" element={<Configuration configEditMode={configEditMode} setConfigEditMode={setConfigEditMode} minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/new-simulation" element={<NewSimulation minimized={minimized} setMinimized={setMinimized} />} />
        <Route path="/profile" element={<Profile minimized={minimized} setMinimized={setMinimized} />} />
      </Routes>
    </>
    )
}

export default App