import Table from "./Table"
import Form from "./Form"
import ActivityLog from "./ActivityLog"
import SharedList from "./SharedList"
import { Button } from "./ui"

import { useState, useEffect } from "react"

function LinkContainer({ user }){
    const [favLinks, setFavLinks] = useState([])
    const [showShared, setShowShared] = useState(false)
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
            <div className="mb-3 mt-4 w-full">
                <Button onClick={() => setShowShared(!showShared)} className="bg-slate-700 w-full sm:w-auto">{showShared ? 'Hide' : 'View'} Shared Links</Button>
            </div>
            {showShared && <SharedList />}
            <h2 className="text-lg font-semibold mt-4">My Favorite Links</h2>
            <p className="text-sm text-slate-400">Add a new link with a name and URL to the table.</p>
            {user && user.isAdmin && <ActivityLog />}
            <div className="mt-4"> <Table data={favLinks} removeLink={handleRemove} /> </div>
            <h3 className="mt-6 text-md font-medium">Add New</h3>
            <div className="mt-2"><Form submitNewLink={handleSubmit}/></div>
        </div>
    )

}

export default LinkContainer