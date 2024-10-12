import "./styles/login.css"
import { Button } from "./new_simulation"
import { post } from "./requests"
import { useAuth } from "./auth"
import { useState } from "react"

const Login = () => {

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const { authToken } = useAuth()
    const { login } = useAuth()

    const onLoginClick = async () => {
        setError("")
        setLoading(true)
        const formData = new FormData()
        formData.append("username", username)
        formData.append("password", password)
        post("api/token/", authToken, formData).then((data) => {
            login(data.access)
            setLoading(false)
        }).catch(() => {
            setError("Error: Wrong credentials")
            setLoading(false)
        })
    }

    const [loggingIn, setLoggingIn] = useState(true)

    const onSignUpClick = () => {
        setError("")
        setLoading(true)
        setError("Error: Invalid access token")
        setLoading(false)
    }

    const onCreateAccountClick = () => {
        setLoggingIn(false)
        setError("")
    }

    const onCreateBackClick = () => {
        setLoggingIn(true)
        setError("")
    }

    return (
    <div className="login">
      <img className="login-background" src="login_background.webp" />
      <img className="morlab-logo" src="morlab_logo.png" />
      <img className="mie-logo" src="mie_uoft_logo.jpeg" />
      <div className="login-inputs">
        <div className="login-title">PanSim</div>
        {loggingIn && <>
          <input className="login-input" type="text" placeholder="Username" value={username}
            onChange={(event) => setUsername(event.target.value)} />
          <input className="login-input" type="password" placeholder="Password" value={password}
            onChange={(event) => setPassword(event.target.value)} />
          <Button onClick={onLoginClick} extraStyle="login-button" loading={loading}>
            <div>LOGIN</div>
          </Button>
          <button className="login-sign-up-button" onClick={onCreateAccountClick}>
            or create an account
          </button>
        </>}
        {!loggingIn && <>
          <button className="sign-up-back" onClick={onCreateBackClick}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <input className="login-input" type="text" placeholder="Username" value={username}
            onChange={(event) => setUsername(event.target.value)} />
          <input className="login-input" type="password" placeholder="Password" value={password}
            onChange={(event) => setPassword(event.target.value)} />
          <input className="login-input" type="password" placeholder="Repeat password" value={password}
            onChange={(event) => setPassword(event.target.value)} />
          <input className="login-input" type="text" placeholder="Email" value={password}
            onChange={(event) => setPassword(event.target.value)} />
          <input className="login-input" type="password" placeholder="Access token" value={password}
            onChange={(event) => setPassword(event.target.value)} />
          <Button onClick={onSignUpClick} extraStyle="login-button" loading={loading}>
            <div>SIGN UP</div>
          </Button>
        </>}
        {error !== "" && <div className="error-message-login">{error}</div>}
      </div>
    </div>
    )
}

export default Login