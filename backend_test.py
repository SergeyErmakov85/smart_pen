#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Smart Pen Application
Tests all endpoints including authentication, notes CRUD, and Bluetooth functionality
"""

import requests
import json
import time
from datetime import datetime
import base64
import uuid

# Configuration
BASE_URL = "http://localhost:8001/api"
TEST_USER_DATA = {
    "username": "smartpen_user_2025",
    "email": "smartpen.user.2025@example.com", 
    "password": "SecurePassword123!"
}

class SmartPenAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.test_results = []
        self.created_note_id = None
        self.created_bluetooth_session_id = None
        
    def log_result(self, test_name, success, message, response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_result("Health Check", True, "Health endpoint working correctly", data)
                    return True
                else:
                    self.log_result("Health Check", False, f"Invalid health response: {data}")
                    return False
            else:
                self.log_result("Health Check", False, f"Health check failed with status {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        try:
            response = requests.post(
                f"{self.base_url}/auth/register",
                json=TEST_USER_DATA,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("User Registration", True, "User registered successfully", {"token_type": data["token_type"]})
                    return True
                else:
                    self.log_result("User Registration", False, f"Invalid registration response: {data}")
                    return False
            elif response.status_code == 400:
                # User might already exist, try login instead
                self.log_result("User Registration", True, "User already exists (expected behavior)", {"status_code": 400})
                return self.test_user_login()
            else:
                self.log_result("User Registration", False, f"Registration failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("User Registration", False, f"Registration error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login endpoint"""
        try:
            login_data = {
                "username": TEST_USER_DATA["username"],
                "password": TEST_USER_DATA["password"]
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and "token_type" in data:
                    self.auth_token = data["access_token"]
                    self.log_result("User Login", True, "User logged in successfully", {"token_type": data["token_type"]})
                    return True
                else:
                    self.log_result("User Login", False, f"Invalid login response: {data}")
                    return False
            else:
                self.log_result("User Login", False, f"Login failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        try:
            invalid_data = {
                "username": "nonexistent_user",
                "password": "wrong_password"
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=invalid_data,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_result("Invalid Login Test", True, "Invalid credentials properly rejected")
                return True
            else:
                self.log_result("Invalid Login Test", False, f"Expected 401, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Invalid Login Test", False, f"Invalid login test error: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers"""
        if not self.auth_token:
            return {}
        return {"Authorization": f"Bearer {self.auth_token}"}
    
    def test_get_notes_empty(self):
        """Test getting notes when user has no notes"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/notes", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Get Notes (Empty)", True, f"Retrieved {len(data)} notes successfully")
                    return True
                else:
                    self.log_result("Get Notes (Empty)", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_result("Get Notes (Empty)", False, f"Get notes failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Notes (Empty)", False, f"Get notes error: {str(e)}")
            return False
    
    def test_create_note(self):
        """Test creating a new note"""
        try:
            # Create sample canvas data (base64 encoded)
            sample_canvas_data = base64.b64encode(b"sample canvas drawing data").decode('utf-8')
            
            note_data = {
                "title": "Test Smart Pen Note",
                "content": sample_canvas_data,
                "text_content": "This is a test note created by the Smart Pen API test suite",
                "user_id": "will_be_set_by_backend"
            }
            
            headers = self.get_auth_headers()
            response = requests.post(
                f"{self.base_url}/notes",
                json=note_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "title" in data and "content" in data:
                    self.created_note_id = data["id"]
                    self.log_result("Create Note", True, f"Note created successfully with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Create Note", False, f"Invalid note creation response: {data}")
                    return False
            else:
                self.log_result("Create Note", False, f"Note creation failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Create Note", False, f"Create note error: {str(e)}")
            return False
    
    def test_get_notes_with_data(self):
        """Test getting notes after creating one"""
        try:
            headers = self.get_auth_headers()
            response = requests.get(f"{self.base_url}/notes", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    note = data[0]
                    if "id" in note and "title" in note and "content" in note:
                        self.log_result("Get Notes (With Data)", True, f"Retrieved {len(data)} notes with proper structure")
                        return True
                    else:
                        self.log_result("Get Notes (With Data)", False, f"Note missing required fields: {note}")
                        return False
                else:
                    self.log_result("Get Notes (With Data)", False, f"Expected non-empty list, got: {data}")
                    return False
            else:
                self.log_result("Get Notes (With Data)", False, f"Get notes failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Notes (With Data)", False, f"Get notes error: {str(e)}")
            return False
    
    def test_update_note(self):
        """Test updating an existing note"""
        if not self.created_note_id:
            self.log_result("Update Note", False, "No note ID available for update test")
            return False
            
        try:
            updated_canvas_data = base64.b64encode(b"updated canvas drawing data").decode('utf-8')
            
            update_data = {
                "title": "Updated Smart Pen Note",
                "content": updated_canvas_data,
                "text_content": "This note has been updated by the Smart Pen API test suite",
                "user_id": "will_be_set_by_backend"
            }
            
            headers = self.get_auth_headers()
            response = requests.put(
                f"{self.base_url}/notes/{self.created_note_id}",
                json=update_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "title" in data and data["title"] == "Updated Smart Pen Note":
                    self.log_result("Update Note", True, f"Note updated successfully")
                    return True
                else:
                    self.log_result("Update Note", False, f"Note update didn't reflect changes: {data}")
                    return False
            else:
                self.log_result("Update Note", False, f"Note update failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Update Note", False, f"Update note error: {str(e)}")
            return False
    
    def test_bluetooth_connect(self):
        """Test Bluetooth data storage endpoint"""
        try:
            # Sample stroke data that would come from Neo Smartpen dimo
            bluetooth_data = {
                "device_id": "neo_smartpen_dimo_12345",
                "stroke_data": [
                    {
                        "x": 100,
                        "y": 150,
                        "pressure": 0.8,
                        "timestamp": datetime.now().isoformat()
                    },
                    {
                        "x": 105,
                        "y": 155,
                        "pressure": 0.9,
                        "timestamp": datetime.now().isoformat()
                    }
                ],
                "timestamp": datetime.now().isoformat()
            }
            
            headers = self.get_auth_headers()
            response = requests.post(
                f"{self.base_url}/bluetooth/connect",
                json=bluetooth_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "id" in data:
                    self.created_bluetooth_session_id = data["id"]
                    self.log_result("Bluetooth Connect", True, f"Bluetooth data stored successfully with ID: {data['id']}")
                    return True
                else:
                    self.log_result("Bluetooth Connect", False, f"Invalid bluetooth response: {data}")
                    return False
            else:
                self.log_result("Bluetooth Connect", False, f"Bluetooth connect failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Bluetooth Connect", False, f"Bluetooth connect error: {str(e)}")
            return False
    
    def test_get_bluetooth_data(self):
        """Test retrieving Bluetooth session data"""
        if not self.created_bluetooth_session_id:
            self.log_result("Get Bluetooth Data", False, "No Bluetooth session ID available")
            return False
            
        try:
            headers = self.get_auth_headers()
            response = requests.get(
                f"{self.base_url}/bluetooth/data/{self.created_bluetooth_session_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "device_id" in data and "stroke_data" in data:
                    self.log_result("Get Bluetooth Data", True, f"Bluetooth data retrieved successfully")
                    return True
                else:
                    self.log_result("Get Bluetooth Data", False, f"Invalid bluetooth data response: {data}")
                    return False
            else:
                self.log_result("Get Bluetooth Data", False, f"Get bluetooth data failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Get Bluetooth Data", False, f"Get bluetooth data error: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoints without authentication"""
        try:
            # Test notes endpoint without auth
            response = requests.get(f"{self.base_url}/notes", timeout=10)
            
            if response.status_code == 401 or response.status_code == 403:
                self.log_result("Unauthorized Access Test", True, "Protected endpoint properly rejected unauthorized access")
                return True
            else:
                self.log_result("Unauthorized Access Test", False, f"Expected 401/403, got {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Unauthorized Access Test", False, f"Unauthorized access test error: {str(e)}")
            return False
    
    def test_delete_note(self):
        """Test deleting a note"""
        try:
            # First, get the current notes to find a note to delete
            headers = self.get_auth_headers()
            get_response = requests.get(f"{self.base_url}/notes", headers=headers, timeout=10)
            
            if get_response.status_code != 200:
                self.log_result("Delete Note", False, "Could not retrieve notes for delete test")
                return False
            
            notes = get_response.json()
            if not notes:
                self.log_result("Delete Note", False, "No notes available to delete")
                return False
            
            # Use the first note's ID for deletion
            note_to_delete = notes[0]
            note_id = note_to_delete["id"]
            
            response = requests.delete(
                f"{self.base_url}/notes/{note_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Delete Note", True, "Note deleted successfully")
                    return True
                else:
                    self.log_result("Delete Note", False, f"Invalid delete response: {data}")
                    return False
            else:
                self.log_result("Delete Note", False, f"Note deletion failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_result("Delete Note", False, f"Delete note error: {str(e)}")
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        try:
            headers = {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            
            response = requests.options(f"{self.base_url}/health", headers=headers, timeout=10)
            
            if response.status_code == 200:
                cors_headers = response.headers
                if 'Access-Control-Allow-Origin' in cors_headers:
                    self.log_result("CORS Configuration", True, "CORS headers present and configured")
                    return True
                else:
                    self.log_result("CORS Configuration", False, "CORS headers missing")
                    return False
            else:
                self.log_result("CORS Configuration", False, f"CORS preflight failed with status {response.status_code}")
                return False
        except Exception as e:
            self.log_result("CORS Configuration", False, f"CORS test error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Smart Pen Backend API Tests...")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_health_check,
            self.test_user_registration,
            self.test_invalid_login,
            self.test_unauthorized_access,
            self.test_get_notes_empty,
            self.test_create_note,
            self.test_get_notes_with_data,
            self.test_update_note,
            self.test_bluetooth_connect,
            self.test_get_bluetooth_data,
            self.test_delete_note,
            self.test_cors_configuration
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__}: Unexpected error: {str(e)}")
                failed += 1
            
            time.sleep(0.5)  # Small delay between tests
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        if failed == 0:
            print("🎉 All tests passed! Backend API is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return passed, failed, self.test_results

def main():
    """Main test execution"""
    tester = SmartPenAPITester()
    passed, failed, results = tester.run_all_tests()
    
    # Save detailed results to file
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'passed': passed,
                'failed': failed,
                'success_rate': (passed/(passed+failed)*100) if (passed+failed) > 0 else 0
            },
            'detailed_results': results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)