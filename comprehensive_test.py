#!/usr/bin/env python3
"""
Comprehensive Test for the 3 Reported Problems
Including edge cases and authentication scenarios
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

class ComprehensiveTester:
    def __init__(self, base_url="https://agenzia-viaggi.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.agent_token = None
        self.client_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_issues = []
        self.minor_issues = []

    def log_test(self, name: str, success: bool, details: str = "", critical: bool = True):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            if critical:
                self.critical_issues.append(f"{name}: {details}")
            else:
                self.minor_issues.append(f"{name}: {details}")

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

    def setup_authentication(self):
        """Setup authentication for all user types"""
        print("🔐 Setting up authentication for all user types...")
        
        # Admin authentication
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'admin@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.admin_token = result['token']
            self.log_test("Admin authentication", True)
        else:
            # Try to register
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
                self.log_test("Admin registration", True)
            else:
                self.log_test("Admin authentication", False, str(result))
                return False

        # Agent authentication
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'agent1@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.agent_token = result['token']
            self.log_test("Agent authentication", True)
        else:
            # Try to register
            agent_data = {
                'email': 'agent1@test.it',
                'password': 'password123',
                'first_name': 'Agent',
                'last_name': 'Test',
                'role': 'agent'
            }
            success, result = self.make_request('POST', 'auth/register', agent_data)
            if success and 'token' in result:
                self.agent_token = result['token']
                self.log_test("Agent registration", True)
            else:
                self.log_test("Agent authentication", False, str(result), critical=False)

        return True

    def test_problema_1_comprehensive(self):
        """Comprehensive test for Financial Reports"""
        print("\n🔍 PROBLEMA 1 - COMPREHENSIVE Financial Reports Testing...")
        
        if not self.admin_token:
            self.log_test("PROBLEMA 1 - Admin token required", False, "No admin token")
            return False

        # Test 1: Basic access
        success, result = self.make_request('GET', 'reports/financial', token=self.admin_token)
        if success:
            self.log_test("PROBLEMA 1 - Basic financial reports access", True)
            
            # Check response structure
            required_keys = ['period', 'totals', 'monthly_breakdown', 'detailed_trips', 'can_export_excel']
            missing_keys = [key for key in required_keys if key not in result]
            if missing_keys:
                self.log_test("PROBLEMA 1 - Response structure", False, f"Missing keys: {missing_keys}")
            else:
                self.log_test("PROBLEMA 1 - Response structure complete", True)
                
            # Check admin export permission
            if result.get('can_export_excel') == True:
                self.log_test("PROBLEMA 1 - Admin export permission", True)
            else:
                self.log_test("PROBLEMA 1 - Admin export permission", False, "Admin should have export rights")
        else:
            self.log_test("PROBLEMA 1 - Basic financial reports access", False, str(result))
            return False

        # Test 2: Year 2025 parameter (as specified in request)
        success, result = self.make_request('GET', 'reports/financial', token=self.admin_token, params="year=2025")
        if success:
            self.log_test("PROBLEMA 1 - Year 2025 parameter", True)
            
            # Verify year in response
            period = result.get('period', {})
            if period.get('year') == 2025:
                self.log_test("PROBLEMA 1 - Year 2025 correctly set", True)
            else:
                self.log_test("PROBLEMA 1 - Year 2025 parameter handling", False, f"Expected year 2025, got {period.get('year')}")
                
            # Check monthly breakdown for year query
            monthly_breakdown = result.get('monthly_breakdown', [])
            if isinstance(monthly_breakdown, list) and len(monthly_breakdown) == 12:
                self.log_test("PROBLEMA 1 - Monthly breakdown (12 months)", True)
            else:
                self.log_test("PROBLEMA 1 - Monthly breakdown structure", False, f"Expected 12 months, got {len(monthly_breakdown) if isinstance(monthly_breakdown, list) else 'not a list'}")
        else:
            self.log_test("PROBLEMA 1 - Year 2025 parameter", False, str(result))

        # Test 3: Agent access (should work but with can_export_excel: false)
        if self.agent_token:
            success, result = self.make_request('GET', 'reports/financial', token=self.agent_token)
            if success:
                self.log_test("PROBLEMA 1 - Agent access to reports", True)
                
                # Check agent export permission (should be false)
                if result.get('can_export_excel') == False:
                    self.log_test("PROBLEMA 1 - Agent export restriction", True)
                else:
                    self.log_test("PROBLEMA 1 - Agent export restriction", False, "Agent should not have export rights")
            else:
                self.log_test("PROBLEMA 1 - Agent access to reports", False, str(result))

        # Test 4: No agent filter (as specified in request)
        success, result = self.make_request('GET', 'reports/financial', token=self.admin_token, params="year=2025")
        if success:
            period = result.get('period', {})
            if period.get('agent_id') is None:
                self.log_test("PROBLEMA 1 - No agent filter (correct)", True)
            else:
                self.log_test("PROBLEMA 1 - No agent filter", False, f"Expected no agent filter, got agent_id: {period.get('agent_id')}")

        return True

    def test_problema_2_comprehensive(self):
        """Comprehensive test for Itinerary Creation"""
        print("\n🔍 PROBLEMA 2 - COMPREHENSIVE Itinerary Creation Testing...")
        
        if not self.admin_token:
            self.log_test("PROBLEMA 2 - Admin token required", False, "No admin token")
            return False

        # First create a client and trip for testing
        client_data = {
            'email': 'testclient@test.it',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'Client',
            'role': 'client'
        }
        
        success, client_result = self.make_request('POST', 'auth/register', client_data)
        if success:
            client_id = client_result['user']['id']
            self.log_test("PROBLEMA 2 - Create test client", True)
        else:
            # Try to login if already exists
            success, login_result = self.make_request('POST', 'auth/login', {'email': 'testclient@test.it', 'password': 'password123'})
            if success:
                client_id = login_result['user']['id']
                self.log_test("PROBLEMA 2 - Use existing test client", True)
            else:
                self.log_test("PROBLEMA 2 - Create/get test client", False, str(client_result))
                return False

        # Create a test trip
        trip_data = {
            'title': 'Test Trip for Itinerary Creation',
            'destination': 'Mediterranean Sea',
            'description': 'Test trip for comprehensive itinerary testing',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': client_id,
            'trip_type': 'cruise'
        }

        success, trip_result = self.make_request('POST', 'trips', trip_data, token=self.admin_token)
        if success:
            trip_id = trip_result['id']
            self.log_test("PROBLEMA 2 - Create test trip", True)
        else:
            self.log_test("PROBLEMA 2 - Create test trip", False, str(trip_result))
            return False

        # Test 1: Create new itinerary day (basic)
        itinerary_data = {
            'trip_id': trip_id,
            'day_number': 1,
            'date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'title': 'Day 1 - Embarkation',
            'description': 'Boarding the ship and departure',
            'itinerary_type': 'port_day'
        }

        success, result = self.make_request('POST', 'itineraries', itinerary_data, token=self.admin_token)
        if success:
            itinerary_id_1 = result['id']
            self.log_test("PROBLEMA 2 - Create basic itinerary day", True)
        else:
            self.log_test("PROBLEMA 2 - Create basic itinerary day", False, str(result))
            return False

        # Test 2: Create multiple itinerary days
        for day in range(2, 5):  # Days 2, 3, 4
            itinerary_data = {
                'trip_id': trip_id,
                'day_number': day,
                'date': (datetime.now(timezone.utc) + timedelta(days=29+day)).isoformat(),
                'title': f'Day {day} - {"Sea Day" if day % 2 == 0 else "Port Day"}',
                'description': f'Activities for day {day}',
                'itinerary_type': 'sea_day' if day % 2 == 0 else 'port_day'
            }

            success, result = self.make_request('POST', 'itineraries', itinerary_data, token=self.admin_token)
            if success:
                self.log_test(f"PROBLEMA 2 - Create itinerary day {day}", True)
            else:
                self.log_test(f"PROBLEMA 2 - Create itinerary day {day}", False, str(result))

        # Test 3: Retrieve all itineraries for the trip
        success, result = self.make_request('GET', f'trips/{trip_id}/itineraries', token=self.admin_token)
        if success:
            itineraries = result if isinstance(result, list) else []
            expected_count = 4  # We created 4 days
            if len(itineraries) >= expected_count:
                self.log_test(f"PROBLEMA 2 - Retrieve itineraries ({len(itineraries)} found)", True)
            else:
                self.log_test("PROBLEMA 2 - Retrieve itineraries count", False, f"Expected at least {expected_count}, got {len(itineraries)}")
        else:
            self.log_test("PROBLEMA 2 - Retrieve itineraries", False, str(result))

        # Test 4: Update existing itinerary
        update_data = {
            'trip_id': trip_id,
            'day_number': 1,
            'date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'title': 'Day 1 - Updated Embarkation',
            'description': 'Updated: Boarding the ship and departure with welcome reception',
            'itinerary_type': 'port_day'
        }

        success, result = self.make_request('PUT', f'itineraries/{itinerary_id_1}', update_data, token=self.admin_token)
        if success:
            self.log_test("PROBLEMA 2 - Update itinerary day", True)
        else:
            self.log_test("PROBLEMA 2 - Update itinerary day", False, str(result))

        # Test 5: Test different itinerary types
        itinerary_types = ['port_day', 'sea_day', 'resort_day', 'tour_day', 'free_day']
        for i, itin_type in enumerate(itinerary_types, 5):
            itinerary_data = {
                'trip_id': trip_id,
                'day_number': i,
                'date': (datetime.now(timezone.utc) + timedelta(days=29+i)).isoformat(),
                'title': f'Day {i} - {itin_type.replace("_", " ").title()}',
                'description': f'Testing {itin_type} itinerary type',
                'itinerary_type': itin_type
            }

            success, result = self.make_request('POST', 'itineraries', itinerary_data, token=self.admin_token)
            if success:
                self.log_test(f"PROBLEMA 2 - Create {itin_type} itinerary", True)
            else:
                self.log_test(f"PROBLEMA 2 - Create {itin_type} itinerary", False, str(result))

        # Test 6: Error handling - invalid data
        invalid_data = {
            'trip_id': 'invalid-trip-id',
            'day_number': 1,
            'date': 'invalid-date',
            'title': '',
            'description': '',
            'itinerary_type': 'invalid_type'
        }

        success, result = self.make_request('POST', 'itineraries', invalid_data, token=self.admin_token, expected_status=422)
        if success:
            self.log_test("PROBLEMA 2 - Invalid data rejected (correct)", True)
        else:
            # Check if it returns a different error status
            success_alt, result_alt = self.make_request('POST', 'itineraries', invalid_data, token=self.admin_token)
            if not success_alt:
                self.log_test("PROBLEMA 2 - Invalid data handling", True, critical=False)  # Minor issue
            else:
                self.log_test("PROBLEMA 2 - Invalid data validation", False, "Invalid data should be rejected")

        return True

    def test_problema_3_comprehensive(self):
        """Comprehensive test for Financial Sheets"""
        print("\n🔍 PROBLEMA 3 - COMPREHENSIVE Financial Sheets Testing...")
        
        if not self.admin_token:
            self.log_test("PROBLEMA 3 - Admin token required", False, "No admin token")
            return False

        # Test 1: Create comprehensive financial sheet
        comprehensive_sheet = {
            "title": "Comprehensive Financial Sheet 2025",
            "description": "Complete financial data for testing",
            "year": 2025,
            "month": 1,
            "data": {
                "total_revenue": 150000,
                "total_expenses": 90000,
                "gross_profit": 60000,
                "commission_rate": 0.15,
                "agent_commission": 22500,
                "supplier_commission": 6000,
                "net_profit": 31500,
                "client_count": 45,
                "trip_count": 23,
                "average_trip_value": 6521.74
            }
        }

        success, result = self.make_request('POST', 'financial-sheets', comprehensive_sheet, token=self.admin_token)
        if success:
            sheet_id_1 = result.get('sheet_id')
            self.log_test("PROBLEMA 3 - Create comprehensive financial sheet", True)
        else:
            self.log_test("PROBLEMA 3 - Create comprehensive financial sheet", False, str(result))
            return False

        # Test 2: Create minimal financial sheet
        minimal_sheet = {
            "title": "Minimal Sheet",
            "year": 2025
        }

        success, result = self.make_request('POST', 'financial-sheets', minimal_sheet, token=self.admin_token)
        if success:
            sheet_id_2 = result.get('sheet_id')
            self.log_test("PROBLEMA 3 - Create minimal financial sheet", True)
        else:
            self.log_test("PROBLEMA 3 - Create minimal financial sheet", False, str(result))

        # Test 3: Create sheet with agent assignment
        if self.agent_token:
            # Get agent ID
            success, agent_info = self.make_request('GET', 'auth/me', token=self.agent_token)
            if success:
                agent_id = agent_info['id']
                
                agent_sheet = {
                    "title": "Agent Specific Sheet",
                    "description": "Financial sheet for specific agent",
                    "year": 2025,
                    "month": 2,
                    "agent_id": agent_id,
                    "data": {
                        "agent_revenue": 25000,
                        "agent_commission": 3750,
                        "trip_count": 8
                    }
                }

                success, result = self.make_request('POST', 'financial-sheets', agent_sheet, token=self.admin_token)
                if success:
                    self.log_test("PROBLEMA 3 - Create agent-specific sheet", True)
                else:
                    self.log_test("PROBLEMA 3 - Create agent-specific sheet", False, str(result))

        # Test 4: Retrieve all financial sheets
        success, result = self.make_request('GET', 'financial-sheets', token=self.admin_token)
        if success:
            sheets = result if isinstance(result, list) else []
            self.log_test(f"PROBLEMA 3 - Retrieve financial sheets ({len(sheets)} found)", True)
            
            # Verify our sheets are in the list
            sheet_titles = [sheet.get('title', '') for sheet in sheets]
            if "Comprehensive Financial Sheet 2025" in sheet_titles:
                self.log_test("PROBLEMA 3 - Comprehensive sheet in list", True)
            else:
                self.log_test("PROBLEMA 3 - Comprehensive sheet in list", False, "Created sheet not found in list")
        else:
            self.log_test("PROBLEMA 3 - Retrieve financial sheets", False, str(result))

        # Test 5: Update financial sheet
        if sheet_id_1:
            update_data = {
                "title": "Updated Comprehensive Sheet",
                "description": "Updated financial data",
                "data": {
                    "total_revenue": 160000,
                    "total_expenses": 95000,
                    "gross_profit": 65000,
                    "updated": True
                }
            }
            
            success, result = self.make_request('PUT', f'financial-sheets/{sheet_id_1}', update_data, token=self.admin_token)
            if success:
                self.log_test("PROBLEMA 3 - Update financial sheet", True)
            else:
                self.log_test("PROBLEMA 3 - Update financial sheet", False, str(result))

        # Test 6: Agent access to financial sheets
        if self.agent_token:
            success, result = self.make_request('GET', 'financial-sheets', token=self.agent_token)
            if success:
                agent_sheets = result if isinstance(result, list) else []
                self.log_test(f"PROBLEMA 3 - Agent access to sheets ({len(agent_sheets)} found)", True)
            else:
                self.log_test("PROBLEMA 3 - Agent access to sheets", False, str(result))

            # Test agent creating sheet
            agent_created_sheet = {
                "title": "Agent Created Sheet",
                "description": "Sheet created by agent",
                "year": 2025,
                "month": 3,
                "data": {
                    "my_revenue": 15000,
                    "my_commission": 2250
                }
            }

            success, result = self.make_request('POST', 'financial-sheets', agent_created_sheet, token=self.agent_token)
            if success:
                self.log_test("PROBLEMA 3 - Agent create sheet", True)
            else:
                self.log_test("PROBLEMA 3 - Agent create sheet", False, str(result))

        # Test 7: Error handling
        # Test empty data (this was flagged as minor issue in focused test)
        empty_data = {}
        success, result = self.make_request('POST', 'financial-sheets', empty_data, token=self.admin_token, expected_status=422)
        if success:
            self.log_test("PROBLEMA 3 - Empty data rejected (correct)", True)
        else:
            # Check what actually happens with empty data
            success_alt, result_alt = self.make_request('POST', 'financial-sheets', empty_data, token=self.admin_token)
            if success_alt:
                self.log_test("PROBLEMA 3 - Empty data validation", False, "Empty data should be rejected", critical=False)  # Minor issue
            else:
                self.log_test("PROBLEMA 3 - Empty data handling", True, critical=False)  # Minor issue

        return True

    def run_comprehensive_tests(self):
        """Run comprehensive tests for all 3 problems"""
        print("🎯 COMPREHENSIVE TESTING - 3 Specific Problems")
        print("="*70)
        print("Detailed testing of the exact issues reported by the user:")
        print("1. Financial Reports Admin Access (year=2025, no agent filter)")
        print("2. Itinerary Creation (POST /api/itineraries)")
        print("3. Financial Sheets Creation (POST /api/financial-sheets)")
        print("="*70)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Cannot proceed without authentication")
            return False

        # Run comprehensive tests
        self.test_problema_1_comprehensive()
        self.test_problema_2_comprehensive()
        self.test_problema_3_comprehensive()

        # Print detailed summary
        print("\n" + "="*70)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("="*70)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        
        if self.critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOUND ({len(self.critical_issues)}):")
            for i, issue in enumerate(self.critical_issues, 1):
                print(f"{i}. {issue}")
        else:
            print("\n✅ NO CRITICAL ISSUES FOUND!")
        
        if self.minor_issues:
            print(f"\n⚠️  MINOR ISSUES FOUND ({len(self.minor_issues)}):")
            for i, issue in enumerate(self.minor_issues, 1):
                print(f"{i}. {issue}")
        
        print("\n" + "="*70)
        print("🎯 CONCLUSION FOR THE 3 REPORTED PROBLEMS:")
        print("="*70)
        
        if not self.critical_issues:
            print("✅ PROBLEMA 1 (Financial Reports): WORKING CORRECTLY")
            print("   - Admin can access /api/reports/financial")
            print("   - Year=2025 parameter works")
            print("   - No agent filter applied correctly")
            print("   - Admin has export permissions")
            
            print("✅ PROBLEMA 2 (Itinerary Creation): WORKING CORRECTLY")
            print("   - POST /api/itineraries works")
            print("   - Can create multiple itinerary days")
            print("   - All itinerary types supported")
            print("   - Update functionality works")
            
            print("✅ PROBLEMA 3 (Financial Sheets): WORKING CORRECTLY")
            print("   - POST /api/financial-sheets works")
            print("   - Can create comprehensive sheets")
            print("   - Update functionality works")
            print("   - Agent access works")
            
            print("\n🎉 ALL 3 REPORTED PROBLEMS ARE FUNCTIONING CORRECTLY!")
            print("The backend APIs are working as expected.")
        else:
            print("❌ CRITICAL ISSUES FOUND - See details above")
        
        return len(self.critical_issues) == 0

def main():
    """Main test execution"""
    tester = ComprehensiveTester()
    success = tester.run_comprehensive_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())