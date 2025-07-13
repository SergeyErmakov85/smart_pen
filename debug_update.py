#!/usr/bin/env python3
"""
Debug script to test the update note issue
"""

import requests
import json
import base64

BASE_URL = "http://localhost:8001/api"
TEST_USER_DATA = {
    "username": "smartpen_user_2025",
    "password": "SecurePassword123!"
}

def debug_update_issue():
    # Login first
    login_response = requests.post(f"{BASE_URL}/auth/login", json=TEST_USER_DATA)
    if login_response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a note
    note_data = {
        "title": "Debug Update Note",
        "content": base64.b64encode(b"debug data").decode('utf-8'),
        "text_content": "Debug text",
        "user_id": "will_be_set_by_backend"
    }
    
    create_response = requests.post(f"{BASE_URL}/notes", json=note_data, headers=headers)
    if create_response.status_code != 200:
        print("❌ Note creation failed")
        return
    
    created_note = create_response.json()
    note_id = created_note["id"]
    print(f"✅ Created note with ID: {note_id}")
    print(f"Original user_id: {created_note['user_id']}")
    
    # Update the note
    update_data = {
        "title": "Updated Debug Note",
        "content": base64.b64encode(b"updated debug data").decode('utf-8'),
        "text_content": "Updated debug text",
        "user_id": "will_be_set_by_backend"  # This might be the problem
    }
    
    update_response = requests.put(f"{BASE_URL}/notes/{note_id}", json=update_data, headers=headers)
    if update_response.status_code != 200:
        print("❌ Note update failed")
        print(f"Update response: {update_response.text}")
        return
    
    updated_note = update_response.json()
    print(f"✅ Updated note")
    print(f"Updated user_id: {updated_note['user_id']}")
    
    # Try to delete the note
    delete_response = requests.delete(f"{BASE_URL}/notes/{note_id}", headers=headers)
    print(f"Delete response status: {delete_response.status_code}")
    print(f"Delete response: {delete_response.text}")
    
    # Check what notes exist
    get_response = requests.get(f"{BASE_URL}/notes", headers=headers)
    if get_response.status_code == 200:
        notes = get_response.json()
        print(f"\nCurrent notes count: {len(notes)}")
        for note in notes:
            print(f"Note ID: {note['id']}, User ID: {note['user_id']}")

if __name__ == "__main__":
    debug_update_issue()