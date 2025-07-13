from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from typing import Optional, List
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import uuid
import base64
import json

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Smart Pen API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/smartpen_db")
client = MongoClient(mongo_url)
db = client.smartpen_db

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
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
    id: Optional[str] = None
    title: str
    content: str  # Base64 encoded canvas data
    text_content: Optional[str] = None  # OCR extracted text
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user_id: Optional[str] = None  # Made optional for requests
    google_drive_id: Optional[str] = None

class BluetoothData(BaseModel):
    device_id: str
    stroke_data: List[dict]
    timestamp: datetime

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
        expire = datetime.utcnow() + timedelta(minutes=15)
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
    return user

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    if db.users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    db.users.insert_one(user_doc)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=Token)
async def login(user: UserLogin):
    db_user = db.users.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/notes", response_model=List[Note])
async def get_notes(current_user: dict = Depends(get_current_user)):
    notes = list(db.notes.find({"user_id": current_user["id"]}))
    for note in notes:
        # Keep the original UUID id, just remove MongoDB _id
        del note["_id"]
    return notes

@app.post("/api/notes", response_model=Note)
async def create_note(note: Note, current_user: dict = Depends(get_current_user)):
    note.user_id = current_user["id"]
    note.created_at = datetime.utcnow()
    note.updated_at = datetime.utcnow()
    
    note_doc = note.dict()
    note_doc["id"] = str(uuid.uuid4())
    
    result = db.notes.insert_one(note_doc)
    note_doc["_id"] = str(result.inserted_id)
    
    return note_doc

@app.put("/api/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, note: Note, current_user: dict = Depends(get_current_user)):
    note.updated_at = datetime.utcnow()
    note_doc = note.dict()
    
    # Ensure user_id is set correctly and not overwritten by request data
    note_doc["user_id"] = current_user["id"]
    # Preserve the original note ID
    note_doc["id"] = note_id
    
    result = db.notes.update_one(
        {"id": note_id, "user_id": current_user["id"]},
        {"$set": note_doc}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note_doc

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str, current_user: dict = Depends(get_current_user)):
    result = db.notes.delete_one({"id": note_id, "user_id": current_user["id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted successfully"}

@app.post("/api/bluetooth/connect")
async def bluetooth_connect(data: BluetoothData, current_user: dict = Depends(get_current_user)):
    # Store bluetooth data for processing
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
    
    data["id"] = str(data["_id"])
    del data["_id"]
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)