import Table from "./Table"
import Form from "./Form"
import ActivityLog from "./ActivityLog"
import SharedList from "./SharedList"
import { Button } from "./ui"
import { apiFetch, apiPost, apiDelete, handleUnauthorized } from "../api"

import { useState, useEffect } from "react"

function LinkContainer({ user }){
    const [favLinks, setFavLinks] = useState([])
    const [showShared, setShowShared] = useState(false)

    // Fetch links from database on component mount
    useEffect(() => {
        fetchLinks()
    }, [])

    const fetchLinks = async () => {
        try {
            const response = await apiFetch('/links')
            const data = await response.json()
            setFavLinks(data)
        } catch (error) {
            console.error("Error fetching links:", error)
        }
    }

    const handleRemove = async (id) => {
        try {
            const res = await apiDelete(`/links/${id}`)
            if (res.status === 401 || res.status === 403) {
                handleUnauthorized()
                return
            }
            setFavLinks(favLinks.filter(link => link.id !== id))
        } catch (error) {
            console.error("Error deleting link:", error)
        }
    }

    const handleSubmit = async (favLink) => {
        try {
            const response = await apiPost('/links', favLink)

            if (response.status === 401 || response.status === 403) {
                handleUnauthorized()
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