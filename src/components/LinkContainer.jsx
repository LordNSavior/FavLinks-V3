import Table from "./Table"
import Form from "./Form"
import ActivityLog from "./ActivityLog"

import { useState, useEffect } from "react"

function LinkContainer(){
    const [favLinks, setFavLinks] = useState([])
    const API_URL = "http://localhost:5000/links"

    // Fetch links from database on component mount
    useEffect(() => {
        fetchLinks()
    }, [])

    const fetchLinks = async () => {
        try {
            const token = localStorage.getItem('favlinks_token')
            const response = await fetch(API_URL, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            const data = await response.json()
            setFavLinks(data)
        } catch (error) {
            console.error("Error fetching links:", error)
        }
    }

    const handleRemove = async (id) => {
        try {
            const token = localStorage.getItem('favlinks_token')
            const res = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('favlinks_token')
                window.location.reload()
                return
            }
            setFavLinks(favLinks.filter(link => link.id !== id))
        } catch (error) {
            console.error("Error deleting link:", error)
        }
    }

    const handleSubmit = async (favLink) => {
        try {
            const token = localStorage.getItem('favlinks_token')
            const response = await fetch(API_URL, {
                method: "POST",
                headers: Object.assign({ "Content-Type": "application/json" }, token ? { Authorization: `Bearer ${token}` } : {}),
                body: JSON.stringify(favLink)
            })

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('favlinks_token')
                window.location.reload()
                return
            }
            const newLink = await response.json()
            setFavLinks([...favLinks, newLink])
        } catch (error) {
            console.error("Error adding link:", error)
        }
    }

    return(
        <div>
            <h1>My Favorite Links</h1>
            <p>Add a new link with a name and URL to the table! </p>
            <ActivityLog />
            <Table data={favLinks} removeLink={handleRemove}/>
            <h1>Add New</h1>
            <Form submitNewLink={handleSubmit}/>
        </div>
    )

}

export default LinkContainer