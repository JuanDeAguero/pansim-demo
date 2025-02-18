import { createContext } from "react"
import { useContext} from "react"
import { useEffect } from "react"
import { useState } from "react"

const AuthContext = createContext(null)

const useAuth = () => useContext(AuthContext)

const AuthProvider = ({ children }) => {

    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authToken, setAuthToken] = useState(localStorage.getItem("token") || null)

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) setIsAuthenticated(true)
        else setIsAuthenticated(false)
    }, [])

    const login = (token) => {
        localStorage.setItem("token", token)
        setAuthToken(token)
        setIsAuthenticated(true)
    }

    const logout = () => {
        localStorage.removeItem("token")
        setAuthToken(null)
        setIsAuthenticated(false)
    }

    return (
    <AuthContext.Provider value={{ isAuthenticated, authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
    )
}

export { useAuth, AuthProvider }