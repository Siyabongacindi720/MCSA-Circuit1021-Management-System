from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
import json
import aiofiles
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="MCSA Highveld Ridge Circuit 1021 Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# JWT Configuration
JWT_SECRET = "mcsa_circuit_1021_secret_key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# File upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# User Roles
class UserRole(str, Enum):
    ADMIN = "admin"
    REV = "rev"
    CIRCUIT_STEWARD = "circuit_steward"
    SOCIETY_STEWARD = "society_steward"
    SECRETARY = "secretary"
    CLASS_LEADER = "class_leader"

# Societies
class Society(str, Enum):
    EMBALENHLE = "embalenhle"
    SECUNDA = "secunda" 
    EVANDER = "evander"
    KMT = "kmt"
    EBENEZER = "ebenezer"
    EMZINONI = "emzinoni"

# Organizations
class Organization(str, Enum):
    CHILDRENS_MINISTRY = "childrens_ministry"
    JUNIOR_MANYANO = "junior_manyano"
    WESLEY_GUILD = "wesley_guild"
    YOUNG_MENS_GUILD = "young_mens_guild"
    YOUNG_WOMENS_MANYANO = "young_womens_manyano"
    WOMENS_MANYANO = "womens_manyano"
    WOMENS_FELLOWSHIP = "womens_fellowship"
    LOCATION_PREACHERS = "location_preachers"
    MUSIC_ASSOCIATION = "music_association"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    full_name: str
    role: UserRole
    society: Optional[Society] = None
    organization: Optional[Organization] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: UserRole
    society: Optional[Society] = None
    organization: Optional[Organization] = None

class Member(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    date_of_birth: datetime
    gender: str
    title: Optional[str] = None
    residential_address: str
    email_address: Optional[str] = None
    occupation: Optional[str] = None
    society: Society
    class_allocation: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class MemberCreate(BaseModel):
    full_name: str
    date_of_birth: datetime
    gender: str
    title: Optional[str] = None
    residential_address: str
    email_address: Optional[str] = None
    occupation: Optional[str] = None
    society: Society
    class_allocation: Optional[str] = None

class FinancialEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    society: Society
    date: datetime
    pledges: float = 0.0
    special_effort: float = 0.0
    sunday_collection: float = 0.0
    circuit_events_collection: float = 0.0
    total: float = 0.0
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FinancialEntryCreate(BaseModel):
    society: Society
    date: datetime
    pledges: float = 0.0
    special_effort: float = 0.0
    sunday_collection: float = 0.0
    circuit_events_collection: float = 0.0

class Announcement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    deceased_name: Optional[str] = None
    class_leader_name: Optional[str] = None
    death_date: Optional[datetime] = None
    burial_location: Optional[str] = None
    financial_status: Optional[str] = None
    attendance_record: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    deceased_name: Optional[str] = None
    class_leader_name: Optional[str] = None
    death_date: Optional[datetime] = None
    burial_location: Optional[str] = None
    financial_status: Optional[str] = None
    attendance_record: Optional[str] = None

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        username = payload.get("username")
        role = payload.get("role")
        
        if not user_id or not username or not role:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        user = await db.users.find_one({"id": user_id})
        if not user or not user.get("is_active"):
            raise HTTPException(status_code=401, detail="User not found or inactive")
            
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Authentication Routes
@api_router.post("/auth/login")
async def login(user_login: UserLogin):
    user = await db.users.find_one({"username": user_login.username})
    if not user or not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=401, detail="Account inactive")
    
    token = create_jwt_token(user["id"], user["username"], user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
            "society": user.get("society"),
            "organization": user.get("organization")
        }
    }

@api_router.post("/auth/register")
async def register(user_create: UserCreate):
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_create.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create user
    user_dict = user_create.dict()
    user_dict["password_hash"] = hash_password(user_create.password)
    del user_dict["password"]
    
    user = User(**user_dict)
    await db.users.insert_one(user.dict())
    
    return {"message": "User created successfully", "user_id": user.id}

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Members Routes
@api_router.post("/members", response_model=Member)
async def create_member(member_create: MemberCreate, current_user: User = Depends(get_current_user)):
    member_dict = member_create.dict()
    member_dict["created_by"] = current_user.id
    member = Member(**member_dict)
    await db.members.insert_one(member.dict())
    return member

