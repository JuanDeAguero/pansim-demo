import { useAuth } from "./auth"
import { useNavigate } from "react-router-dom"

const useApi = () => {

    const { authToken, logout } = useAuth()
    const navigate = useNavigate()

    const get = async (url, authToken, params) => {
        try {
            let fullUrl = process.env.REACT_APP_DJANGO_SERVER_URL + url
            if (params) fullUrl = fullUrl + "?" + new URLSearchParams(params).toString()
            const response = await fetch(fullUrl, {
                method: "GET",
                headers: { "Authorization": `Bearer ${authToken}` }
            })
            const data = await response.json()
            if (response.ok) return data
            else if (response.status === 401) {
                navigate("/")
                logout()
                throw new Error("Unauthorized request")
            }
            else throw new Error(data.error)
        }
        catch(error) {
            throw error
        }
    }

    return { get };
};

const get = async (url, authToken, params) => {
    try {
        let fullUrl = process.env.REACT_APP_DJANGO_SERVER_URL + url
        if (params) fullUrl = fullUrl + "?" + new URLSearchParams(params).toString()
        const response = await fetch(fullUrl, {
            method: "GET",
            headers: { "Authorization": `Bearer ${authToken}` }
        })
        const data = await response.json()
        if (response.ok) return data
        else if (response.status === 401) {
            throw new Error("Unauthorized request")
        }
        else throw new Error(data.error)
    }
    catch(error) {
        throw error
    }
}

const post = async (url, authToken, formData) => {
    try {
        const response = await fetch(process.env.REACT_APP_DJANGO_SERVER_URL + url, {
            method: "POST",
            headers: authToken ? { "Authorization": `Bearer ${authToken}` } : {},
            body: formData
        })
        const data = await response.json()
        if (response.ok) return data
        else throw new Error(data.error)
    } catch (error) {
        throw error
    }
}

const del = async (url, authToken) => {
    try {
        const response = await fetch(process.env.REACT_APP_DJANGO_SERVER_URL + url, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${authToken}` }
        })
        if (response.ok) return { message: "Deleted successfully" }
        else throw new Error("Error deleting")
    } catch (error) {
        throw error
    }
}

const update = async (url, authToken, formData) => {
    try {
        const response = await fetch(process.env.REACT_APP_DJANGO_SERVER_URL + url, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${authToken}` },
            body: formData
        })
        const data = await response.json()
        if (response.ok) return data
        else throw new Error(data.error)
    } catch (error) {
        throw error
    }
}

export { get, post, del, update, useApi }