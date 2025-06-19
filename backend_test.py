import requests
import json
import sys
from datetime import datetime

class MCSACircuitTester:
    def __init__(self, base_url="https://0a47e624-73a4-4770-95fb-709c9962bd3e.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Could not parse error response")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, username, password):
        """Test login and get token"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response.get('user')
            print(f"   Logged in as: {self.user_data.get('full_name')} (Role: {self.user_data.get('role')})")
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )

    def test_dashboard_stats(self):
        """Test getting dashboard statistics"""
        return self.run_test(
            "Dashboard Statistics",
            "GET",
            "stats/dashboard",
            200
        )

    def test_create_member(self, member_data):
        """Test creating a new member"""
        return self.run_test(
            "Create Member",
            "POST",
            "members",
            200,
            data=member_data
        )

    def test_get_members(self, society=None):
        """Test getting members list"""
        params = {}
        if society:
            params['society'] = society
        
        return self.run_test(
            f"Get Members{' for ' + society if society else ''}",
            "GET",
            "members",
            200,
            params=params
        )

    def test_create_financial_entry(self, finance_data):
        """Test creating a financial entry"""
        return self.run_test(
            "Create Financial Entry",
            "POST",
            "finances",
            200,
            data=finance_data
        )

    def test_get_financial_entries(self, society=None):
        """Test getting financial entries"""
        params = {}
        if society:
            params['society'] = society
        
        return self.run_test(
            f"Get Financial Entries{' for ' + society if society else ''}",
            "GET",
            "finances",
            200,
            params=params
        )

    def test_create_announcement(self, announcement_data):
        """Test creating an announcement"""
        return self.run_test(
            "Create Announcement",
            "POST",
            "announcements",
            200,
            data=announcement_data
        )

    def test_get_announcements(self):
        """Test getting announcements"""
        return self.run_test(
            "Get Announcements",
            "GET",
            "announcements",
            200
        )

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"MCSA Circuit 1021 API Test Summary")
        print("="*50)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print("="*50)
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed.")
        
        return self.tests_passed == self.tests_run

def main():
    # Setup
    tester = MCSACircuitTester()
    
    # 1. Authentication Tests
    if not tester.test_login("admin", "admin123"):
        print("❌ Login failed, stopping tests")
        tester.print_summary()
        return 1
    
    tester.test_get_me()
    
    # 2. Dashboard Stats Test
    tester.test_dashboard_stats()
    
    # 3. Member Management Tests
    test_member = {
        "full_name": "Test Member",
        "date_of_birth": datetime.now().isoformat(),
        "gender": "Male",
        "title": "Mr",
        "residential_address": "123 Test Street",
        "email_address": "test@example.com",
        "occupation": "Tester",
        "society": "secunda",
        "class_allocation": "Test Class"
    }
    
    success, member_response = tester.test_create_member(test_member)
    
    # Test getting members
    tester.test_get_members()
    
    # Test filtering by society
    tester.test_get_members(society="secunda")
    
    # 4. Financial Management Tests
    test_finance = {
        "society": "secunda",
        "date": datetime.now().isoformat(),
        "pledges": 100.50,
        "special_effort": 200.75,
        "sunday_collection": 300.25,
        "circuit_events_collection": 150.00
    }
    
    tester.test_create_financial_entry(test_finance)
    
    # Test getting financial entries
    tester.test_get_financial_entries()
    
    # Test filtering by society
    tester.test_get_financial_entries(society="secunda")
    
    # 5. Announcements Tests
    test_announcement = {
        "title": "Test Announcement",
        "content": "This is a test announcement",
        "deceased_name": "John Doe",
        "class_leader_name": "Jane Smith",
        "death_date": datetime.now().isoformat(),
        "burial_location": "Test Cemetery",
        "financial_status": "Good standing",
        "attendance_record": "Attending classes"
    }
    
    tester.test_create_announcement(test_announcement)
    
    # Test getting announcements
    tester.test_get_announcements()
    
    # Print summary
    all_passed = tester.print_summary()
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())