import "./styles/profile.css"
import { get } from "./requests"
import { Page } from "./page"
import { PageTitle } from "./page"
import { PulseLoader } from "react-spinners"
import { update } from "./requests"
import { useAuth } from "./auth"
import { useEffect } from "react"
import { useRef } from "react"
import { useState } from "react"

const userColors = {
    0: "rgb(235, 235, 235)",
    1: "rgb(255, 160, 0)",
    2: "rgb(255, 255, 0)",
    3: "rgb(0, 255, 128)",
    4: "rgb(0, 160, 255)",
    5: "rgb(160, 0, 255)",
    6: "rgb(255, 0, 128)",
    7: "rgb(0, 255, 255)",
    8: "rgb(255, 165, 0)",
    9: "rgb(255, 0, 64)"
}

const ColorButton = ({ number, colorNumber, setColorNumber }) => {

    const onColorClick = () => {
        setColorNumber(number)
    }

    return(
    <button className="profile-color" onClick={onColorClick} style={{ backgroundColor: userColors[number], transform: colorNumber === number ? "scale(110%)" : "" }} />
    )
}

const Profile = ({ minimized, setMinimized }) => {

    const { authToken } = useAuth()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const usernameRef = useRef(null)
    const emailRef = useRef(null)

    const [editMode, setEditMode] = useState(false)

    const [colorNumber, setColorNumber] = useState(0)

    const [loading, setLoading] = useState(true)

    const fetchUser = () => {
        setLoading(true)
        setName("")
        setEmail("")
        setColorNumber(0)
        get("users/profile", authToken).then((user) => {
            setName(user.username)
            setEmail(user.email)
            setColorNumber(user.color_id)
            if (usernameRef.current) usernameRef.current.value = user.username
            if (emailRef.current) emailRef.current.value = user.email
            setLoading(false)
        }).catch(() => {})
    }

    useEffect(() => {
        fetchUser()
    }, [editMode, usernameRef, emailRef])

    const onEditSaveClick = () => {

        if (loading) return

        if (!editMode) {
            setEditMode(true)
            return
        }

        setLoading(true)

        const formData = new FormData()
        formData.append("username", usernameRef.current.value)
        formData.append("email", emailRef.current.value)
        formData.append("color_id", colorNumber)

        update("users/profile/update", authToken, formData).then(() => {
            setName("")
            setEmail("")  
            setColorNumber(0)
            usernameRef.current.value = ""
            emailRef.current.value = ""
            setEditMode(false)
            fetchUser()
            setLoading(false)
        }).catch(() => {})
    }

    return(
    <Page minimized={minimized}>
      <PageTitle name={"Profile"} minimized={minimized} setMinimized={setMinimized} />
      <div className="profile">
        <button className={editMode ? "profile-save" : "profile-edit"} onClick={onEditSaveClick}>
          {!loading && <>
          <div>{editMode ? "Save" : "Edit"}</div>
          <span className="profile-edit-icon material-symbols-outlined">
            {editMode ? "check" : "border_color"}
          </span>
          </>}
          {loading && <PulseLoader className="custom-button-loader" color="white" />}
        </button>
        <div className="profile-picture" style={{ backgroundColor: userColors[colorNumber] }}>
          <div className="profile-picture-letter">{name.charAt(0).toUpperCase()}</div>
        </div>
        {!editMode && <div>
          <div className="profile-text">{name === "" ? "..." : name}</div>
          <div className="profile-text">{email === "" ? "..." : email}</div>
        </div>}
        {editMode && <div className="profile-inputs">
          <input className="profile-text-input" ref={usernameRef} type="text" placeholder="username" />
          <input className="profile-text-input" ref={emailRef} type="text" placeholder="email" />
        </div>}
        {editMode && <div className="profile-colors">
            <ColorButton number={1} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={2} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={3} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={4} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={5} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={6} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={7} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={8} colorNumber={colorNumber} setColorNumber={setColorNumber} />
            <ColorButton number={9} colorNumber={colorNumber} setColorNumber={setColorNumber} />
        </div>}
      </div>
    </Page>
    )
}

export { Profile, userColors }