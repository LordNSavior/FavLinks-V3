import { useEffect, useState } from "react"
import Table from "./Table"

function SharedList(){
    const [publicLinks, setPublicLinks] = useState([])
    const API_URL = "http://localhost:5000/links/public"

    useEffect(() => {
        fetchPublic()
    }, [])

    const fetchPublic = async () => {
        try {
            const res = await fetch(API_URL)
            const data = await res.json()
            setPublicLinks(data)
        } catch (err) {
            console.error('Error fetching public links', err)
        }
    }

    return (
        <div>
            <h2>Shared Public Links</h2>
            <p>Links shared by other users.</p>
            <Table data={publicLinks} showRemove={false} />
        </div>
    )
}

export default SharedList
