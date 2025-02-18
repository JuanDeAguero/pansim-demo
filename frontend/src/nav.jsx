import "./styles/nav.css"
import { Link } from "react-router-dom"
import { useApi } from "./requests"
import { useAuth } from "./auth"
import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { useRef } from "react"
import { useState } from "react"

const Nav = ({ minimized, setMinimized }) => {

    const { get } = useApi()

    const dashboardBtn =      useRef(null)
    const simulationsBtn =    useRef(null)
    const sharedWithMeBtn =   useRef(null)
    const analyticsBtn =      useRef(null)
    const configurationsBtn = useRef(null)
    const newSimulationBtn =  useRef(null)
    const profileBtn =        useRef(null)

    const location = useLocation()

    const { authToken } = useAuth()
    const { logout } = useAuth()

    const navigate = useNavigate()

    useEffect(() => {

        if (window.innerWidth < 1000) {
            //setMinimized(true)
        }

        let buttonRoutePairs = [
            { button: dashboardBtn,      route: "/" },
            { button: simulationsBtn,    route: "/simulations" },
            { button: sharedWithMeBtn,   route: "/shared" },
            { button: analyticsBtn,      route: "/analytics" },
            { button: configurationsBtn, route: "/configurations" },
            { button: newSimulationBtn,  route: "/new-simulation" },
            { button: profileBtn,        route: "/profile" }
        ]

        buttonRoutePairs.forEach(({ button, route }) => {
            if (location.pathname === route) {
                button.current.classList.add("nav-selected")
            } else {
                button.current.classList.remove("nav-selected")
            }
        })
        
    }, [location, authToken, minimized])

    const onLogoutClick = () => {
        navigate("/")
        logout()
    }

    const onNavButtonClick = () => {
        if (window.innerWidth < 1000) {
            setMinimized(true)
        }
    }
    
    return(
    <div className={minimized ? "nav-minimized" : "nav"}>
      <button className="hamburger" onClick={() => setMinimized(!minimized)}>
        <span className="material-symbols-outlined">menu</span>
      </button>
      <button className={minimized ? "nav-close-minimized" : "nav-close"} onClick={() => setMinimized(true)}>
        <span className="material-symbols-outlined">close</span>
      </button>
      <div className="nav-title">{!minimized && "PanSim DEMO"}</div>
      <div className={minimized ? "nav-buttons-minimized" : "nav-buttons"}>
        <div>
          <Link className={minimized ? "nav-button-minimized" : "nav-button"} ref={dashboardBtn} to="/" onClick={onNavButtonClick}>
            <span className="nav-icon material-symbols-outlined">space_dashboard</span>
            {!minimized && <div>Dashboard</div>}
          </Link>
          <Link className={minimized ? "nav-button-minimized" : "nav-button"} ref={simulationsBtn} to="/simulations" onClick={onNavButtonClick}>
            <span className="nav-icon nav-icon-sims material-symbols-outlined">receipt_long</span>
            {!minimized && <div>My Simulations</div>}
          </Link>
          <Link className={minimized ? "nav-button-minimized" : "nav-button"} ref={sharedWithMeBtn} to="/shared" onClick={onNavButtonClick}>
            <span className="nav-icon material-symbols-outlined">group</span>
            {!minimized && <div>Shared With Me</div>}
          </Link>
          <Link className={minimized ? "nav-button-minimized" : "nav-button"} ref={analyticsBtn} to="/analytics" onClick={onNavButtonClick}>
            <span className="nav-icon material-symbols-outlined">bar_chart_4_bars</span>
            {!minimized && <div>Analytics</div>}
          </Link>
          <Link className={minimized ? "nav-button-minimized" : "nav-button"} ref={configurationsBtn} to="/configurations" onClick={onNavButtonClick}>
            <span className="nav-icon material-symbols-outlined">settings</span>
            {!minimized && <div>Configurations</div>}
          </Link>
          <Link className={minimized ? "nav-button-minimized" : "nav-button"} ref={newSimulationBtn} to="/new-simulation" onClick={onNavButtonClick}>
            <span className="nav-icon material-symbols-outlined">add_circle</span>
            {!minimized && <div>New Simulation</div>}
          </Link>
        </div>
        <div>
          <Link className={minimized ? "nav-button-minimized" : "nav-button"} ref={profileBtn} to="/profile" onClick={onNavButtonClick}>
            <span className="nav-icon material-symbols-outlined">person</span>
            {!minimized && <nav>Profile</nav>}
          </Link>
          <button className={minimized ? "nav-button-minimized nav-logout" : "nav-button nav-logout"} onClick={onLogoutClick}>
            <span className="nav-icon material-symbols-outlined">logout</span>
            {!minimized && <nav>Logout</nav>}
          </button>
        </div>
      </div>
    </div>
    )
}

export default Nav