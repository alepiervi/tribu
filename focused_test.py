#!/usr/bin/env python3
"""
Focused Testing for 3 Specific Problems Reported by User
Tests the exact issues mentioned in the review request
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

class FocusedTester:
    def __init__(self, base_url="https://viaggi-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.issues_found = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.issues_found.append(f"{name}: {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, expected_status: int = 200, params: str = "") -> tuple:
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}/{endpoint}"
        if params:
            url += f"?{params}"
            
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}

            if not success:
                return False, f"Status {response.status_code}, expected {expected_status}. Response: {response_data}"
            
            return True, response_data

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"

    def authenticate_admin(self):
        """Authenticate as admin using provided credentials"""
        print("🔐 Authenticating as admin (admin@test.it)...")
        
        # Try to login with provided credentials
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'admin@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.admin_token = result['token']
            self.log_test("Admin login (admin@test.it)", True)
            return True
        else:
            # If login fails, try to register the admin user
            print("⚠️  Admin login failed, attempting to register admin user...")
            admin_data = {
                'email': 'admin@test.it',
                'password': 'password123',
                'first_name': 'Admin',
                'last_name': 'Test',
                'role': 'admin'
            }
            
            success, result = self.make_request('POST', 'auth/register', admin_data)
            if success and 'token' in result:
                self.admin_token = result['token']
                self.log_test("Admin registration (admin@test.it)", True)
                return True
            else:
                self.log_test("Admin authentication failed", False, str(result))
                return False

    def test_problema_1_financial_reports(self):
        """
        PROBLEMA 1 - FINANCIAL REPORTS ADMIN:
        - URL: /api/reports/financial 
        - Test with parameters: year=2025, no agent filter
        - Verify that admin can access and get data
        """
        print("\n🔍 PROBLEMA 1 - Testing Financial Reports Admin Access...")
        
        if not self.admin_token:
            self.log_test("PROBLEMA 1 - Admin token required", False, "No admin token available")
            return False

        # Test 1: Basic financial reports access
        success, result = self.make_request('GET', 'reports/financial', token=self.admin_token)
        if success:
            self.log_test("PROBLEMA 1 - Basic financial reports access", True)
            print(f"   📊 Response keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
        else:
            self.log_test("PROBLEMA 1 - Basic financial reports access", False, str(result))
            return False

        # Test 2: Financial reports with year=2025 parameter
        success, result = self.make_request('GET', 'reports/financial', token=self.admin_token, params="year=2025")
        if success:
            self.log_test("PROBLEMA 1 - Financial reports with year=2025", True)
            print(f"   📅 Year 2025 data structure: {result.get('period', 'No period info')}")
            print(f"   📈 Totals available: {bool(result.get('totals'))}")
            print(f"   📊 Monthly breakdown: {bool(result.get('monthly_breakdown'))}")
            print(f"   🔒 Can export Excel: {result.get('can_export_excel', 'Not specified')}")
        else:
            self.log_test("PROBLEMA 1 - Financial reports with year=2025", False, str(result))

        # Test 3: Verify admin has export permissions
        success, result = self.make_request('GET', 'reports/financial', token=self.admin_token)
        if success:
            can_export = result.get('can_export_excel', False)
            if can_export:
                self.log_test("PROBLEMA 1 - Admin can export Excel (correct)", True)
            else:
                self.log_test("PROBLEMA 1 - Admin can export Excel (missing)", False, "Admin should have can_export_excel: true")
        
        return True

    def test_problema_2_itinerary_creation(self):
        """
        PROBLEMA 2 - MODIFICA ITINERARIO:
        - Test creation of new itinerary day
        - URL: POST /api/itineraries
        - Verify errors in day creation
        """
        print("\n🔍 PROBLEMA 2 - Testing Itinerary Creation...")
        
        if not self.admin_token:
            self.log_test("PROBLEMA 2 - Admin token required", False, "No admin token available")
            return False

        # First, we need a trip to create an itinerary for
        # Create a test trip
        trip_data = {
            'title': 'Test Trip for Itinerary',
            'destination': 'Mediterranean',
            'description': 'Test trip for itinerary creation',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': 'test-client-id',  # We'll use a dummy ID for testing
            'trip_type': 'cruise'
        }

        success, trip_result = self.make_request('POST', 'trips', trip_data, token=self.admin_token)
        if not success:
            self.log_test("PROBLEMA 2 - Create test trip for itinerary", False, str(trip_result))
            return False
        
        trip_id = trip_result.get('id')
        self.log_test("PROBLEMA 2 - Create test trip for itinerary", True)

        # Test 1: Create new itinerary day
        itinerary_data = {
            'trip_id': trip_id,
            'day_number': 1,
            'date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'title': 'Day 1 - Departure',
            'description': 'Embarkation and departure from port',
            'itinerary_type': 'port_day'
        }

        success, result = self.make_request('POST', 'itineraries', itinerary_data, token=self.admin_token)
        if success:
            self.log_test("PROBLEMA 2 - Create new itinerary day", True)
            itinerary_id = result.get('id')
            print(f"   📅 Created itinerary ID: {itinerary_id}")
        else:
            self.log_test("PROBLEMA 2 - Create new itinerary day", False, str(result))
            return False

        # Test 2: Create another day to test multiple days
        itinerary_data_2 = {
            'trip_id': trip_id,
            'day_number': 2,
            'date': (datetime.now(timezone.utc) + timedelta(days=31)).isoformat(),
            'title': 'Day 2 - At Sea',
            'description': 'Full day at sea with ship activities',
            'itinerary_type': 'sea_day'
        }

        success, result = self.make_request('POST', 'itineraries', itinerary_data_2, token=self.admin_token)
        if success:
            self.log_test("PROBLEMA 2 - Create second itinerary day", True)
        else:
            self.log_test("PROBLEMA 2 - Create second itinerary day", False, str(result))

        # Test 3: Verify itineraries can be retrieved
        success, result = self.make_request('GET', f'trips/{trip_id}/itineraries', token=self.admin_token)
        if success:
            itineraries = result if isinstance(result, list) else []
            self.log_test(f"PROBLEMA 2 - Retrieve itineraries ({len(itineraries)} found)", True)
        else:
            self.log_test("PROBLEMA 2 - Retrieve itineraries", False, str(result))

        # Test 4: Test invalid itinerary creation (missing required fields)
        invalid_data = {
            'trip_id': trip_id,
            # Missing day_number, date, title, description, itinerary_type
        }

        success, result = self.make_request('POST', 'itineraries', invalid_data, token=self.admin_token, expected_status=422)
        if success:
            self.log_test("PROBLEMA 2 - Invalid itinerary rejected (correct)", True)
        else:
            self.log_test("PROBLEMA 2 - Invalid itinerary handling", False, str(result))

        return True

    def test_problema_3_financial_sheets(self):
        """
        PROBLEMA 3 - SCHEDA FINANZIARIA:
        - Test creation of administrative data
        - URL: POST /api/financial-sheets
        - Verify errors in sheet creation
        """
        print("\n🔍 PROBLEMA 3 - Testing Financial Sheets Creation...")
        
        if not self.admin_token:
            self.log_test("PROBLEMA 3 - Admin token required", False, "No admin token available")
            return False

        # Test 1: Create financial sheet with complete data
        sheet_data = {
            "title": "Scheda Finanziaria Test",
            "description": "Test sheet for administrative data",
            "year": 2025,
            "month": 1,
            "data": {
                "total_revenue": 50000,
                "total_expenses": 30000,
                "profit": 20000,
                "commission_rate": 0.15,
                "agent_commission": 7500
            }
        }

        success, result = self.make_request('POST', 'financial-sheets', sheet_data, token=self.admin_token)
        if success:
            sheet_id = result.get('sheet_id')
            self.log_test("PROBLEMA 3 - Create financial sheet", True)
            print(f"   📊 Created sheet ID: {sheet_id}")
        else:
            self.log_test("PROBLEMA 3 - Create financial sheet", False, str(result))
            return False

        # Test 2: Create financial sheet with minimal data
        minimal_sheet_data = {
            "title": "Minimal Sheet",
            "year": 2025
        }

        success, result = self.make_request('POST', 'financial-sheets', minimal_sheet_data, token=self.admin_token)
        if success:
            self.log_test("PROBLEMA 3 - Create minimal financial sheet", True)
        else:
            self.log_test("PROBLEMA 3 - Create minimal financial sheet", False, str(result))

        # Test 3: Retrieve financial sheets
        success, result = self.make_request('GET', 'financial-sheets', token=self.admin_token)
        if success:
            sheets = result if isinstance(result, list) else []
            self.log_test(f"PROBLEMA 3 - Retrieve financial sheets ({len(sheets)} found)", True)
            
            # Print details of sheets found
            for i, sheet in enumerate(sheets[:3]):  # Show first 3 sheets
                print(f"   📋 Sheet {i+1}: {sheet.get('title', 'No title')} - {sheet.get('year', 'No year')}")
        else:
            self.log_test("PROBLEMA 3 - Retrieve financial sheets", False, str(result))

        # Test 4: Update financial sheet (if we have a sheet_id)
        if 'sheet_id' in locals():
            update_data = {
                "title": "Updated Financial Sheet",
                "description": "Updated description",
                "data": {
                    "total_revenue": 55000,
                    "total_expenses": 32000,
                    "profit": 23000
                }
            }
            
            success, result = self.make_request('PUT', f'financial-sheets/{sheet_id}', update_data, token=self.admin_token)
            if success:
                self.log_test("PROBLEMA 3 - Update financial sheet", True)
            else:
                self.log_test("PROBLEMA 3 - Update financial sheet", False, str(result))

        # Test 5: Test invalid financial sheet creation (empty data)
        invalid_data = {}

        success, result = self.make_request('POST', 'financial-sheets', invalid_data, token=self.admin_token, expected_status=422)
        if success:
            self.log_test("PROBLEMA 3 - Invalid sheet rejected (correct)", True)
        else:
            # If it doesn't return 422, check what it actually returns
            success_alt, result_alt = self.make_request('POST', 'financial-sheets', invalid_data, token=self.admin_token)
            if success_alt:
                self.log_test("PROBLEMA 3 - Empty sheet creation allowed", False, "Empty data should be rejected")
            else:
                self.log_test("PROBLEMA 3 - Invalid sheet handling", False, str(result_alt))

        return True

    def run_focused_tests(self):
        """Run the 3 specific problem tests"""
        print("🎯 FOCUSED TESTING - 3 Specific Problems")
        print("="*60)
        print("Testing the exact issues reported by the user:")
        print("1. Financial Reports Admin Access (year=2025)")
        print("2. Itinerary Creation (POST /api/itineraries)")
        print("3. Financial Sheets Creation (POST /api/financial-sheets)")
        print("="*60)
        
        # Authenticate first
        if not self.authenticate_admin():
            print("❌ Cannot proceed without admin authentication")
            return False

        # Run the 3 specific tests
        self.test_problema_1_financial_reports()
        self.test_problema_2_itinerary_creation()
        self.test_problema_3_financial_sheets()

        # Print summary
        print("\n" + "="*60)
        print("📊 FOCUSED TEST RESULTS")
        print("="*60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        
        if self.issues_found:
            print("\n🚨 ISSUES FOUND:")
            for i, issue in enumerate(self.issues_found, 1):
                print(f"{i}. {issue}")
        else:
            print("\n🎉 NO CRITICAL ISSUES FOUND!")
        
        return len(self.issues_found) == 0

def main():
    """Main test execution"""
    tester = FocusedTester()
    success = tester.run_focused_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())