import { useEffect, useState } from "react"
import Table from "./Table"
import { apiFetch } from "../api"

function SharedList(){
    const [publicLinks, setPublicLinks] = useState([])

    useEffect(() => {
        fetchPublic()
    }, [])

    const fetchPublic = async () => {
        try {
            const res = await apiFetch('/links/public', { auth: false })
            const data = await res.json()
            setPublicLinks(data)
        } catch (err) {
            console.error('Error fetching public links', err)
        }
    }

    return (
        <div>
            <h2 className="text-lg font-semibold">Shared Public Links</h2>
            <p className="text-sm text-slate-400">Links shared by other users.</p>
            <Table data={publicLinks} showRemove={false} />
        </div>
    )
}

export default SharedList
