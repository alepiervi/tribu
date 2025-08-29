#!/usr/bin/env python3
"""
Complete Test for the 3 Specific Problems - Creates real data first
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone

class CompleteTester:
    def __init__(self, base_url="https://agenzia-viaggi.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_trip_id = None
        self.created_client_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

    def make_request(self, method: str, endpoint: str, data=None, token=None, expected_status=200):
        """Make HTTP request"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}

            if not success:
                return False, f"Status {response.status_code}, expected {expected_status}. Response: {response_data}"
            
            return True, response_data

        except Exception as e:
            return False, f"Request failed: {str(e)}"

    def authenticate(self):
        """Authenticate with exact credentials"""
        print("🔐 Authenticating with admin@test.it / password123...")
        
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'admin@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.admin_token = result['token']
            self.log_test("Authentication with provided credentials", True)
            return True
        else:
            self.log_test("Authentication failed", False, str(result))
            return False

    def setup_test_data(self):
        """Create necessary test data (client and trip)"""
        print("\n🔧 Setting up test data...")
        
        # Create a test client first
        client_data = {
            'email': 'testclient@example.com',
            'password': 'password123',
            'first_name': 'Test',
            'last_name': 'Client',
            'role': 'client'
        }
        
        success, result = self.make_request('POST', 'auth/register', client_data)
        if success:
            self.created_client_id = result['user']['id']
            self.log_test("Create test client", True)
        else:
            # Try to login if client already exists
            success, result = self.make_request('POST', 'auth/login', {
                'email': 'testclient@example.com',
                'password': 'password123'
            })
            if success:
                self.created_client_id = result['user']['id']
                self.log_test("Use existing test client", True)
            else:
                self.log_test("Create/find test client", False, str(result))
                return False

        # Create a test trip
        trip_data = {
            'title': 'Test Trip for Financial Sheet',
            'destination': 'Mediterranean',
            'description': 'Test trip for financial sheet creation',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': self.created_client_id,
            'trip_type': 'cruise'
        }

        success, result = self.make_request('POST', 'trips', trip_data, token=self.admin_token)
        if success:
            self.created_trip_id = result['id']
            self.log_test("Create test trip", True)
            return True
        else:
            self.log_test("Create test trip", False, str(result))
            return False

    def test_problem_1_financial_reports(self):
        """Test Problem 1: Financial Reports"""
        print("\n1️⃣ TESTING FINANCIAL REPORTS")
        print("-" * 50)
        
        # Test GET /api/reports/financial?year=2025
        success, result = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        if success:
            self.log_test("GET /api/reports/financial?year=2025", True)
            print(f"   📊 Response structure: {list(result.keys())}")
            print(f"   📅 Year correctly processed: {result.get('period', {}).get('year') == 2025}")
            print(f"   💰 Has totals: {bool(result.get('totals'))}")
            print(f"   📈 Monthly breakdown: {len(result.get('monthly_breakdown', []))} months")
            print(f"   🔒 Admin can export Excel: {result.get('can_export_excel') == True}")
            
            # Verify specific fields
            if result.get('can_export_excel') == True:
                self.log_test("Admin has correct Excel export permissions", True)
            else:
                self.log_test("Admin Excel export permissions", False, f"Expected True, got {result.get('can_export_excel')}")
                
            if result.get('period', {}).get('year') == 2025:
                self.log_test("Year parameter correctly processed", True)
            else:
                self.log_test("Year parameter processing", False, f"Expected 2025, got {result.get('period', {}).get('year')}")
                
        else:
            self.log_test("GET /api/reports/financial?year=2025", False, str(result))

    def test_problem_2_itinerary_creation(self):
        """Test Problem 2: Itinerary Creation"""
        print("\n2️⃣ TESTING ITINERARY CREATION")
        print("-" * 50)
        
        # Use the exact data from the review request but with our real trip ID
        itinerary_data = {
            "trip_id": self.created_trip_id,
            "day_number": 1,
            "date": "2025-01-15T10:00:00Z",
            "title": "Test Day",
            "description": "Test description",
            "itinerary_type": "tour_day"
        }
        
        success, result = self.make_request('POST', 'itineraries', itinerary_data, token=self.admin_token)
        if success:
            self.log_test("POST /api/itineraries with correct data", True)
            print(f"   📅 Created itinerary ID: {result.get('id')}")
            print(f"   🎯 Trip ID matches: {result.get('trip_id') == self.created_trip_id}")
            print(f"   📝 Title preserved: {result.get('title') == 'Test Day'}")
            print(f"   🏷️ Type preserved: {result.get('itinerary_type') == 'tour_day'}")
            print(f"   📊 Day number preserved: {result.get('day_number') == 1}")
            
            # Verify all fields are correctly preserved
            for field in ['trip_id', 'day_number', 'title', 'description', 'itinerary_type']:
                if result.get(field) == itinerary_data[field]:
                    self.log_test(f"Field {field} correctly preserved", True)
                else:
                    self.log_test(f"Field {field} preservation", False, f"Expected {itinerary_data[field]}, got {result.get(field)}")
                    
        else:
            self.log_test("POST /api/itineraries with correct data", False, str(result))

    def test_problem_3_financial_sheet(self):
        """Test Problem 3: Financial Sheet Creation"""
        print("\n3️⃣ TESTING FINANCIAL SHEET CREATION")
        print("-" * 50)
        
        # Use the exact data from the review request but with our real trip ID
        admin_data = {
            "trip_id": self.created_trip_id,
            "practice_number": "PR001",
            "booking_number": "BK001",
            "gross_amount": 1500.0,
            "net_amount": 1400.0,
            "discount": 100.0,
            "practice_confirm_date": "2025-01-01T10:00:00Z",
            "client_departure_date": "2025-02-01T10:00:00Z",
            "confirmation_deposit": 500.0
        }
        
        success, result = self.make_request('POST', f'trips/{self.created_trip_id}/admin', admin_data, token=self.admin_token)
        if success:
            self.log_test("POST /api/trips/{trip_id}/admin with correct data", True)
            print(f"   📊 Created admin record ID: {result.get('id')}")
            print(f"   💰 Gross amount: {result.get('gross_amount')}")
            print(f"   💸 Net amount: {result.get('net_amount')}")
            print(f"   🏷️ Practice number: {result.get('practice_number')}")
            print(f"   📋 Booking number: {result.get('booking_number')}")
            
            # Verify calculated fields
            print(f"   💵 Calculated fields:")
            print(f"      - Gross commission: {result.get('gross_commission')}")
            print(f"      - Supplier commission: {result.get('supplier_commission')}")
            print(f"      - Agent commission: {result.get('agent_commission')}")
            print(f"      - Balance due: {result.get('balance_due')}")
            
            # Verify all input fields are preserved
            for field in ['trip_id', 'practice_number', 'booking_number', 'gross_amount', 'net_amount', 'discount', 'confirmation_deposit']:
                if result.get(field) == admin_data[field]:
                    self.log_test(f"Field {field} correctly preserved", True)
                else:
                    self.log_test(f"Field {field} preservation", False, f"Expected {admin_data[field]}, got {result.get(field)}")
            
            # Verify calculated fields exist
            calculated_fields = ['gross_commission', 'supplier_commission', 'agent_commission', 'balance_due']
            for field in calculated_fields:
                if field in result:
                    self.log_test(f"Calculated field {field} present", True)
                else:
                    self.log_test(f"Calculated field {field} missing", False, f"Field {field} should be automatically calculated")
                    
        else:
            self.log_test("POST /api/trips/{trip_id}/admin with correct data", False, str(result))

    def run_complete_tests(self):
        """Run complete tests with real data"""
        print("🎯 COMPLETE TESTING - 3 Specific Problems with Real Data")
        print("="*70)
        print("CREDENZIALI: admin@test.it / password123")
        print("FOCUS: Conferma che tutti e 3 gli endpoint ora funzionano correttamente")
        print("="*70)
        
        if not self.authenticate():
            print("❌ Cannot proceed without authentication")
            return False

        if not self.setup_test_data():
            print("❌ Cannot proceed without test data")
            return False

        # Run the 3 specific tests
        self.test_problem_1_financial_reports()
        self.test_problem_2_itinerary_creation()
        self.test_problem_3_financial_sheet()

        # Final results
        print("\n" + "="*70)
        print("📊 COMPLETE TEST RESULTS")
        print("="*70)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 TUTTI E 3 I PROBLEMI CORRETTI VERIFICATI COME FUNZIONANTI!")
            print("✅ 1. Financial Reports - FUNZIONA CORRETTAMENTE")
            print("✅ 2. Creazione Itinerario - FUNZIONA CORRETTAMENTE") 
            print("✅ 3. Scheda Finanziaria - FUNZIONA CORRETTAMENTE")
            print("\n✨ CONFERMA: Tutti e 3 gli endpoint ora funzionano correttamente con i dati formattati nel modo giusto.")
        else:
            print(f"\n⚠️ {self.tests_run - self.tests_passed} problemi trovati")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CompleteTester()
    success = tester.run_complete_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())