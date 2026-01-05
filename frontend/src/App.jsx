import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://127.0.0.1:8000";


export default function App() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  async function fetchNotes() {
    setError("");
    try {
      const res = await axios.get(`${API}/notes`);
      setNotes(res.data);
    } catch (e) {
      setError("Could not load notes. Is the backend running on :8000?");
    }
  }

  async function loadNote(id) {
    setError("");
    try {
      const res = await axios.get(`${API}/notes/${id}`);
      const note = res.data;

      setTitle(note.title ?? "");
      setContent(note.content ?? "");

      // handle tags being either string or array
      const t = note.tags;
      setTags(Array.isArray(t) ? t.join(", ") : (t ?? ""));

      setSelectedId(note.id);
    } catch (e) {
      setError("Could not load that note.");
    }
  }

  async function saveNote() {
    setError("");
    setSaving(true);

    try {
      const payload = { title, content, tags };

      if (!selectedId) {
        const res = axios.put(`${API}/notes/${selectedId}`, payload);

        setSelectedId(res.data.id)
      } else {
        await await axios.post(`${API}/notes`, payload);
      }

      await fetchNotes();
    } catch (e) {
      setError("Could not save note. Check backend logs / CORS.");
    } finally {
      setSaving(false);
    }
  }

  function newNote() {
    setError("");
    setTitle("");
    setContent("");
    setTags("");
    setSelectedId(null);
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function deleteNote(id) {
  setError("");
  if (!id) return;

  try {
    await axios.delete(`${API}/notes/${id}`);
    await fetchNotes();
    newNote(); // clears editor + deselect
  } catch (e) {
    setError("Could not delete note.");
  }
}


  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: "100vh" }}>
      {/* Left: Notes list */}
      <div style={{ borderRight: "1px solid #ddd", padding: 16, overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>Notes</h2>
        <button onClick={fetchNotes} style={{ marginBottom: 12 }}>Refresh</button>

        {error && <div style={{ color: "crimson", marginBottom: 12 }}>{error}</div>}

        {notes.length === 0 ? (
          <p>No notes yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, borderRadius: 10 }}>
            {notes.map((n) => (
              <div
                key={n.id}
                onClick={() => loadNote(n.id)}
                style={{
                  padding: 12,
                  border: n.id === selectedId ? "2px solid #2563eb" : "2px solid #000000ff",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
                className="note-tabs"
              >
                <div style={{ fontWeight: 700 }}>{n.title}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {Array.isArray(n.tags) ? n.tags.join(", ") : n.tags}
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                  {n.updated_at ? new Date(n.updated_at).toLocaleString() : ""}
                </div>
              </div>
            ))}:
          </div>
        )}
      </div>

      {/* Right: Editor */}
      <div style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>{selectedId ? "Edit Note" : "New Note"}</h2>

        <label style={{ display: "block", marginBottom: 6 }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., CMPT 370 - Lighting Notes"
          style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 7, borderWidth: 1.5 }}
        />

        <label style={{ display: "block", marginBottom: 6 }}>Tags (comma-separated)</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="webgl, shaders, midterm"
          style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 7, borderWidth: 1 }}
        />

        <label style={{ display: "block", marginBottom: 6 }}>Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note here..."
          style={{ width: "100%", height: "55vh", padding: 10, resize: "vertical", borderRadius: 7 }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button onClick={newNote}>New Note</button>
          <button onClick={saveNote} disabled={saving || (!title.trim() && !content.trim())}>
            {saving ? "Saving..." : "Save Note"}
          </button>
          <button onClick={() => deleteNote(selectedId)} disabled={!selectedId || saving}>Delete Note</button>
        </div>
      </div>
    </div>
  );
}
