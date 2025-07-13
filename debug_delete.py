#!/usr/bin/env python3
"""
Debug script to investigate the delete note issue
"""

import requests
import json
import base64

BASE_URL = "http://localhost:8001/api"
TEST_USER_DATA = {
    "username": "smartpen_user_2025",
    "password": "SecurePassword123!"
}

def debug_note_operations():
    # Login first
    login_response = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER_DATA)
    if login_response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a note
    note_data = {
        "title": "Debug Note",
        "content": base64.b64encode(b"debug data").decode('utf-8'),
        "text_content": "Debug text",
        "user_id": "will_be_set_by_backend"
    }
    
    create_response = requests.post(f"{BASE_URL}/notes", json=note_data, headers=headers)
    if create_response.status_code != 200:
        print("❌ Note creation failed")
        return
    
    created_note = create_response.json()
    print("✅ Created note response:")
    print(json.dumps(created_note, indent=2))
    
    # Get all notes to see the structure
    get_response = requests.get(f"{BASE_URL}/notes", headers=headers)
    if get_response.status_code == 200:
        notes = get_response.json()
        print("\n✅ Retrieved notes:")
        print(json.dumps(notes, indent=2))
        
        if notes:
            note_id = notes[0].get("id")
            print(f"\n🔍 Attempting to delete note with ID: {note_id}")
            
            # Try to delete using the ID from the retrieved note
            delete_response = requests.delete(f"{BASE_URL}/notes/{note_id}", headers=headers)
            print(f"Delete response status: {delete_response.status_code}")
            print(f"Delete response: {delete_response.text}")

if __name__ == "__main__":
    debug_note_operations()