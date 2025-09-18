import React, { useEffect, useState } from 'react'
import { listFranchises, getFranchise, createFranchise, updateFranchise, deleteFranchise,
         listCharacters, createCharacter, updateCharacter, deleteCharacter,
         createProject, seedDev } from './api'

function FranchiseList({ onSelect }) {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  const refresh = async () => setItems(await listFranchises())
  useEffect(() => { refresh() }, [])

  const onCreate = async () => {
    if (!title) return
    await createFranchise({ title, description: desc, bible_json: null })
    setTitle(''); setDesc(''); refresh()
  }

  const onSeed = async () => {
    await seedDev(); refresh()
  }

  return (
    <div className="panel">
      <h3>Franchises</h3>
      <div className="row">
        <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
        <input placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)} />
        <button onClick={onCreate}>Create</button>
        <button onClick={onSeed} title="Insert demo franchise + characters">Seed</button>
      </div>
      <div className="list" style={{marginTop:12}}>
        {items.map(it => (
          <div key={it.franchise_id} className="item" onClick={()=>onSelect(it.franchise_id)} style={{cursor:'pointer'}}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <b>{it.title}</b><span className="muted">v{it.version}</span>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="muted">No franchises yet.</div>}
      </div>
    </div>
  )
}

function FranchiseDetail({ id }) {
  const [data, setData] = useState(null)
  const [chars, setChars] = useState([])
  const [form, setForm] = useState({ title:'', description:'', bible_json:'' })
  const [newChar, setNewChar] = useState({ name:'', canonical_key:'', description:'' })

  const load = async () => {
    const d = await getFranchise(id)
    setData(d)
    setForm({ title:d.title||'', description:d.description||'', bible_json:d.bible_json||'' })
    setChars(await listCharacters(id))
  }
  useEffect(() => { load() }, [id])

  const save = async () => {
    await updateFranchise(id, form); load()
  }
  const rm = async () => {
    await deleteFranchise(id); location.reload()
  }
  const addChar = async () => {
    if (!newChar.name) return
    await createCharacter(id, { ...newChar, state:'Approved' })
    setNewChar({ name:'', canonical_key:'', description:'' })
    setChars(await listCharacters(id))
  }
  const mkProject = async () => {
    const res = await createProject({
      franchise_id: id, title:`Episode ${Math.floor(Math.random()*1000)}`,
      premise: "Autogen pilot", target_duration_s: 180, style: "cinematic", genre: "sci-fi"
    })
    alert(`Project created: ${res.project_id} (Franchise v${res.franchise_version})`)
  }

  if (!data) return <div className="panel">Loading...</div>
  return (
    <div className="panel">
      <h3>Franchise: {data.title}</h3>
      <div className="grid">
        <div>
          <label>Title</label>
          <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
        </div>
        <div>
          <label>Description</label>
          <input value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        </div>
      </div>
      <div style={{marginTop:10}}>
        <label>Bible (JSON)</label>
        <textarea rows={10} value={form.bible_json} onChange={e=>setForm({...form, bible_json:e.target.value})} style={{width:'100%'}} />
      </div>
      <div className="row" style={{marginTop:10, gap:12}}>
        <button onClick={save}>Save</button>
        <button onClick={mkProject} title="Create a new Project from this Franchise">New Episode</button>
        <button onClick={rm} style={{background:'#4a0c0c', borderColor:'#742424'}}>Delete Franchise</button>
      </div>

      <h4 style={{marginTop:20}}>Canonical Characters</h4>
      <div className="row">
        <input placeholder="Name" value={newChar.name} onChange={e=>setNewChar({...newChar, name:e.target.value})} />
        <input placeholder="Canonical Key" value={newChar.canonical_key} onChange={e=>setNewChar({...newChar, canonical_key:e.target.value})} />
        <input placeholder="Description" value={newChar.description} onChange={e=>setNewChar({...newChar, description:e.target.value})} />
        <button onClick={addChar}>Add</button>
      </div>
      <div className="list" style={{marginTop:12}}>
        {chars.map(c => (
          <div key={c.character_id} className="item">
            <b>{c.name}</b> <span className="muted">({c.canonical_key || 'no-key'})</span> — <span className="muted">{c.state}</span>
            <div className="muted">id {c.character_id}</div>
          </div>
        ))}
        {chars.length === 0 && <div className="muted">No canonical characters yet.</div>}
      </div>
    </div>
  )
}

export default function App(){
  const [selected, setSelected] = useState(null)
  return (
    <div className="container">
      <FranchiseList onSelect={setSelected} />
      {selected ? <FranchiseDetail id={selected} /> : <div className="panel"><h3>Pick or create a Franchise</h3></div>}
    </div>
  )
}
