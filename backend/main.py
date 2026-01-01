from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Text, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from fastapi import HTTPException, Response


# -----------------------
# DB setup (SQLite)
# -----------------------
DATABASE_URL = "sqlite:///./notes.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    tags = Column(String(300), nullable=False, default="")  # comma-separated for now
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# -----------------------
# API setup
# -----------------------
app = FastAPI(title="AI Notes API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class NoteCreate(BaseModel):
    title: str
    content: str
    tags: str = ""

class NoteOut(BaseModel):
    id: int
    title: str
    content: str
    tags: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/notes", response_model=list[NoteOut])
def list_notes():
    db = SessionLocal()
    try:
        notes = db.query(Note).order_by(Note.updated_at.desc()).all()
        return notes
    finally:
        db.close()

@app.post("/notes", response_model=NoteOut)
def create_note(payload: NoteCreate):
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        note = Note(
            title=payload.title.strip() or "Untitled",
            content=payload.content,
            tags=payload.tags.strip(),
            created_at=now,
            updated_at=now,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return note
    finally:
        db.close()

@app.get("/notes/{note_id}", response_model=NoteOut)
def get_note(note_id: int):
    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            # keep simple for day 1
            return {"id": -1, "title": "Not found", "content": "", "tags": "", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        return note
    finally:
        db.close()

@app.put("/notes/{note_id}", response_model=NoteOut)
def update_note(note_id: int, payload: NoteCreate):
    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        note.title = payload.title.strip() or "Untitled"
        note.content = payload.content
        note.tags = payload.tags.strip()
        note.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(note)
        return note
    finally:
        db.close()


@app.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int):
    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")

        db.delete(note)
        db.commit()
        return Response(status_code=204)
    finally:
        db.close()


