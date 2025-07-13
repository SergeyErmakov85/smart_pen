from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Smart Pen API", version="1.0.0")

# CORS configuration
# WARNING: This is a permissive CORS configuration. For production, you should restrict this
# to the domain of your frontend application.
# Example: allow_origins=["http://your-frontend-domain.com"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL")
if not mongo_url:
    raise RuntimeError("MONGO_URL environment variable is not set.")
client = MongoClient(mongo_url)
db = client.smartpen_db

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# It's crucial that JWT_SECRET_KEY is set in your environment.
# A hardcoded key is a significant security risk.
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Pydantic models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str  # Base64 encoded canvas data
    text_content: Optional[str] = None  # OCR extracted text
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
    google_drive_id: Optional[str] = None

    class Config:
        # This allows the model to be created from a dictionary that includes _id
        from_attributes = True

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    text_content: Optional[str] = None

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.users.find_one({"username": username})
    if user is None:
        raise credentials_exception
    # Ensure the user object contains the 'id' field for dependency injection
    if "_id" in user:
        user["id"] = str(user["id"])
    return user

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    if db.users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    db.users.insert_one(user_doc)
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/notes", response_model=List[Note])
async def get_notes(current_user: dict = Depends(get_current_user)):
    notes_cursor = db.notes.find({"user_id": current_user["id"]})
    # Transform documents to Note models, handling the _id to id mapping
    return [Note.model_validate(note) for note in notes_cursor]


@app.post("/api/notes", response_model=Note)
async def create_note(note_data: NoteUpdate, current_user: dict = Depends(get_current_user)):
    new_note = Note(
        **note_data.dict(),
        user_id=current_user["id"]
    )
    
    db.notes.insert_one(new_note.dict())
    return new_note


@app.put("/api/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: NoteUpdate, current_user: dict = Depends(get_current_user)):
    update_data = note_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.utcnow()
    
    result = db.notes.update_one(
        {"id": note_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
        
    updated_note_doc = db.notes.find_one({"id": note_id, "user_id": current_user["id"]})

    return Note.model_validate(updated_note_doc)

@app.delete("/api/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = db.notes.delete_one({"id": note_id, "user_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {} # Return empty response for 204

# The Bluetooth endpoints are maintained as they were, assuming they are still needed.
class BluetoothData(BaseModel):
    device_id: str
    stroke_data: List[dict]
    timestamp: datetime

@app.post("/api/bluetooth/connect")
async def bluetooth_connect(data: BluetoothData, current_user: dict = Depends(get_current_user)):
    bluetooth_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "device_id": data.device_id,
        "stroke_data": data.stroke_data,
        "timestamp": data.timestamp,
        "created_at": datetime.utcnow()
    }
    db.bluetooth_data.insert_one(bluetooth_doc)
    return {"message": "Bluetooth data received successfully", "id": bluetooth_doc["id"]}

@app.get("/api/bluetooth/data/{session_id}")
async def get_bluetooth_data(session_id: str, current_user: dict = Depends(get_current_user)):
    data = db.bluetooth_data.find_one({"id": session_id, "user_id": current_user["id"]})
    if not data:
        raise HTTPException(status_code=404, detail="Bluetooth data not found")
    return data

if __name__ == "__main__":
    import uvicorn
    # Use port 8000 for consistency with common practices
    uvicorn.run(app, host="0.0.0.0", port=8000)