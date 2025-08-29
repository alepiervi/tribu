#!/usr/bin/env python3
"""
Focused Payment Registration Testing for Travel Agency Platform
Tests payment registration functionality as requested in the review
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

class PaymentRegistrationTester:
    def __init__(self, base_url="https://viaggi-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'trips': [],
            'trip_admins': [],
            'payments': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    token: str = None, expected_status: int = 200) -> tuple:
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}/{endpoint}"
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
                response_data = {"text": response.text}

            if not success:
                return False, f"Status {response.status_code}, expected {expected_status}. Response: {response_data}"
            
            return True, response_data

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"

    def authenticate_admin(self):
        """Authenticate with provided admin credentials"""
        print("🔐 Authenticating with admin@test.it...")
        
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'admin@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.admin_token = result['token']
            self.log_test("Admin authentication (admin@test.it)", True)
            return True
        else:
            self.log_test("Admin authentication failed", False, str(result))
            return False

    def setup_test_data(self):
        """Setup: Create a trip and administrative data with financial sheet"""
        print("\n📋 SETUP: Creating trip and administrative data...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return None, None

        # Get admin user info to use as client for testing
        success, admin_info = self.make_request('GET', 'auth/me', token=self.admin_token)
        if not success:
            print("❌ Could not get admin info")
            return None, None
        
        admin_id = admin_info['id']

        # Create a test trip
        trip_data = {
            'title': 'Test Payment Registration Trip',
            'destination': 'Mediterranean Cruise',
            'description': 'Trip for testing payment registration functionality',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': admin_id,  # Using admin as client for testing
            'trip_type': 'cruise'
        }

        success, result = self.make_request('POST', 'trips', trip_data, token=self.admin_token)
        if success:
            trip_id = result['id']
            self.created_resources['trips'].append(trip_id)
            self.log_test("Create test trip", True)
            print(f"   📝 Trip ID: {trip_id}")
        else:
            self.log_test("Create test trip", False, str(result))
            return None, None

        # Create trip administrative data (financial sheet)
        admin_data = {
            'trip_id': trip_id,
            'practice_number': 'PR2025001',
            'booking_number': 'BK2025001',
            'gross_amount': 2200.0,
            'net_amount': 2000.0,
            'discount': 100.0,
            'practice_confirm_date': datetime.now(timezone.utc).isoformat(),
            'client_departure_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'confirmation_deposit': 500.0
        }

        success, result = self.make_request('POST', f'trips/{trip_id}/admin', admin_data, token=self.admin_token)
        if success:
            admin_id = result['id']
            self.created_resources['trip_admins'].append(admin_id)
            self.log_test("Create trip administrative data", True)
            print(f"   💰 Admin ID: {admin_id}")
            print(f"   💵 Gross Amount: €{admin_data['gross_amount']}")
            print(f"   💸 Confirmation Deposit: €{admin_data['confirmation_deposit']}")
            print(f"   🧮 Balance Due: €{admin_data['gross_amount'] - admin_data['confirmation_deposit']}")
        else:
            self.log_test("Create trip administrative data", False, str(result))
            return trip_id, None

        return trip_id, admin_id

    def test_payment_registration_correct_data(self, admin_id: str):
        """Test payment registration with correct data"""
        print("\n💳 TEST PAYMENT: Registering payment with correct data...")
        
        if not admin_id:
            print("❌ No admin_id available")
            return False

        # Test data as specified in the review request
        payment_data = {
            "trip_admin_id": admin_id,
            "amount": 500.0,
            "payment_date": "2025-01-15T10:00:00Z", 
            "payment_type": "installment",
            "notes": "Test payment"
        }

        print(f"   📊 Payment Data: {json.dumps(payment_data, indent=2)}")

        # Register the payment
        success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', payment_data, token=self.admin_token)
        
        if success:
            payment_id = result['id']
            self.created_resources['payments'].append(payment_id)
            self.log_test("Register payment with correct data", True)
            print(f"   ✅ Payment ID: {payment_id}")
            print(f"   💰 Amount: €{result.get('amount', 'N/A')}")
            print(f"   📅 Date: {result.get('payment_date', 'N/A')}")
            print(f"   🏷️  Type: {result.get('payment_type', 'N/A')}")
            return payment_id
        else:
            self.log_test("Register payment with correct data", False, str(result))
            return None

    def test_balance_update(self, admin_id: str, payment_amount: float):
        """Verify that balance updates automatically after payment"""
        print("\n🧮 VERIFICATION: Checking balance update...")
        
        if not admin_id:
            print("❌ No admin_id available")
            return False

        # Get updated trip admin data
        success, result = self.make_request('GET', f'trips/{self.created_resources["trips"][0]}/admin', token=self.admin_token)
        
        if success:
            self.log_test("Retrieve updated trip admin data", True)
            
            balance_due = result.get('balance_due', 0)
            gross_amount = result.get('gross_amount', 0)
            confirmation_deposit = result.get('confirmation_deposit', 0)
            
            print(f"   💰 Gross Amount: €{gross_amount}")
            print(f"   💸 Confirmation Deposit: €{confirmation_deposit}")
            print(f"   💳 Payment Made: €{payment_amount}")
            print(f"   🧮 Current Balance Due: €{balance_due}")
            
            # Calculate expected balance
            expected_balance = gross_amount - confirmation_deposit - payment_amount
            
            if abs(balance_due - expected_balance) < 0.01:  # Allow for floating point precision
                self.log_test("Balance updated correctly", True)
                print(f"   ✅ Expected: €{expected_balance}, Actual: €{balance_due}")
            else:
                self.log_test("Balance update incorrect", False, f"Expected: €{expected_balance}, Actual: €{balance_due}")
            
            return True
        else:
            self.log_test("Retrieve updated trip admin data", False, str(result))
            return False

    def test_payment_list_includes_new_payment(self, admin_id: str, payment_id: str):
        """Verify that payment list includes the new payment"""
        print("\n📋 VERIFICATION: Checking payment list...")
        
        if not admin_id or not payment_id:
            print("❌ Missing admin_id or payment_id")
            return False

        # Get payment list
        success, result = self.make_request('GET', f'trip-admin/{admin_id}/payments', token=self.admin_token)
        
        if success:
            self.log_test("Retrieve payment list", True)
            
            payments = result if isinstance(result, list) else []
            print(f"   📊 Total payments found: {len(payments)}")
            
            # Check if our payment is in the list
            found_payment = None
            for payment in payments:
                if payment.get('id') == payment_id:
                    found_payment = payment
                    break
            
            if found_payment:
                self.log_test("New payment found in list", True)
                print(f"   ✅ Payment ID: {found_payment.get('id')}")
                print(f"   💰 Amount: €{found_payment.get('amount', 'N/A')}")
                print(f"   📅 Date: {found_payment.get('payment_date', 'N/A')}")
                print(f"   🏷️  Type: {found_payment.get('payment_type', 'N/A')}")
                print(f"   📝 Notes: {found_payment.get('notes', 'N/A')}")
            else:
                self.log_test("New payment not found in list", False, f"Payment {payment_id} not in list of {len(payments)} payments")
            
            return found_payment is not None
        else:
            self.log_test("Retrieve payment list", False, str(result))
            return False

    def test_validation_errors(self, admin_id: str):
        """Test with incorrect data to verify validation errors"""
        print("\n❌ TEST VALIDATION: Testing with incorrect data...")
        
        if not admin_id:
            print("❌ No admin_id available")
            return False

        # Test 1: Amount as string
        print("\n   🧪 Test 1: Amount as string")
        invalid_data_1 = {
            "trip_admin_id": admin_id,
            "amount": "500.0",  # String instead of number
            "payment_date": "2025-01-15T10:00:00Z",
            "payment_type": "installment",
            "notes": "Test payment with string amount"
        }
        
        success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', invalid_data_1, token=self.admin_token, expected_status=422)
        if success:
            self.log_test("Validation error for string amount", True)
            print(f"      ✅ Correctly rejected string amount")
        else:
            # Try with 400 status code as well
            success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', invalid_data_1, token=self.admin_token, expected_status=400)
            if success:
                self.log_test("Validation error for string amount (400)", True)
            else:
                self.log_test("Validation error for string amount", False, f"Expected validation error, got: {result}")

        # Test 2: Invalid date format
        print("\n   🧪 Test 2: Invalid date format")
        invalid_data_2 = {
            "trip_admin_id": admin_id,
            "amount": 500.0,
            "payment_date": "2025-01-15",  # Wrong format, missing time and timezone
            "payment_type": "installment",
            "notes": "Test payment with invalid date"
        }
        
        success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', invalid_data_2, token=self.admin_token, expected_status=422)
        if success:
            self.log_test("Validation error for invalid date format", True)
            print(f"      ✅ Correctly rejected invalid date format")
        else:
            # Try with 400 status code as well
            success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', invalid_data_2, token=self.admin_token, expected_status=400)
            if success:
                self.log_test("Validation error for invalid date format (400)", True)
            else:
                self.log_test("Validation error for invalid date format", False, f"Expected validation error, got: {result}")

        # Test 3: Missing trip_admin_id
        print("\n   🧪 Test 3: Missing trip_admin_id")
        invalid_data_3 = {
            # "trip_admin_id": admin_id,  # Missing required field
            "amount": 500.0,
            "payment_date": "2025-01-15T10:00:00Z",
            "payment_type": "installment",
            "notes": "Test payment without admin_id"
        }
        
        success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', invalid_data_3, token=self.admin_token, expected_status=422)
        if success:
            self.log_test("Validation error for missing trip_admin_id", True)
            print(f"      ✅ Correctly rejected missing trip_admin_id")
        else:
            # Try with 400 status code as well
            success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', invalid_data_3, token=self.admin_token, expected_status=400)
            if success:
                self.log_test("Validation error for missing trip_admin_id (400)", True)
            else:
                self.log_test("Validation error for missing trip_admin_id", False, f"Expected validation error, got: {result}")

        # Test 4: Invalid admin_id
        print("\n   🧪 Test 4: Invalid admin_id")
        invalid_data_4 = {
            "trip_admin_id": "invalid-admin-id-12345",
            "amount": 500.0,
            "payment_date": "2025-01-15T10:00:00Z",
            "payment_type": "installment",
            "notes": "Test payment with invalid admin_id"
        }
        
        success, result = self.make_request('POST', f'trip-admin/invalid-admin-id-12345/payments', invalid_data_4, token=self.admin_token, expected_status=404)
        if success:
            self.log_test("Error for invalid admin_id", True)
            print(f"      ✅ Correctly rejected invalid admin_id")
        else:
            self.log_test("Error for invalid admin_id", False, f"Expected 404 error, got: {result}")

        return True

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 CLEANUP: Removing test data...")
        
        # Delete payments
        for payment_id in self.created_resources['payments']:
            success, result = self.make_request('DELETE', f'payments/{payment_id}', token=self.admin_token)
            if success:
                print(f"   ✅ Deleted payment: {payment_id}")
            else:
                print(f"   ⚠️  Failed to delete payment: {payment_id}")

        # Delete trips (this should cascade delete trip_admin data)
        for trip_id in self.created_resources['trips']:
            success, result = self.make_request('DELETE', f'trips/{trip_id}', token=self.admin_token)
            if success:
                print(f"   ✅ Deleted trip: {trip_id}")
            else:
                print(f"   ⚠️  Failed to delete trip: {trip_id}")

    def run_payment_registration_tests(self):
        """Run all payment registration tests"""
        print("🚀 Starting Payment Registration Tests...")
        print(f"Testing against: {self.base_url}")
        print("🎯 FOCUS: Testing payment registration functionality")
        
        # Step 1: Authenticate
        if not self.authenticate_admin():
            print("❌ Authentication failed - stopping tests")
            return False

        # Step 2: Setup test data
        trip_id, admin_id = self.setup_test_data()
        if not trip_id or not admin_id:
            print("❌ Setup failed - stopping tests")
            return False

        # Step 3: Test payment registration with correct data
        payment_id = self.test_payment_registration_correct_data(admin_id)
        if not payment_id:
            print("❌ Payment registration failed - stopping tests")
            return False

        # Step 4: Verify balance update
        self.test_balance_update(admin_id, 500.0)

        # Step 5: Verify payment appears in list
        self.test_payment_list_includes_new_payment(admin_id, payment_id)

        # Step 6: Test validation errors
        self.test_validation_errors(admin_id)

        # Step 7: Cleanup
        self.cleanup_test_data()

        # Print final results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All payment registration tests passed!")
            return True
        else:
            failed_tests = self.tests_run - self.tests_passed
            print(f"⚠️  {failed_tests} test(s) failed")
            return False

def main():
    """Main test execution"""
    tester = PaymentRegistrationTester()
    success = tester.run_payment_registration_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())