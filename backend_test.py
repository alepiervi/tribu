#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Travel Agency Platform
Tests all endpoints including authentication, trips, users, financial management
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional

class TravelAgencyAPITester:
    def __init__(self, base_url="https://agenzia-viaggi.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.agent_token = None
        self.client_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'users': [],
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

    def test_authentication(self):
        """Test authentication endpoints with provided credentials"""
        print("\n🔐 Testing Authentication System...")
        
        # First try to login with provided credentials
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'admin@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.admin_token = result['token']
            self.log_test("Admin login (admin@test.it)", True)
        else:
            # If login fails, try to register the admin user
            print("⚠️  Admin login failed, attempting to register admin user...")
            admin_data = {
                'email': 'admin@test.it',
                'password': 'password123',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin'
            }
            
            success, result = self.make_request('POST', 'auth/register', admin_data)
            if success and 'token' in result:
                self.admin_token = result['token']
                self.log_test("Admin registration (admin@test.it)", True)
            else:
                self.log_test("Admin login/registration failed", False, str(result))
                return False

        # Try agent login or register
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'agent1@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.agent_token = result['token']
            self.log_test("Agent login (agent1@test.it)", True)
        else:
            # If login fails, try to register the agent user
            print("⚠️  Agent login failed, attempting to register agent user...")
            agent_data = {
                'email': 'agent1@test.it',
                'password': 'password123',
                'first_name': 'Agent',
                'last_name': 'One',
                'role': 'agent'
            }
            
            success, result = self.make_request('POST', 'auth/register', agent_data)
            if success and 'token' in result:
                self.agent_token = result['token']
                self.log_test("Agent registration (agent1@test.it)", True)
            else:
                self.log_test("Agent login/registration failed", False, str(result))

        # Try client login or register
        success, result = self.make_request(
            'POST', 'auth/login',
            {'email': 'client1@test.it', 'password': 'password123'}
        )
        
        if success and 'token' in result:
            self.client_token = result['token']
            self.log_test("Client login (client1@test.it)", True)
        else:
            # If login fails, try to register the client user
            print("⚠️  Client login failed, attempting to register client user...")
            client_data = {
                'email': 'client1@test.it',
                'password': 'password123',
                'first_name': 'Client',
                'last_name': 'One',
                'role': 'client'
            }
            
            success, result = self.make_request('POST', 'auth/register', client_data)
            if success and 'token' in result:
                self.client_token = result['token']
                self.log_test("Client registration (client1@test.it)", True)
            else:
                self.log_test("Client login/registration failed", False, str(result))

        # Test /auth/me endpoint for all roles
        if self.admin_token:
            success, result = self.make_request('GET', 'auth/me', token=self.admin_token)
            self.log_test("Get admin user info", success, str(result) if not success else "")
        
        if self.agent_token:
            success, result = self.make_request('GET', 'auth/me', token=self.agent_token)
            self.log_test("Get agent user info", success, str(result) if not success else "")
            
        if self.client_token:
            success, result = self.make_request('GET', 'auth/me', token=self.client_token)
            self.log_test("Get client user info", success, str(result) if not success else "")

        return True

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n👥 Testing User Management...")
        
        if not self.admin_token:
            print("❌ Skipping user management tests - no admin token")
            return False

        # Test get all users (admin)
        success, result = self.make_request('GET', 'users', token=self.admin_token)
        self.log_test("Get all users (admin)", success, str(result) if not success else "")

        # Test get clients
        success, result = self.make_request('GET', 'clients', token=self.admin_token)
        self.log_test("Get clients", success, str(result) if not success else "")

        # Test agent access to users
        if self.agent_token:
            success, result = self.make_request('GET', 'users', token=self.agent_token)
            self.log_test("Get users (agent)", success, str(result) if not success else "")

        return True

    def test_trip_management(self):
        """Test trip management endpoints"""
        print("\n🧳 Testing Trip Management...")
        
        if not self.agent_token or not self.client_token:
            print("❌ Skipping trip tests - missing tokens")
            return False

        # Get client ID for trip creation
        success, client_info = self.make_request('GET', 'auth/me', token=self.client_token)
        if not success:
            print("❌ Could not get client info")
            return False
        
        client_id = client_info['id']

        # Create a trip
        trip_data = {
            'title': 'Test Cruise to Mediterranean',
            'destination': 'Mediterranean Sea',
            'description': 'A wonderful cruise experience',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': client_id,
            'trip_type': 'cruise'
        }

        success, result = self.make_request('POST', 'trips', trip_data, token=self.agent_token, expected_status=200)
        if success:
            trip_id = result['id']
            self.created_resources['trips'].append(trip_id)
            self.log_test("Create trip", True)
        else:
            self.log_test("Create trip", False, str(result))
            return False

        # Test get trips
        success, result = self.make_request('GET', 'trips', token=self.agent_token)
        self.log_test("Get trips (agent)", success, str(result) if not success else "")

        success, result = self.make_request('GET', 'trips', token=self.client_token)
        self.log_test("Get trips (client)", success, str(result) if not success else "")

        # Test get trips with details
        success, result = self.make_request('GET', 'trips/with-details', token=self.agent_token)
        self.log_test("Get trips with details", success, str(result) if not success else "")

        # Test get specific trip
        success, result = self.make_request('GET', f'trips/{trip_id}', token=self.agent_token)
        self.log_test("Get specific trip", success, str(result) if not success else "")

        # Test get trip with full details
        success, result = self.make_request('GET', f'trips/{trip_id}/full', token=self.agent_token)
        self.log_test("Get trip with full details", success, str(result) if not success else "")

        # Test update trip
        update_data = {
            'description': 'Updated cruise description',
            'status': 'active'
        }
        success, result = self.make_request('PUT', f'trips/{trip_id}', update_data, token=self.agent_token)
        self.log_test("Update trip", success, str(result) if not success else "")

        return trip_id

    def test_financial_management(self, trip_id: str):
        """Test financial management endpoints"""
        print("\n💰 Testing Financial Management...")
        
        if not self.agent_token or not trip_id:
            print("❌ Skipping financial tests - missing requirements")
            return False

        # Create trip admin record
        admin_data = {
            'trip_id': trip_id,
            'practice_number': 'PR001',
            'booking_number': 'BK001',
            'gross_amount': 2000.0,
            'net_amount': 1800.0,
            'discount': 100.0,
            'practice_confirm_date': datetime.now(timezone.utc).isoformat(),
            'client_departure_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'confirmation_deposit': 500.0
        }

        success, result = self.make_request('POST', f'trips/{trip_id}/admin', admin_data, token=self.agent_token)
        if success:
            admin_id = result['id']
            self.created_resources['trip_admins'].append(admin_id)
            self.log_test("Create trip admin", True)
        else:
            self.log_test("Create trip admin", False, str(result))
            return False

        # Test get trip admin
        success, result = self.make_request('GET', f'trips/{trip_id}/admin', token=self.agent_token)
        self.log_test("Get trip admin", success, str(result) if not success else "")

        # Test update trip admin
        update_data = {
            'gross_amount': 2200.0,
            'status': 'confirmed'
        }
        success, result = self.make_request('PUT', f'trip-admin/{admin_id}', update_data, token=self.agent_token)
        self.log_test("Update trip admin", success, str(result) if not success else "")

        # Create payment installment
        payment_data = {
            'trip_admin_id': admin_id,
            'amount': 700.0,
            'payment_date': (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
            'payment_type': 'installment',
            'notes': 'First installment'
        }

        success, result = self.make_request('POST', f'trip-admin/{admin_id}/payments', payment_data, token=self.agent_token)
        if success:
            payment_id = result['id']
            self.created_resources['payments'].append(payment_id)
            self.log_test("Create payment installment", True)
        else:
            self.log_test("Create payment installment", False, str(result))

        # Test get payments
        success, result = self.make_request('GET', f'trip-admin/{admin_id}/payments', token=self.agent_token)
        self.log_test("Get payment installments", success, str(result) if not success else "")

        return admin_id

    def test_itinerary_management(self, trip_id: str):
        """Test itinerary management endpoints"""
        print("\n📅 Testing Itinerary Management...")
        
        if not self.agent_token or not trip_id:
            print("❌ Skipping itinerary tests - missing requirements")
            return False

        # Create itinerary
        itinerary_data = {
            'trip_id': trip_id,
            'day_number': 1,
            'date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'title': 'Departure Day',
            'description': 'Embarkation and departure',
            'itinerary_type': 'port_day'
        }

        success, result = self.make_request('POST', 'itineraries', itinerary_data, token=self.agent_token)
        if success:
            itinerary_id = result['id']
            self.log_test("Create itinerary", True)
        else:
            self.log_test("Create itinerary", False, str(result))
            return False

        # Test get itineraries for trip
        success, result = self.make_request('GET', f'trips/{trip_id}/itineraries', token=self.agent_token)
        self.log_test("Get trip itineraries", success, str(result) if not success else "")

        # Test update itinerary
        update_data = {
            'trip_id': trip_id,
            'day_number': 1,
            'date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'title': 'Updated Departure Day',
            'description': 'Updated embarkation and departure',
            'itinerary_type': 'port_day'
        }
        success, result = self.make_request('PUT', f'itineraries/{itinerary_id}', update_data, token=self.agent_token)
        self.log_test("Update itinerary", success, str(result) if not success else "")

        return True

    def test_cruise_specific_features(self, trip_id: str):
        """Test cruise-specific endpoints"""
        print("\n🚢 Testing Cruise Features...")
        
        if not self.agent_token or not trip_id:
            print("❌ Skipping cruise tests - missing requirements")
            return False

        # Create cruise info
        cruise_data = {
            'trip_id': trip_id,
            'ship_name': 'MSC Seaside',
            'cabin_number': 'B204',
            'departure_time': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'return_time': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'ship_facilities': ['Pool', 'Spa', 'Casino', 'Theater']
        }

        success, result = self.make_request('POST', f'trips/{trip_id}/cruise-info', cruise_data, token=self.agent_token)
        if success:
            cruise_id = result['id']
            self.log_test("Create cruise info", True)
        else:
            self.log_test("Create cruise info", False, str(result))
            return False

        # Test get cruise info
        success, result = self.make_request('GET', f'trips/{trip_id}/cruise-info', token=self.agent_token)
        self.log_test("Get cruise info", success, str(result) if not success else "")

        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoints"""
        print("\n📊 Testing Dashboard Statistics...")
        
        # Test admin dashboard stats
        if self.admin_token:
            success, result = self.make_request('GET', 'dashboard/stats', token=self.admin_token)
            self.log_test("Admin dashboard stats", success, str(result) if not success else "")

        # Test agent dashboard stats
        if self.agent_token:
            success, result = self.make_request('GET', 'dashboard/stats', token=self.agent_token)
            self.log_test("Agent dashboard stats", success, str(result) if not success else "")

        # Test client dashboard stats
        if self.client_token:
            success, result = self.make_request('GET', 'dashboard/stats', token=self.client_token)
            self.log_test("Client dashboard stats", success, str(result) if not success else "")

        return True

    def test_analytics_and_reports(self):
        """Test analytics and reporting endpoints"""
        print("\n📈 Testing Analytics & Reports...")
        
        if not self.admin_token:
            print("❌ Skipping analytics tests - no admin token")
            return False

        # Test agent commission analytics
        success, result = self.make_request('GET', 'analytics/agent-commissions', token=self.admin_token)
        self.log_test("Agent commission analytics", success, str(result) if not success else "")

        # Test with year parameter
        current_year = datetime.now().year
        success, result = self.make_request('GET', f'analytics/agent-commissions?year={current_year}', token=self.admin_token)
        self.log_test("Agent commission analytics (with year)", success, str(result) if not success else "")

        return True

    def test_notifications(self):
        """Test notification endpoints"""
        print("\n🔔 Testing Notifications...")
        
        if not self.agent_token:
            print("❌ Skipping notification tests - no agent token")
            return False

        # Test payment deadline notifications
        success, result = self.make_request('GET', 'notifications/payment-deadlines', token=self.agent_token)
        self.log_test("Payment deadline notifications", success, str(result) if not success else "")

        return True

    def test_poi_management(self):
        """Test Points of Interest management"""
        print("\n📍 Testing POI Management...")
        
        if not self.agent_token:
            print("❌ Skipping POI tests - no agent token")
            return False

        # Test get POIs
        success, result = self.make_request('GET', 'pois', token=self.agent_token)
        self.log_test("Get POIs", success, str(result) if not success else "")

        # Test create POI
        poi_data = {
            'name': 'Test Restaurant',
            'category': 'restaurant',
            'address': '123 Test Street, Test City',
            'description': 'A great test restaurant',
            'phone': '+1234567890',
            'price_range': '€€'
        }

        success, result = self.make_request('POST', 'pois', poi_data, token=self.agent_token)
        return True

    def test_new_financial_reports(self):
        """Test new financial reports endpoint (/api/reports/financial)"""
        print("\n💰 Testing NEW Financial Reports...")
        
        if not self.admin_token or not self.agent_token:
            print("❌ Skipping financial reports tests - missing tokens")
            return False

        current_year = datetime.now().year
        
        # Test admin access to financial reports (should have can_export_excel: true)
        success, result = self.make_request('GET', 'reports/financial', token=self.admin_token)
        if success:
            self.log_test("Admin financial reports access", True)
            if 'can_export_excel' in result and result['can_export_excel'] == True:
                self.log_test("Admin can export Excel (correct)", True)
            else:
                self.log_test("Admin can export Excel (incorrect)", False, "Admin should have can_export_excel: true")
        else:
            self.log_test("Admin financial reports access", False, str(result))

        # Test agent access to financial reports (should have can_export_excel: false)
        success, result = self.make_request('GET', 'reports/financial', token=self.agent_token)
        if success:
            self.log_test("Agent financial reports access", True)
            if 'can_export_excel' in result and result['can_export_excel'] == False:
                self.log_test("Agent cannot export Excel (correct)", True)
            else:
                self.log_test("Agent cannot export Excel (incorrect)", False, "Agent should have can_export_excel: false")
        else:
            self.log_test("Agent financial reports access", False, str(result))

        # Test with year parameter
        success, result = self.make_request('GET', f'reports/financial?year={current_year}', token=self.admin_token)
        if success:
            self.log_test("Financial reports with year parameter", True)
            if 'monthly_breakdown' in result:
                self.log_test("Monthly breakdown included", True)
            else:
                self.log_test("Monthly breakdown missing", False, "Should include monthly breakdown for year queries")
        else:
            self.log_test("Financial reports with year parameter", False, str(result))

        # Test with month parameter
        success, result = self.make_request('GET', f'reports/financial?year={current_year}&month=1', token=self.admin_token)
        self.log_test("Financial reports with month parameter", success, str(result) if not success else "")

        # Test agent-specific reports
        success, agent_info = self.make_request('GET', 'auth/me', token=self.agent_token)
        if success and 'id' in agent_info:
            agent_id = agent_info['id']
            success, result = self.make_request('GET', f'reports/financial?agent_id={agent_id}', token=self.admin_token)
            self.log_test("Financial reports for specific agent", success, str(result) if not success else "")

        return True

    def test_financial_sheets_crud(self):
        """Test financial sheets CRUD operations (/api/financial-sheets)"""
        print("\n📊 Testing Financial Sheets CRUD...")
        
        if not self.admin_token or not self.agent_token:
            print("❌ Skipping financial sheets tests - missing tokens")
            return False

        # Test create financial sheet (admin)
        sheet_data = {
            "title": "Test Financial Sheet",
            "description": "Test sheet for API testing",
            "year": datetime.now().year,
            "month": datetime.now().month,
            "data": {
                "total_revenue": 50000,
                "total_expenses": 30000,
                "profit": 20000
            }
        }

        success, result = self.make_request('POST', 'financial-sheets', sheet_data, token=self.admin_token)
        if success:
            sheet_id = result.get('sheet_id')
            self.log_test("Create financial sheet (admin)", True)
        else:
            self.log_test("Create financial sheet (admin)", False, str(result))
            return False

        # Test create financial sheet (agent)
        success, result = self.make_request('POST', 'financial-sheets', sheet_data, token=self.agent_token)
        self.log_test("Create financial sheet (agent)", success, str(result) if not success else "")

        # Test get financial sheets (admin)
        success, result = self.make_request('GET', 'financial-sheets', token=self.admin_token)
        self.log_test("Get financial sheets (admin)", success, str(result) if not success else "")

        # Test get financial sheets (agent)
        success, result = self.make_request('GET', 'financial-sheets', token=self.agent_token)
        self.log_test("Get financial sheets (agent)", success, str(result) if not success else "")

        # Test update financial sheet
        if sheet_id:
            update_data = {
                "title": "Updated Financial Sheet",
                "data": {
                    "total_revenue": 55000,
                    "total_expenses": 32000,
                    "profit": 23000
                }
            }
            success, result = self.make_request('PUT', f'financial-sheets/{sheet_id}', update_data, token=self.admin_token)
            self.log_test("Update financial sheet", success, str(result) if not success else "")

        return True

    def test_trip_status_management(self):
        """Test trip status management (/api/trips/{trip_id}/status)"""
        print("\n🚦 Testing Trip Status Management...")
        
        if not self.agent_token or not self.client_token:
            print("❌ Skipping trip status tests - missing tokens")
            return False

        # Get client ID for trip creation
        success, client_info = self.make_request('GET', 'auth/me', token=self.client_token)
        if not success:
            print("❌ Could not get client info")
            return False
        
        client_id = client_info['id']

        # Create a trip (should start as draft)
        trip_data = {
            'title': 'Status Test Trip',
            'destination': 'Test Destination',
            'description': 'Trip for testing status changes',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': client_id,
            'trip_type': 'cruise'
        }

        success, result = self.make_request('POST', 'trips', trip_data, token=self.agent_token)
        if success:
            trip_id = result['id']
            initial_status = result.get('status', 'unknown')
            self.log_test(f"Create trip (initial status: {initial_status})", True)
            
            if initial_status == 'draft':
                self.log_test("Trip starts in draft status (correct)", True)
            else:
                self.log_test("Trip starts in draft status (incorrect)", False, f"Expected 'draft', got '{initial_status}'")
        else:
            self.log_test("Create trip for status testing", False, str(result))
            return False

        # Test changing status from draft to active
        status_update = {"status": "active"}
        success, result = self.make_request('PUT', f'trips/{trip_id}/status', status_update, token=self.agent_token)
        self.log_test("Change trip status draft -> active", success, str(result) if not success else "")

        # Verify status change
        success, result = self.make_request('GET', f'trips/{trip_id}', token=self.agent_token)
        if success:
            current_status = result.get('status', 'unknown')
            if current_status == 'active':
                self.log_test("Trip status correctly updated to active", True)
            else:
                self.log_test("Trip status update verification", False, f"Expected 'active', got '{current_status}'")
        else:
            self.log_test("Verify trip status update", False, str(result))

        # Test other status transitions
        for new_status in ['completed', 'cancelled']:
            status_update = {"status": new_status}
            success, result = self.make_request('PUT', f'trips/{trip_id}/status', status_update, token=self.agent_token)
            self.log_test(f"Change trip status to {new_status}", success, str(result) if not success else "")

        return True

    def test_client_notes_visibility(self):
        """Test client notes visibility for admin/agent (/api/notes/all)"""
        print("\n📝 Testing Client Notes Visibility...")
        
        if not self.admin_token or not self.agent_token or not self.client_token:
            print("❌ Skipping notes tests - missing tokens")
            return False

        # First, create a trip and note for testing
        success, client_info = self.make_request('GET', 'auth/me', token=self.client_token)
        if not success:
            print("❌ Could not get client info")
            return False
        
        client_id = client_info['id']

        # Create a trip
        trip_data = {
            'title': 'Notes Test Trip',
            'destination': 'Test Destination',
            'description': 'Trip for testing notes',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': client_id,
            'trip_type': 'cruise'
        }

        success, result = self.make_request('POST', 'trips', trip_data, token=self.agent_token)
        if success:
            trip_id = result['id']
            self.log_test("Create trip for notes testing", True)
        else:
            self.log_test("Create trip for notes testing", False, str(result))
            return False

        # Create a client note
        note_data = {
            'trip_id': trip_id,
            'day_number': 1,
            'note_text': 'This is a test note from the client'
        }

        success, result = self.make_request('POST', f'trips/{trip_id}/notes', note_data, token=self.client_token)
        if success:
            note_id = result['id']
            self.log_test("Create client note", True)
        else:
            self.log_test("Create client note", False, str(result))
            return False

        # Test admin access to all notes
        success, result = self.make_request('GET', 'notes/all', token=self.admin_token)
        if success:
            self.log_test("Admin access to all client notes", True)
            # Check if our note is in the results
            notes = result if isinstance(result, list) else []
            found_note = any(note.get('id') == note_id for note in notes)
            self.log_test("Admin can see client notes", found_note, "Note not found in admin view" if not found_note else "")
        else:
            self.log_test("Admin access to all client notes", False, str(result))

        # Test agent access to all notes
        success, result = self.make_request('GET', 'notes/all', token=self.agent_token)
        if success:
            self.log_test("Agent access to all client notes", True)
            # Check if our note is in the results
            notes = result if isinstance(result, list) else []
            found_note = any(note.get('id') == note_id for note in notes)
            self.log_test("Agent can see client notes", found_note, "Note not found in agent view" if not found_note else "")
        else:
            self.log_test("Agent access to all client notes", False, str(result))

        # Test client cannot access all notes (should be forbidden)
        success, result = self.make_request('GET', 'notes/all', token=self.client_token, expected_status=403)
        self.log_test("Client forbidden from all notes endpoint", success, str(result) if not success else "")

        # Test note editing by admin/agent
        update_data = {
            'note_text': 'Updated note text by admin'
        }
        success, result = self.make_request('PUT', f'notes/{note_id}', update_data, token=self.admin_token)
        self.log_test("Admin can edit client notes", success, str(result) if not success else "")

        success, result = self.make_request('PUT', f'notes/{note_id}', update_data, token=self.agent_token)
        self.log_test("Agent can edit client notes", success, str(result) if not success else "")

        return True

    def test_quote_requests(self):
        """Test quote requests functionality (/api/quote-requests)"""
        print("\n💬 Testing Quote Requests...")
        
        if not self.admin_token or not self.agent_token or not self.client_token:
            print("❌ Skipping quote requests tests - missing tokens")
            return False

        # Test client creating quote request
        quote_data = {
            'destination': 'Caribbean Islands',
            'travel_dates': 'March 2025',
            'number_of_travelers': 2,
            'trip_type': 'cruise',
            'budget_range': '2000-3000 EUR',
            'special_requirements': 'Balcony cabin preferred',
            'contact_preference': 'email',
            'notes': 'Honeymoon trip, looking for romantic experience'
        }

        success, result = self.make_request('POST', 'quote-requests', quote_data, token=self.client_token)
        if success:
            request_id = result.get('request_id')
            self.log_test("Client create quote request", True)
        else:
            self.log_test("Client create quote request", False, str(result))
            return False

        # Test client viewing their quote requests
        success, result = self.make_request('GET', 'quote-requests', token=self.client_token)
        if success:
            self.log_test("Client view own quote requests", True)
            requests = result if isinstance(result, list) else []
            found_request = any(req.get('id') == request_id for req in requests)
            self.log_test("Client can see their quote request", found_request, "Request not found in client view" if not found_request else "")
        else:
            self.log_test("Client view own quote requests", False, str(result))

        # Test admin viewing all quote requests
        success, result = self.make_request('GET', 'quote-requests', token=self.admin_token)
        if success:
            self.log_test("Admin view all quote requests", True)
            requests = result if isinstance(result, list) else []
            found_request = any(req.get('id') == request_id for req in requests)
            self.log_test("Admin can see client quote requests", found_request, "Request not found in admin view" if not found_request else "")
        else:
            self.log_test("Admin view all quote requests", False, str(result))

        # Test agent viewing all quote requests
        success, result = self.make_request('GET', 'quote-requests', token=self.agent_token)
        if success:
            self.log_test("Agent view all quote requests", True)
            requests = result if isinstance(result, list) else []
            found_request = any(req.get('id') == request_id for req in requests)
            self.log_test("Agent can see client quote requests", found_request, "Request not found in agent view" if not found_request else "")
        else:
            self.log_test("Agent view all quote requests", False, str(result))

        # Test updating quote request (admin/agent)
        if request_id:
            update_data = {
                'status': 'in_progress',
                'notes': 'Working on this request'
            }
            success, result = self.make_request('PUT', f'quote-requests/{request_id}', update_data, token=self.admin_token)
            self.log_test("Admin update quote request", success, str(result) if not success else "")

            success, result = self.make_request('PUT', f'quote-requests/{request_id}', update_data, token=self.agent_token)
            self.log_test("Agent update quote request", success, str(result) if not success else "")

        return True

    def test_orphaned_data_cleanup(self):
        """Test orphaned data cleanup for financial reports (REVIEW REQUEST)"""
        print("\n🧹 Testing Orphaned Data Cleanup (REVIEW REQUEST)...")
        print("🎯 Testing cleanup of orphaned data that causes financial reports to show ghost data")
        
        if not self.admin_token:
            print("❌ Skipping orphaned data cleanup tests - no admin token")
            return False

        # STEP 1: Check current state - GET /api/reports/financial?year=2025
        print("\n📊 STEP 1: Checking current financial data state (year=2025)...")
        success, initial_report = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        
        if success:
            self.log_test("GET /api/reports/financial?year=2025 (initial check)", True)
            
            initial_totals = initial_report.get('totals', {})
            initial_trips = initial_totals.get('total_trips', 0)
            initial_revenue = initial_totals.get('gross_revenue', 0)
            
            print(f"   📈 Initial state: {initial_trips} trips, €{initial_revenue} revenue")
            
            if initial_trips > 0:
                print(f"   ⚠️  Found {initial_trips} trips in financial data - potential orphaned data detected")
            else:
                print("   ✅ No financial data found - system is clean")
                
        else:
            self.log_test("GET /api/reports/financial?year=2025 (initial check)", False, str(initial_report))
            return False

        # STEP 2: Execute cleanup - POST /api/admin/cleanup-orphaned-data
        print("\n🧹 STEP 2: Executing orphaned data cleanup...")
        success, cleanup_result = self.make_request('POST', 'admin/cleanup-orphaned-data', {}, token=self.admin_token)
        
        if success:
            self.log_test("POST /api/admin/cleanup-orphaned-data", True)
            
            # Check cleanup results
            if 'deleted_counts' in cleanup_result:
                deleted_counts = cleanup_result['deleted_counts']
                print(f"   🗑️  Cleanup results:")
                for data_type, count in deleted_counts.items():
                    if count > 0:
                        print(f"      - {data_type}: {count} records deleted")
                
                total_deleted = sum(deleted_counts.values())
                if total_deleted > 0:
                    self.log_test(f"Cleanup removed {total_deleted} orphaned records", True)
                else:
                    self.log_test("No orphaned data found to cleanup", True)
            else:
                self.log_test("Cleanup response structure", False, "Missing deleted_counts in response")
                
        else:
            self.log_test("POST /api/admin/cleanup-orphaned-data", False, str(cleanup_result))
            return False

        # STEP 3: Verify after cleanup - GET /api/reports/financial?year=2025
        print("\n🔍 STEP 3: Verifying financial data after cleanup...")
        success, final_report = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        
        if success:
            self.log_test("GET /api/reports/financial?year=2025 (after cleanup)", True)
            
            final_totals = final_report.get('totals', {})
            final_trips = final_totals.get('total_trips', 0)
            final_revenue = final_totals.get('gross_revenue', 0)
            
            print(f"   📉 Final state: {final_trips} trips, €{final_revenue} revenue")
            
            # Verify cleanup was effective
            if final_trips == 0 and final_revenue == 0:
                self.log_test("Financial reports show 0 after cleanup (SUCCESS)", True)
                print("   ✅ SUCCESS: No ghost data remaining in financial reports")
            elif final_trips < initial_trips or final_revenue < initial_revenue:
                self.log_test("Cleanup reduced orphaned data (PARTIAL SUCCESS)", True)
                print(f"   ⚠️  PARTIAL: Reduced from {initial_trips} to {final_trips} trips")
            else:
                self.log_test("Cleanup had no effect on financial data", False, "Data unchanged after cleanup")
                
        else:
            self.log_test("GET /api/reports/financial?year=2025 (after cleanup)", False, str(final_report))

        # STEP 4: Test complete trip deletion (if trips remain)
        print("\n🗑️  STEP 4: Testing complete trip deletion removes financial data...")
        
        # Get current trips to test deletion
        success, trips_result = self.make_request('GET', 'trips', token=self.admin_token)
        if success and trips_result:
            print(f"   📋 Found {len(trips_result)} trips in system")
            
            # If there are trips, test deleting one to verify cascade deletion
            if len(trips_result) > 0:
                test_trip = trips_result[0]
                trip_id = test_trip['id']
                trip_title = test_trip.get('title', 'Unknown')
                
                print(f"   🎯 Testing deletion of trip: {trip_title} (ID: {trip_id})")
                
                # Check if this trip has financial data
                success, trip_admin = self.make_request('GET', f'trips/{trip_id}/admin', token=self.admin_token)
                has_financial_data = success and trip_admin is not None
                
                if has_financial_data:
                    print(f"   💰 Trip has financial data - testing cascade deletion")
                
                # Delete the trip
                success, delete_result = self.make_request('DELETE', f'trips/{trip_id}', token=self.admin_token)
                
                if success:
                    self.log_test("Delete trip with cascade deletion", True)
                    
                    if 'deleted_counts' in delete_result:
                        deleted_counts = delete_result['deleted_counts']
                        financial_deleted = deleted_counts.get('financial_records', 0)
                        
                        if has_financial_data and financial_deleted > 0:
                            self.log_test("Trip deletion removes financial data (CASCADE SUCCESS)", True)
                            print(f"      ✅ Deleted {financial_deleted} financial records")
                        elif not has_financial_data:
                            self.log_test("Trip deletion (no financial data to remove)", True)
                        else:
                            self.log_test("Trip deletion failed to remove financial data", False, "Financial data not deleted")
                            
                        # Show all deleted data
                        for data_type, count in deleted_counts.items():
                            if count > 0:
                                print(f"      - {data_type}: {count} records")
                                
                    # Verify financial reports updated after trip deletion
                    success, post_delete_report = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
                    if success:
                        post_delete_totals = post_delete_report.get('totals', {})
                        post_delete_trips = post_delete_totals.get('total_trips', 0)
                        
                        if post_delete_trips < final_trips:
                            self.log_test("Financial reports updated after trip deletion", True)
                            print(f"      📉 Financial trips reduced from {final_trips} to {post_delete_trips}")
                        else:
                            self.log_test("Financial reports not updated after trip deletion", False, "Trip count unchanged")
                    
                else:
                    self.log_test("Delete trip", False, str(delete_result))
            else:
                print("   ℹ️  No trips available to test deletion")
        else:
            print("   ℹ️  Could not retrieve trips list for deletion test")

        print("\n✅ ORPHANED DATA CLEANUP TESTING COMPLETED")
        return True

    def test_new_client_details_endpoints(self):
        """Test NEW client details endpoints to solve 'client not found' issue"""
        print("\n🆕 Testing NEW Client Details Endpoints (REVIEW REQUEST)...")
        print("🎯 Testing endpoints created to solve 'cliente non trovato' problem")
        
        if not self.admin_token:
            print("❌ Skipping client details tests - no admin token")
            return False

        # STEP 1: Get list of available clients to find a valid client_id
        print("\n📋 STEP 1: Getting list of available clients...")
        success, clients_result = self.make_request('GET', 'clients', token=self.admin_token)
        if not success:
            self.log_test("Get clients list", False, str(clients_result))
            return False
        
        self.log_test("Get clients list", True)
        
        if not clients_result or len(clients_result) == 0:
            print("⚠️  No clients found in system. Creating test client...")
            # Create a test client
            client_data = {
                'email': 'testclient@test.it',
                'password': 'password123',
                'first_name': 'Test',
                'last_name': 'Client',
                'role': 'client'
            }
            
            success, result = self.make_request('POST', 'auth/register', client_data)
            if success:
                print(f"✅ Created test client: {result.get('user', {}).get('id')}")
                # Re-fetch clients list
                success, clients_result = self.make_request('GET', 'clients', token=self.admin_token)
            else:
                self.log_test("Create test client", False, str(result))
                return False

        # Get first available client ID
        if clients_result and len(clients_result) > 0:
            client_id = clients_result[0]['id']
            client_name = f"{clients_result[0]['first_name']} {clients_result[0]['last_name']}"
            print(f"📋 Using client: {client_name} (ID: {client_id})")
        else:
            print("❌ No clients available for testing")
            return False

        # STEP 2: Test NEW endpoint - GET /api/clients/{client_id}/details
        print(f"\n🔍 STEP 2: Testing GET /api/clients/{client_id}/details")
        success, details_result = self.make_request('GET', f'clients/{client_id}/details', token=self.admin_token)
        
        if success:
            self.log_test("GET /api/clients/{client_id}/details", True)
            
            # Verify response structure
            if 'client' in details_result and 'trips' in details_result:
                self.log_test("Client details response has correct structure (client + trips)", True)
                
                # Check client info
                client_info = details_result['client']
                if 'id' in client_info and 'first_name' in client_info and 'last_name' in client_info:
                    self.log_test("Client info contains required fields", True)
                else:
                    self.log_test("Client info missing required fields", False, f"Missing fields in: {client_info}")
                
                # Check trips array
                trips = details_result['trips']
                self.log_test(f"Client has {len(trips)} trips", True)
                
                # If trips exist, check structure
                if trips:
                    trip = trips[0]
                    if 'id' in trip and 'title' in trip:
                        self.log_test("Trip info contains required fields", True)
                    else:
                        self.log_test("Trip info missing required fields", False, f"Missing fields in: {trip}")
                        
                    # Check if financial data is included
                    if 'financial' in trip:
                        if trip['financial']:
                            self.log_test("Trip includes financial data", True)
                        else:
                            self.log_test("Trip financial data is null (no admin data)", True)
                    else:
                        self.log_test("Trip missing financial field", False, "Financial field should be present")
                
            else:
                self.log_test("Client details response structure", False, f"Missing 'client' or 'trips' in response: {details_result}")
        else:
            self.log_test("GET /api/clients/{client_id}/details", False, str(details_result))

        # STEP 3: Test NEW endpoint - GET /api/clients/{client_id}/financial-summary
        print(f"\n💰 STEP 3: Testing GET /api/clients/{client_id}/financial-summary")
        success, summary_result = self.make_request('GET', f'clients/{client_id}/financial-summary', token=self.admin_token)
        
        if success:
            self.log_test("GET /api/clients/{client_id}/financial-summary", True)
            
            # Verify response structure
            required_fields = ['client_id', 'confirmed_bookings', 'pending_bookings', 'stats']
            missing_fields = [field for field in required_fields if field not in summary_result]
            
            if not missing_fields:
                self.log_test("Financial summary has correct structure", True)
                
                # Check confirmed_bookings structure
                confirmed = summary_result['confirmed_bookings']
                confirmed_fields = ['count', 'total_gross_amount', 'total_net_amount', 'total_discounts', 'total_supplier_commission', 'total_agent_commission']
                missing_confirmed = [field for field in confirmed_fields if field not in confirmed]
                
                if not missing_confirmed:
                    self.log_test("Confirmed bookings structure correct", True)
                    print(f"   💰 Fatturato: €{confirmed['total_gross_amount']}")
                    print(f"   💸 Commissioni fornitore: €{confirmed['total_supplier_commission']}")
                    print(f"   💵 Commissioni agente: €{confirmed['total_agent_commission']}")
                    print(f"   🎫 Sconti: €{confirmed['total_discounts']}")
                else:
                    self.log_test("Confirmed bookings missing fields", False, f"Missing: {missing_confirmed}")
                
                # Check pending_bookings structure
                pending = summary_result['pending_bookings']
                if 'count' in pending and 'pending_gross_amount' in pending:
                    self.log_test("Pending bookings structure correct", True)
                    print(f"   ⏳ Prenotazioni pending: {pending['count']}")
                else:
                    self.log_test("Pending bookings missing fields", False, f"Missing fields in: {pending}")
                
                # Check stats structure
                stats = summary_result['stats']
                stats_fields = ['total_trips', 'trips_without_financial_data', 'average_trip_value']
                missing_stats = [field for field in stats_fields if field not in stats]
                
                if not missing_stats:
                    self.log_test("Stats structure correct", True)
                    print(f"   📊 Viaggi totali: {stats['total_trips']}")
                    print(f"   📋 Viaggi senza dati finanziari: {stats['trips_without_financial_data']}")
                    print(f"   💎 Valore medio viaggio: €{stats['average_trip_value']}")
                else:
                    self.log_test("Stats missing fields", False, f"Missing: {missing_stats}")
                    
            else:
                self.log_test("Financial summary structure", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("GET /api/clients/{client_id}/financial-summary", False, str(summary_result))

        # STEP 4: Test with agent token (should also work)
        if self.agent_token:
            print(f"\n👤 STEP 4: Testing endpoints with agent token...")
            
            success, result = self.make_request('GET', f'clients/{client_id}/details', token=self.agent_token)
            self.log_test("Agent access to client details", success, str(result) if not success else "")
            
            success, result = self.make_request('GET', f'clients/{client_id}/financial-summary', token=self.agent_token)
            self.log_test("Agent access to client financial summary", success, str(result) if not success else "")

        # STEP 5: Test with client token (should be forbidden)
        if self.client_token:
            print(f"\n🚫 STEP 5: Testing endpoints with client token (should be forbidden)...")
            
            success, result = self.make_request('GET', f'clients/{client_id}/details', token=self.client_token, expected_status=403)
            self.log_test("Client forbidden from client details", success, str(result) if not success else "")
            
            success, result = self.make_request('GET', f'clients/{client_id}/financial-summary', token=self.client_token, expected_status=403)
            self.log_test("Client forbidden from financial summary", success, str(result) if not success else "")

        # STEP 6: Test with invalid client_id
        print(f"\n❌ STEP 6: Testing with invalid client_id...")
        invalid_id = "invalid-client-id-12345"
        
        success, result = self.make_request('GET', f'clients/{invalid_id}/details', token=self.admin_token, expected_status=404)
        self.log_test("Invalid client_id returns 404 for details", success, str(result) if not success else "")
        
        success, result = self.make_request('GET', f'clients/{invalid_id}/financial-summary', token=self.admin_token, expected_status=404)
        self.log_test("Invalid client_id returns 404 for financial summary", success, str(result) if not success else "")

        print("\n✅ NEW CLIENT DETAILS ENDPOINTS TESTING COMPLETED")
        return True

    def test_new_endpoints_comprehensive(self):
        """Run comprehensive tests for all new endpoints"""
        print("\n🆕 Testing ALL NEW ENDPOINTS...")
        
        # Test all new endpoints
        self.test_new_financial_reports()
        self.test_financial_sheets_crud()
        self.test_trip_status_management()
        self.test_client_notes_visibility()
        self.test_quote_requests()
        
        # PRIORITY: Test NEW client details endpoints (REVIEW REQUEST)
        self.test_new_client_details_endpoints()
        
        # PRIORITY: Test orphaned data cleanup (REVIEW REQUEST)
        self.test_orphaned_data_cleanup()

        return True

    def run_all_tests(self):
        """Run all test suites with focus on new endpoints"""
        print("🚀 Starting Travel Agency API Tests...")
        print(f"Testing against: {self.base_url}")
        print("🎯 FOCUS: Testing NEW endpoints as requested")
        
        # Test authentication first with provided credentials
        if not self.test_authentication():
            print("❌ Authentication tests failed - stopping")
            return False

        # PRIORITY: Test all new endpoints comprehensively
        print("\n" + "="*60)
        print("🆕 TESTING NEW ENDPOINTS (PRIMARY FOCUS)")
        print("="*60)
        self.test_new_endpoints_comprehensive()

        # Additional tests for context
        print("\n" + "="*60)
        print("📋 ADDITIONAL CONTEXT TESTS")
        print("="*60)
        
        # Test user management
        self.test_user_management()

        # Test trip management (needed for status tests)
        trip_id = self.test_trip_management()
        
        if trip_id:
            # Test financial management (needed for financial reports)
            admin_id = self.test_financial_management(trip_id)
            
            # Test itinerary management
            self.test_itinerary_management(trip_id)
            
            # Test cruise features
            self.test_cruise_specific_features(trip_id)

        # Test dashboard and analytics
        self.test_dashboard_stats()
        self.test_analytics_and_reports()
        self.test_notifications()
        self.test_poi_management()

        # Print final results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    tester = TravelAgencyAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())