@api_router.get("/members", response_model=List[Member])
async def get_members(
    society: Optional[Society] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if society:
        query["society"] = society
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email_address": {"$regex": search, "$options": "i"}}
        ]
    
    members = await db.members.find(query).to_list(1000)
    return [Member(**member) for member in members]

@api_router.get("/members/{member_id}", response_model=Member)
async def get_member(member_id: str, current_user: User = Depends(get_current_user)):
    member = await db.members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return Member(**member)

@api_router.put("/members/{member_id}", response_model=Member)
async def update_member(
    member_id: str, 
    member_update: MemberCreate, 
    current_user: User = Depends(get_current_user)
):
    existing_member = await db.members.find_one({"id": member_id})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    update_dict = member_update.dict()
    await db.members.update_one({"id": member_id}, {"$set": update_dict})
    
    updated_member = await db.members.find_one({"id": member_id})
    return Member(**updated_member)

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str, current_user: User = Depends(get_current_user)):
    result = await db.members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted successfully"}

# Financial Routes
@api_router.post("/finances", response_model=FinancialEntry)
async def create_financial_entry(
    entry_create: FinancialEntryCreate, 
    current_user: User = Depends(get_current_user)
):
    entry_dict = entry_create.dict()
    entry_dict["created_by"] = current_user.id
    entry_dict["total"] = (
        entry_dict["pledges"] + 
        entry_dict["special_effort"] + 
        entry_dict["sunday_collection"] + 
        entry_dict["circuit_events_collection"]
    )
    
    entry = FinancialEntry(**entry_dict)
    await db.financial_entries.insert_one(entry.dict())
    return entry

@api_router.get("/finances", response_model=List[FinancialEntry])
async def get_financial_entries(
    society: Optional[Society] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if society:
        query["society"] = society
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["date"] = date_query
    
    entries = await db.financial_entries.find(query).sort("date", -1).to_list(1000)
    return [FinancialEntry(**entry) for entry in entries]

# Announcements Routes
@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(
    announcement_create: AnnouncementCreate, 
    current_user: User = Depends(get_current_user)
):
    announcement_dict = announcement_create.dict()
    announcement_dict["created_by"] = current_user.id
    announcement = Announcement(**announcement_dict)
    await db.announcements.insert_one(announcement.dict())
    return announcement

@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements(current_user: User = Depends(get_current_user)):
    announcements = await db.announcements.find().sort("created_at", -1).to_list(100)
    return [Announcement(**announcement) for announcement in announcements]

# Statistics Routes
@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    total_members = await db.members.count_documents({})
    total_societies = len(Society)
    total_organizations = len(Organization)
    
    # Recent financial entries
    recent_finances = await db.financial_entries.find().sort("created_at", -1).limit(5).to_list(5)
    
    # Members by society
    members_by_society = {}
    for society in Society:
        count = await db.members.count_documents({"society": society})
        members_by_society[society] = count
    
    return {
        "total_members": total_members,
        "total_societies": total_societies,
        "total_organizations": total_organizations,
        "recent_finances": recent_finances,
        "members_by_society": members_by_society
    }

# File Upload Routes
@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    # Create category directory
    category_dir = UPLOAD_DIR / category
    category_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = category_dir / unique_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Store file info in database
    file_info = {
        "id": str(uuid.uuid4()),
        "original_name": file.filename,
        "stored_name": unique_filename,
        "category": category,
        "file_path": str(file_path),
        "uploaded_by": current_user.id,
        "uploaded_at": datetime.utcnow()
    }
    await db.files.insert_one(file_info)
    
    return {"message": "File uploaded successfully", "file_id": file_info["id"]}

@api_router.get("/files/{category}")
async def get_files_by_category(category: str, current_user: User = Depends(get_current_user)):
    files = await db.files.find({"category": category}).sort("uploaded_at", -1).to_list(100)
    return files

# Initialize default admin user
@app.on_event("startup")
async def create_default_admin():
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = User(
            username="admin",
            password_hash=hash_password("admin123"),
            full_name="System Administrator",
            role=UserRole.ADMIN
        )
        await db.users.insert_one(admin_user.dict())
        print("Default admin user created: username=admin, password=admin123")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()