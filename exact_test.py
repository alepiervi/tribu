#!/usr/bin/env python3
"""
Exact Test for the 3 Specific Problems with Exact Data from Review Request
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone

class ExactTester:
    def __init__(self, base_url="https://agenzia-viaggi.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

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
        """Authenticate with exact credentials from review request"""
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

    def test_exact_problems(self):
        """Test the exact 3 problems with exact data from review request"""
        
        print("\n🎯 TESTING EXACT 3 PROBLEMS FROM REVIEW REQUEST")
        print("="*70)
        
        # PROBLEM 1: Financial Reports
        print("\n1️⃣ FINANCIAL REPORTS: GET /api/reports/financial?year=2025")
        success, result = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        if success:
            self.log_test("Financial Reports - GET /api/reports/financial?year=2025", True)
            print(f"   📊 Response structure: {list(result.keys())}")
            print(f"   📅 Year: {result.get('period', {}).get('year')}")
            print(f"   💰 Totals: {bool(result.get('totals'))}")
            print(f"   📈 Monthly breakdown: {len(result.get('monthly_breakdown', []))} months")
            print(f"   🔒 Can export Excel: {result.get('can_export_excel')}")
        else:
            self.log_test("Financial Reports - GET /api/reports/financial?year=2025", False, str(result))

        # PROBLEM 2: Itinerary Creation with EXACT data from review request
        print("\n2️⃣ ITINERARY CREATION: POST /api/itineraries")
        itinerary_data = {
            "trip_id": "test-trip-id",
            "day_number": 1,
            "date": "2025-01-15T10:00:00Z",
            "title": "Test Day",
            "description": "Test description",
            "itinerary_type": "tour_day"
        }
        
        success, result = self.make_request('POST', 'itineraries', itinerary_data, token=self.admin_token)
        if success:
            self.log_test("Itinerary Creation - POST /api/itineraries", True)
            print(f"   📅 Created itinerary ID: {result.get('id')}")
            print(f"   🎯 Trip ID: {result.get('trip_id')}")
            print(f"   📝 Title: {result.get('title')}")
            print(f"   🏷️ Type: {result.get('itinerary_type')}")
        else:
            self.log_test("Itinerary Creation - POST /api/itineraries", False, str(result))

        # PROBLEM 3: Financial Sheet Creation with EXACT data from review request
        print("\n3️⃣ FINANCIAL SHEET: POST /api/trips/{trip_id}/admin")
        trip_id = "test-trip-id"
        admin_data = {
            "trip_id": "test-trip-id",
            "practice_number": "PR001",
            "booking_number": "BK001",
            "gross_amount": 1500.0,
            "net_amount": 1400.0,
            "discount": 100.0,
            "practice_confirm_date": "2025-01-01T10:00:00Z",
            "client_departure_date": "2025-02-01T10:00:00Z",
            "confirmation_deposit": 500.0
        }
        
        success, result = self.make_request('POST', f'trips/{trip_id}/admin', admin_data, token=self.admin_token)
        if success:
            self.log_test("Financial Sheet - POST /api/trips/{trip_id}/admin", True)
            print(f"   📊 Created admin ID: {result.get('id')}")
            print(f"   💰 Gross amount: {result.get('gross_amount')}")
            print(f"   💸 Net amount: {result.get('net_amount')}")
            print(f"   🏷️ Practice number: {result.get('practice_number')}")
            print(f"   📋 Booking number: {result.get('booking_number')}")
            print(f"   💵 Commission calculations:")
            print(f"      - Gross commission: {result.get('gross_commission')}")
            print(f"      - Supplier commission: {result.get('supplier_commission')}")
            print(f"      - Agent commission: {result.get('agent_commission')}")
            print(f"      - Balance due: {result.get('balance_due')}")
        else:
            self.log_test("Financial Sheet - POST /api/trips/{trip_id}/admin", False, str(result))

    def run_exact_tests(self):
        """Run exact tests as specified in review request"""
        print("🎯 EXACT TESTING - Review Request Verification")
        print("="*70)
        print("CREDENZIALI: admin@test.it / password123")
        print("="*70)
        
        if not self.authenticate():
            print("❌ Cannot proceed without authentication")
            return False

        self.test_exact_problems()

        # Final results
        print("\n" + "="*70)
        print("📊 EXACT TEST RESULTS")
        print("="*70)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL 3 CORRECTIONS VERIFIED AS WORKING!")
            print("✅ Financial Reports - FUNZIONA CORRETTAMENTE")
            print("✅ Creazione Itinerario - FUNZIONA CORRETTAMENTE") 
            print("✅ Scheda Finanziaria - FUNZIONA CORRETTAMENTE")
            print("\n✨ FOCUS: Tutti e 3 gli endpoint ora funzionano correttamente con i dati formattati nel modo giusto.")
        else:
            print(f"\n⚠️ {self.tests_run - self.tests_passed} problemi trovati")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ExactTester()
    success = tester.run_exact_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())