import { useState } from "react"
import { Button } from './ui'

function Form(props) {
    const [name, setName] = useState("")
    const [URL, setURL] = useState("")
    const [isPublic, setIsPublic] = useState(false)

    const handleNameChange = (event) => {
        setName(event.target.value)
    }

    const handleURLChange = (event) => {
        setURL(event.target.value)
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        if (name && URL) {
            props.submitNewLink({name, URL, isPublic})
            // Clear the form
            setName("")
            setURL("")
            setIsPublic(false)
        }
    }

    return(
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-center">
            <input 
                className="px-3 py-2 rounded bg-slate-700 border border-slate-600 text-slate-100 flex-1 min-w-[180px]"
                type="text" 
                id="linkName" 
                name="linkName" 
                placeholder="Link name"
                value={name}
                onChange={handleNameChange}
            />
            <input 
                className="px-3 py-2 rounded bg-slate-700 border border-slate-600 text-slate-100 flex-1 min-w-[220px]"
                type="text" 
                id="linkURL" 
                name="linkURL" 
                placeholder="https://example.com"
                value={URL}
                onChange={handleURLChange}
            />
            <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-4 h-4" />
                Make public<br /><br />
            </label>
            <Button type="submit">Add</Button>
        </form>
    )
}

export default Form