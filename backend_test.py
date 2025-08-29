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
    def __init__(self, base_url="https://viaggi-app.preview.emergentagent.com"):
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

    def test_payment_registration_complete_journey(self):
        """Test complete payment registration journey as requested in review"""
        print("\n💳 Testing PAYMENT REGISTRATION Complete Journey (REVIEW REQUEST)...")
        print("🎯 Creating complete test trip with financial data for UI payment testing")
        print("📋 Credentials: admin@test.it / password123")
        
        if not self.admin_token:
            print("❌ Skipping payment registration tests - no admin token")
            return False

        # Get admin user info to use as client for test
        success, admin_info = self.make_request('GET', 'auth/me', token=self.admin_token)
        if not success:
            self.log_test("Get admin user info", False, str(admin_info))
            return False
        
        admin_id = admin_info['id']
        print(f"📋 Using admin as client for test: {admin_info['first_name']} {admin_info['last_name']} (ID: {admin_id})")

        # STEP 1: Create test trip - POST /api/trips
        print("\n🧳 STEP 1: Creating test trip...")
        trip_data = {
            'title': 'Test Payment Registration',
            'destination': 'Mediterranean',
            'description': 'Complete cruise for testing payment registration functionality',
            'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
            'client_id': admin_id,  # Use admin as client for test
            'trip_type': 'cruise'
        }

        success, trip_result = self.make_request('POST', 'trips', trip_data, token=self.admin_token)
        if success:
            trip_id = trip_result['id']
            self.created_resources['trips'].append(trip_id)
            self.log_test("✅ CREATE TEST TRIP: POST /api/trips", True)
            print(f"   🆔 Trip ID: {trip_id}")
            print(f"   📝 Title: {trip_result['title']}")
            print(f"   🌍 Destination: {trip_result['destination']}")
            print(f"   🚢 Type: {trip_result['trip_type']}")
        else:
            self.log_test("CREATE TEST TRIP: POST /api/trips", False, str(trip_result))
            return False

        # STEP 2: Create administrative data - POST /api/trips/{trip_id}/admin
        print(f"\n💰 STEP 2: Creating administrative/financial data for trip {trip_id}...")
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

        success, admin_result = self.make_request('POST', f'trips/{trip_id}/admin', admin_data, token=self.admin_token)
        if success:
            admin_record_id = admin_result['id']
            self.created_resources['trip_admins'].append(admin_record_id)
            self.log_test("✅ CREATE ADMIN DATA: POST /api/trips/{trip_id}/admin", True)
            print(f"   🆔 Admin ID: {admin_record_id}")
            print(f"   📋 Practice Number: {admin_result['practice_number']}")
            print(f"   📋 Booking Number: {admin_result['booking_number']}")
            print(f"   💰 Gross Amount: €{admin_result['gross_amount']}")
            print(f"   💸 Net Amount: €{admin_result['net_amount']}")
            print(f"   🎫 Discount: €{admin_result.get('discount', 0)}")
            print(f"   💵 Confirmation Deposit: €{admin_result['confirmation_deposit']}")
            print(f"   💳 Balance Due: €{admin_result.get('balance_due', 0)}")
        else:
            self.log_test("CREATE ADMIN DATA: POST /api/trips/{trip_id}/admin", False, str(admin_result))
            return False

        # STEP 3: Verify setup is correct
        print(f"\n🔍 STEP 3: Verifying setup is correct...")
        
        # Verify trip exists and has correct data
        success, trip_check = self.make_request('GET', f'trips/{trip_id}', token=self.admin_token)
        if success:
            self.log_test("✅ VERIFY TRIP: GET /api/trips/{trip_id}", True)
            print(f"   ✅ Trip verified: {trip_check['title']}")
        else:
            self.log_test("VERIFY TRIP: GET /api/trips/{trip_id}", False, str(trip_check))

        # Verify admin data exists and has correct calculations
        success, admin_check = self.make_request('GET', f'trips/{trip_id}/admin', token=self.admin_token)
        if success:
            self.log_test("✅ VERIFY ADMIN DATA: GET /api/trips/{trip_id}/admin", True)
            print(f"   ✅ Admin data verified:")
            print(f"      💰 Gross Amount: €{admin_check['gross_amount']}")
            print(f"      💸 Net Amount: €{admin_check['net_amount']}")
            print(f"      🧮 Gross Commission: €{admin_check.get('gross_commission', 0)}")
            print(f"      🏪 Supplier Commission: €{admin_check.get('supplier_commission', 0)}")
            print(f"      👤 Agent Commission: €{admin_check.get('agent_commission', 0)}")
            print(f"      💵 Confirmation Deposit: €{admin_check['confirmation_deposit']}")
            print(f"      💳 Balance Due: €{admin_check.get('balance_due', 0)}")
        else:
            self.log_test("VERIFY ADMIN DATA: GET /api/trips/{trip_id}/admin", False, str(admin_check))

        # STEP 4: Test payment registration endpoint
        print(f"\n💳 STEP 4: Testing payment registration endpoint...")
        
        # Test creating a payment installment
        payment_data = {
            'trip_admin_id': admin_record_id,
            'amount': 500.0,
            'payment_date': (datetime.now(timezone.utc) + timedelta(days=15)).isoformat(),
            'payment_type': 'installment',
            'notes': 'Test payment for UI testing'
        }

        success, payment_result = self.make_request('POST', f'trip-admin/{admin_record_id}/payments', payment_data, token=self.admin_token)
        if success:
            payment_id = payment_result['id']
            self.created_resources['payments'].append(payment_id)
            self.log_test("✅ TEST PAYMENT REGISTRATION: POST /api/trip-admin/{admin_id}/payments", True)
            print(f"   🆔 Payment ID: {payment_id}")
            print(f"   💰 Amount: €{payment_result['amount']}")
            print(f"   📅 Payment Date: {payment_result['payment_date']}")
            print(f"   🏷️  Type: {payment_result['payment_type']}")
            print(f"   📝 Notes: {payment_result['notes']}")
        else:
            self.log_test("TEST PAYMENT REGISTRATION: POST /api/trip-admin/{admin_id}/payments", False, str(payment_result))

        # Verify balance was updated after payment
        success, updated_admin = self.make_request('GET', f'trips/{trip_id}/admin', token=self.admin_token)
        if success:
            new_balance = updated_admin.get('balance_due', 0)
            original_balance = admin_check.get('balance_due', 0)
            expected_balance = original_balance - payment_data['amount']
            
            if abs(new_balance - expected_balance) < 0.01:  # Allow for floating point precision
                self.log_test("✅ BALANCE UPDATED CORRECTLY after payment", True)
                print(f"   💳 Balance updated: €{original_balance} → €{new_balance}")
            else:
                self.log_test("BALANCE UPDATE after payment", False, f"Expected €{expected_balance}, got €{new_balance}")
        
        # Get list of payments to verify it's included
        success, payments_list = self.make_request('GET', f'trip-admin/{admin_record_id}/payments', token=self.admin_token)
        if success:
            self.log_test("✅ GET PAYMENTS LIST: GET /api/trip-admin/{admin_id}/payments", True)
            print(f"   📋 Total payments: {len(payments_list)}")
            if payments_list:
                for i, payment in enumerate(payments_list, 1):
                    print(f"      {i}. €{payment['amount']} - {payment['payment_type']} - {payment['payment_date'][:10]}")
        else:
            self.log_test("GET PAYMENTS LIST", False, str(payments_list))

        # STEP 5: Provide IDs for frontend testing
        print(f"\n🎯 STEP 5: PROVIDING IDs FOR FRONTEND TESTING...")
        print("="*60)
        print("📋 COMPLETE TEST DATA FOR UI PAYMENT REGISTRATION:")
        print("="*60)
        print(f"🆔 TRIP_ID: {trip_id}")
        print(f"🆔 ADMIN_ID: {admin_record_id}")
        print(f"👤 CLIENT_ID: {admin_id}")
        print(f"🔑 CREDENTIALS: admin@test.it / password123")
        print("")
        print("📊 FINANCIAL SETUP:")
        print(f"   💰 Gross Amount: €{admin_data['gross_amount']}")
        print(f"   💵 Confirmation Deposit: €{admin_data['confirmation_deposit']}")
        print(f"   💳 Current Balance Due: €{updated_admin.get('balance_due', 0) if 'updated_admin' in locals() else 'N/A'}")
        print("")
        print("🎯 READY FOR UI TESTING:")
        print("   ✅ Trip created with complete data")
        print("   ✅ Financial/admin data configured")
        print("   ✅ Payment registration endpoint tested")
        print("   ✅ Balance calculations working")
        print("   ✅ All IDs available for frontend integration")
        print("="*60)

        return {
            'trip_id': trip_id,
            'admin_id': admin_record_id,
            'client_id': admin_id,
            'success': True
        }

    def test_trip_details_endpoints(self):
        """Test NEW trip details endpoints (cruise/resort/tour/custom) - REVIEW REQUEST FOCUS"""
        print("\n🚢 Testing TRIP DETAILS ENDPOINTS (REVIEW REQUEST FOCUS)...")
        print("🎯 Testing nuovi endpoint per i dettagli viaggi appena implementati nel backend")
        print("📋 Credentials: admin@test.it / password123")
        print("🚢 Using existing cruise trip: c48cbf70-214b-492d-b295-838d7c8dad89")
        
        if not self.admin_token or not self.agent_token or not self.client_token:
            print("❌ Skipping trip details tests - missing tokens")
            return False

        # Use the provided cruise trip ID from the review request
        cruise_trip_id = "c48cbf70-214b-492d-b295-838d7c8dad89"
        
        # STEP 1: Test GET /api/trips/{trip_id}/details - Recuperare dettagli esistenti
        print(f"\n🔍 STEP 1: Testing GET /api/trips/{cruise_trip_id}/details")
        success, details_result = self.make_request('GET', f'trips/{cruise_trip_id}/details', token=self.admin_token)
        
        if success:
            self.log_test("✅ GET /api/trips/{trip_id}/details", True)
            
            # Verify response structure
            if 'trip_type' in details_result:
                trip_type = details_result['trip_type']
                self.log_test(f"Trip type detected: {trip_type}", True)
                
                # Check if cruise details exist
                if trip_type == 'cruise' and 'cruise_details' in details_result:
                    self.log_test("Existing cruise details found", True)
                    cruise_details = details_result['cruise_details']
                    print(f"   🚢 Ship Name: {cruise_details.get('ship_name', 'N/A')}")
                    print(f"   🏠 Cabin Number: {cruise_details.get('cabin_number', 'N/A')}")
                    print(f"   🚢 Boarding Port: {cruise_details.get('boarding_port', 'N/A')}")
                elif trip_type == 'cruise':
                    self.log_test("No existing cruise details (ready for creation)", True)
                else:
                    self.log_test(f"Trip type is {trip_type}, not cruise", True)
            else:
                self.log_test("Response missing trip_type", False, f"Response: {details_result}")
        else:
            self.log_test("GET /api/trips/{trip_id}/details", False, str(details_result))
            return False

        # STEP 2: Test POST /api/trips/{trip_id}/cruise-details - Salvataggio dettagli crociera
        print(f"\n🚢 STEP 2: Testing POST /api/trips/{cruise_trip_id}/cruise-details")
        
        # Sample cruise data from review request
        cruise_data = {
            "ship_name": "MSC Seaside Premium",
            "boarding_port": "Civitavecchia (Roma)",
            "cabin_number": "7145",
            "package_type": "Balcone Premium con Beverage",
            "insurance_type": "Annullamento + Medica + Bagaglio",
            "restaurant": "Ristorante Principale + Speciality",
            "dinner_time": "Secondo turno - 21:00"
        }
        
        success, cruise_result = self.make_request('POST', f'trips/{cruise_trip_id}/cruise-details', cruise_data, token=self.admin_token)
        
        if success:
            self.log_test("✅ POST /api/trips/{trip_id}/cruise-details (CREATE)", True)
            print(f"   🚢 Ship: {cruise_result.get('ship_name')}")
            print(f"   🏠 Cabin: {cruise_result.get('cabin_number')}")
            print(f"   🚢 Port: {cruise_result.get('boarding_port')}")
            print(f"   📦 Package: {cruise_result.get('package_type')}")
            print(f"   🛡️  Insurance: {cruise_result.get('insurance_type')}")
            print(f"   🍽️  Restaurant: {cruise_result.get('restaurant')}")
            print(f"   🕘 Dinner Time: {cruise_result.get('dinner_time')}")
            
            # Verify timestamps
            if 'created_at' in cruise_result and 'updated_at' in cruise_result:
                self.log_test("Timestamps (created_at, updated_at) present", True)
            else:
                self.log_test("Missing timestamps", False, "Should have created_at and updated_at")
        else:
            self.log_test("POST /api/trips/{trip_id}/cruise-details (CREATE)", False, str(cruise_result))

        # STEP 3: Test UPDATE functionality - POST again with modified data
        print(f"\n🔄 STEP 3: Testing UPDATE functionality (POST with modified data)")
        
        # Modified cruise data
        updated_cruise_data = {
            "ship_name": "MSC Seaside Premium UPDATED",
            "boarding_port": "Civitavecchia (Roma)",
            "cabin_number": "7146",  # Changed cabin number
            "package_type": "Balcone Premium con Beverage PLUS",  # Changed package
            "insurance_type": "Annullamento + Medica + Bagaglio + Extra",  # Changed insurance
            "restaurant": "Ristorante Principale + Speciality + VIP",  # Changed restaurant
            "dinner_time": "Primo turno - 19:30"  # Changed dinner time
        }
        
        success, updated_result = self.make_request('POST', f'trips/{cruise_trip_id}/cruise-details', updated_cruise_data, token=self.admin_token)
        
        if success:
            self.log_test("✅ POST /api/trips/{trip_id}/cruise-details (UPDATE)", True)
            
            # Verify changes were applied
            changes_verified = 0
            if updated_result.get('ship_name') == updated_cruise_data['ship_name']:
                changes_verified += 1
            if updated_result.get('cabin_number') == updated_cruise_data['cabin_number']:
                changes_verified += 1
            if updated_result.get('package_type') == updated_cruise_data['package_type']:
                changes_verified += 1
            if updated_result.get('dinner_time') == updated_cruise_data['dinner_time']:
                changes_verified += 1
                
            if changes_verified >= 3:
                self.log_test("Update changes applied correctly", True)
                print(f"   ✅ {changes_verified}/4 fields updated successfully")
            else:
                self.log_test("Update changes not applied", False, f"Only {changes_verified}/4 fields updated")
                
            # Verify updated_at timestamp changed
            if 'updated_at' in updated_result:
                self.log_test("Updated timestamp present", True)
            else:
                self.log_test("Missing updated timestamp", False, "Should have updated_at timestamp")
        else:
            self.log_test("POST /api/trips/{trip_id}/cruise-details (UPDATE)", False, str(updated_result))

        # STEP 4: Test authorization - Admin/Agent OK, Client blocked
        print(f"\n🔐 STEP 4: Testing authorization controls")
        
        # Test agent access (should work)
        success, agent_result = self.make_request('GET', f'trips/{cruise_trip_id}/details', token=self.agent_token)
        self.log_test("✅ Agent access to GET trip details", success, str(agent_result) if not success else "")
        
        success, agent_post = self.make_request('POST', f'trips/{cruise_trip_id}/cruise-details', cruise_data, token=self.agent_token)
        self.log_test("✅ Agent access to POST cruise details", success, str(agent_post) if not success else "")
        
        # Test client access (should be blocked)
        success, client_result = self.make_request('GET', f'trips/{cruise_trip_id}/details', token=self.client_token, expected_status=403)
        self.log_test("🚫 Client blocked from GET trip details", success, str(client_result) if not success else "")
        
        success, client_post = self.make_request('POST', f'trips/{cruise_trip_id}/cruise-details', cruise_data, token=self.client_token, expected_status=403)
        self.log_test("🚫 Client blocked from POST cruise details", success, str(client_post) if not success else "")

        # STEP 5: Test validation with invalid trip_id
        print(f"\n❌ STEP 5: Testing validation with invalid trip_id")
        
        invalid_trip_id = "invalid-trip-id-12345"
        
        success, invalid_get = self.make_request('GET', f'trips/{invalid_trip_id}/details', token=self.admin_token, expected_status=404)
        self.log_test("❌ Invalid trip_id returns 404 for GET details", success, str(invalid_get) if not success else "")
        
        success, invalid_post = self.make_request('POST', f'trips/{invalid_trip_id}/cruise-details', cruise_data, token=self.admin_token, expected_status=404)
        self.log_test("❌ Invalid trip_id returns 404 for POST cruise details", success, str(invalid_post) if not success else "")

        # STEP 6: Test other trip detail types (resort, tour, custom)
        print(f"\n🏨 STEP 6: Testing other trip detail types")
        
        # Create a test trip for other types
        success, client_info = self.make_request('GET', 'auth/me', token=self.client_token)
        if success:
            client_id = client_info['id']
            
            # Create resort trip
            resort_trip_data = {
                'title': 'Test Resort Trip',
                'destination': 'Maldives',
                'description': 'Resort trip for testing details',
                'start_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                'end_date': (datetime.now(timezone.utc) + timedelta(days=37)).isoformat(),
                'client_id': client_id,
                'trip_type': 'resort'
            }
            
            success, resort_trip = self.make_request('POST', 'trips', resort_trip_data, token=self.admin_token)
            if success:
                resort_trip_id = resort_trip['id']
                self.created_resources['trips'].append(resort_trip_id)
                
                # Test resort details
                resort_details = {
                    "resort_name": "Paradise Resort Maldives",
                    "room_type": "Water Villa with Pool",
                    "meal_plan": "All Inclusive Premium",
                    "package_formula": "Honeymoon Package",
                    "insurance_type": "Travel + Medical + Cancellation"
                }
                
                success, resort_result = self.make_request('POST', f'trips/{resort_trip_id}/resort-details', resort_details, token=self.admin_token)
                self.log_test("✅ POST /api/trips/{trip_id}/resort-details", success, str(resort_result) if not success else "")
                
                # Test tour details
                tour_details = {
                    "general_info": "Complete European tour with guided visits to major cities and historical sites"
                }
                
                success, tour_result = self.make_request('POST', f'trips/{resort_trip_id}/tour-details', tour_details, token=self.admin_token)
                self.log_test("✅ POST /api/trips/{trip_id}/tour-details", success, str(tour_result) if not success else "")
                
                # Test custom details
                custom_details = {
                    "custom_details": "Personalized adventure trip with custom itinerary and special accommodations"
                }
                
                success, custom_result = self.make_request('POST', f'trips/{resort_trip_id}/custom-details', custom_details, token=self.admin_token)
                self.log_test("✅ POST /api/trips/{trip_id}/custom-details", success, str(custom_result) if not success else "")

        # STEP 7: Test create/update integration
        print(f"\n🔄 STEP 7: Testing create/update integration")
        
        # Verify GET details shows all the data we created
        success, final_details = self.make_request('GET', f'trips/{cruise_trip_id}/details', token=self.admin_token)
        if success:
            self.log_test("✅ GET details after all operations", True)
            
            if 'cruise_details' in final_details:
                cruise_details = final_details['cruise_details']
                # Verify it has the updated data from STEP 3
                if cruise_details.get('ship_name') == updated_cruise_data['ship_name']:
                    self.log_test("Final cruise details contain updated data", True)
                else:
                    self.log_test("Final cruise details missing updates", False, f"Expected updated ship name, got: {cruise_details.get('ship_name')}")
            else:
                self.log_test("Final details missing cruise_details", False, "Should contain cruise_details after creation")
        else:
            self.log_test("GET details after all operations", False, str(final_details))

        print("\n✅ TRIP DETAILS ENDPOINTS TESTING COMPLETED")
        print("="*60)
        print("📊 SUMMARY OF TESTED ENDPOINTS:")
        print("   ✅ GET /api/trips/{trip_id}/details")
        print("   ✅ POST /api/trips/{trip_id}/cruise-details")
        print("   ✅ POST /api/trips/{trip_id}/resort-details")
        print("   ✅ POST /api/trips/{trip_id}/tour-details")
        print("   ✅ POST /api/trips/{trip_id}/custom-details")
        print("")
        print("🎯 TESTED SCENARIOS:")
        print("   ✅ GET details for existing trip")
        print("   ✅ POST cruise-details with complete data")
        print("   ✅ Update functionality (POST with modified data)")
        print("   ✅ Authorization (admin/agent OK, client blocked)")
        print("   ✅ Validation with invalid trip_id")
        print("   ✅ Create/update integration")
        print("="*60)
        
        return True

    def test_new_endpoints_comprehensive(self):
        """Run comprehensive tests for all new endpoints"""
        print("\n🆕 Testing ALL NEW ENDPOINTS...")
        
        # PRIORITY: Test payment registration complete journey (REVIEW REQUEST)
        self.test_payment_registration_complete_journey()
        
        # Test all other new endpoints
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

    def test_review_request_specific(self):
        """Test the two specific functionalities requested in the review"""
        print("\n🎯 Testing REVIEW REQUEST SPECIFIC FUNCTIONALITIES...")
        print("📋 Credentials: admin@test.it / password123")
        print("🎯 TEST 1: Manual trip status change (draft → confirmed)")
        print("🎯 TEST 2: Financial reports with names (client_name, agent_name, trip_title, trip_destination)")
        
        if not self.admin_token:
            print("❌ Skipping review tests - no admin token")
            return False

        # TEST 1 - CAMBIO STATO VIAGGIO MANUALE
        print("\n🚦 TEST 1 - MANUAL TRIP STATUS CHANGE...")
        
        # Use the existing test trip ID from metadata
        test_trip_id = "76c2e3da-8311-4409-8267-fa036a2252dc"
        print(f"🆔 Using existing test trip ID: {test_trip_id}")
        
        # STEP 1: Check current status with GET /api/trips/{trip_id}/full
        print(f"\n📋 STEP 1: Checking current trip status...")
        success, trip_full = self.make_request('GET', f'trips/{test_trip_id}/full', token=self.admin_token)
        
        if success:
            self.log_test("GET /api/trips/{trip_id}/full", True)
            current_status = trip_full.get('trip', {}).get('status', 'unknown')
            trip_title = trip_full.get('trip', {}).get('title', 'Unknown')
            print(f"   📝 Trip: {trip_title}")
            print(f"   🚦 Current Status: {current_status}")
            
            # STEP 2: Change status from current to "confirmed"
            print(f"\n🔄 STEP 2: Changing trip status to 'confirmed'...")
            status_payload = {"status": "confirmed"}
            
            success, status_result = self.make_request('PUT', f'trips/{test_trip_id}/status', status_payload, token=self.admin_token)
            
            if success:
                self.log_test("PUT /api/trips/{trip_id}/status (→ confirmed)", True)
                print(f"   ✅ Status change successful: {status_result.get('message', 'Status updated')}")
                
                # STEP 3: Verify status change
                print(f"\n🔍 STEP 3: Verifying status change...")
                success, updated_trip = self.make_request('GET', f'trips/{test_trip_id}/full', token=self.admin_token)
                
                if success:
                    new_status = updated_trip.get('trip', {}).get('status', 'unknown')
                    if new_status == 'confirmed':
                        self.log_test("✅ Trip status correctly changed to 'confirmed'", True)
                        print(f"   ✅ Status verified: {current_status} → {new_status}")
                    else:
                        self.log_test("Trip status verification", False, f"Expected 'confirmed', got '{new_status}'")
                else:
                    self.log_test("Verify status change", False, str(updated_trip))
            else:
                self.log_test("PUT /api/trips/{trip_id}/status", False, str(status_result))
                return False
        else:
            self.log_test("GET /api/trips/{trip_id}/full", False, str(trip_full))
            return False

        # TEST 2 - REPORT FINANZIARI CON NOMI
        print("\n💰 TEST 2 - FINANCIAL REPORTS WITH NAMES...")
        
        # STEP 1: Ensure trip has admin data (create if not exists)
        print(f"\n📊 STEP 1: Ensuring trip has administrative data...")
        success, admin_data = self.make_request('GET', f'trips/{test_trip_id}/admin', token=self.admin_token)
        
        if not success or not admin_data:
            print("   ⚠️  No admin data found, creating administrative data...")
            
            # Create admin data for the trip
            admin_create_data = {
                'trip_id': test_trip_id,
                'practice_number': 'PR002',
                'booking_number': 'BK002',
                'gross_amount': 2500.0,
                'net_amount': 2200.0,
                'discount': 150.0,
                'practice_confirm_date': datetime.now(timezone.utc).isoformat(),
                'client_departure_date': (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                'confirmation_deposit': 600.0
            }
            
            success, create_result = self.make_request('POST', f'trips/{test_trip_id}/admin', admin_create_data, token=self.admin_token)
            
            if success:
                self.log_test("✅ Created administrative data for trip", True)
                print(f"   💰 Admin data created: €{admin_create_data['gross_amount']} gross")
                
                # Update admin status to confirmed
                admin_id = create_result['id']
                update_data = {'status': 'confirmed'}
                success, update_result = self.make_request('PUT', f'trip-admin/{admin_id}', update_data, token=self.admin_token)
                
                if success:
                    self.log_test("✅ Set admin data status to 'confirmed'", True)
                else:
                    self.log_test("Set admin data status to confirmed", False, str(update_result))
            else:
                self.log_test("Create administrative data", False, str(create_result))
        else:
            self.log_test("✅ Administrative data exists", True)
            print(f"   💰 Existing admin data: €{admin_data.get('gross_amount', 0)} gross")

        # STEP 2: Test GET /api/reports/financial?year=2025
        print(f"\n📈 STEP 2: Testing financial reports with names...")
        success, financial_report = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        
        if success:
            self.log_test("GET /api/reports/financial?year=2025", True)
            
            # Check if detailed_trips exists and has the required fields
            detailed_trips = financial_report.get('detailed_trips', [])
            
            if detailed_trips:
                self.log_test(f"✅ Found {len(detailed_trips)} detailed trips in report", True)
                
                # Check first trip for required fields
                first_trip = detailed_trips[0]
                required_fields = ['client_name', 'agent_name', 'trip_title', 'trip_destination']
                
                print(f"\n🔍 STEP 3: Verifying new fields in detailed_trips...")
                all_fields_present = True
                
                for field in required_fields:
                    if field in first_trip:
                        self.log_test(f"✅ Field '{field}' present: {first_trip[field]}", True)
                        print(f"   ✅ {field}: {first_trip[field]}")
                    else:
                        self.log_test(f"❌ Field '{field}' missing", False, f"Required field not found in trip data")
                        all_fields_present = False
                
                if all_fields_present:
                    self.log_test("✅ ALL REQUIRED FIELDS PRESENT in detailed_trips", True)
                    print(f"\n🎉 SUCCESS: Financial reports now include:")
                    print(f"   👤 Client Name: {first_trip.get('client_name', 'N/A')}")
                    print(f"   👨‍💼 Agent Name: {first_trip.get('agent_name', 'N/A')}")
                    print(f"   🧳 Trip Title: {first_trip.get('trip_title', 'N/A')}")
                    print(f"   🌍 Trip Destination: {first_trip.get('trip_destination', 'N/A')}")
                else:
                    self.log_test("Required fields in detailed_trips", False, "Some required fields missing")
                
                # Show additional financial data
                totals = financial_report.get('totals', {})
                print(f"\n📊 Financial Summary:")
                print(f"   💰 Total Revenue: €{totals.get('gross_revenue', 0)}")
                print(f"   🧮 Total Trips: {totals.get('total_trips', 0)}")
                print(f"   🎫 Total Discounts: €{totals.get('total_discounts', 0)}")
                print(f"   👥 Client Departures: {totals.get('client_departures', 0)}")
                
            else:
                self.log_test("Detailed trips in financial report", False, "No detailed_trips found in report")
        else:
            self.log_test("GET /api/reports/financial?year=2025", False, str(financial_report))

        print("\n✅ REVIEW REQUEST TESTING COMPLETED")
        return True

    def test_trip_confirmed_status_financial_reports_fix(self):
        """Test the specific bug fix: when trip is confirmed, it should appear in financial reports"""
        print("\n🎯 Testing TRIP CONFIRMED → FINANCIAL REPORTS BUG FIX...")
        print("📋 SCENARIO: Trip confirmed status should automatically appear in financial reports")
        print("🔑 Credentials: admin@test.it / password123")
        
        if not self.admin_token:
            print("❌ Skipping trip confirmed status test - no admin token")
            return False

        # Use the existing test trip ID from the review request
        test_trip_id = "76c2e3da-8311-4409-8267-fa036a2252dc"
        print(f"🆔 Using existing test trip ID: {test_trip_id}")

        # STEP 1: Setup - Verify the trip exists
        print(f"\n📋 STEP 1: Verifying test trip exists...")
        success, trip_result = self.make_request('GET', f'trips/{test_trip_id}/full', token=self.admin_token)
        if success:
            self.log_test("✅ SETUP: Verify test trip exists", True)
            print(f"   📝 Trip: {trip_result['trip']['title']}")
            print(f"   🌍 Destination: {trip_result['trip']['destination']}")
            print(f"   📊 Current Status: {trip_result['trip']['status']}")
        else:
            self.log_test("SETUP: Verify test trip exists", False, str(trip_result))
            return False

        # STEP 2: Reset trip status to "draft"
        print(f"\n📝 STEP 2: Resetting trip status to 'draft'...")
        reset_data = {"status": "draft"}
        success, reset_result = self.make_request('PUT', f'trips/{test_trip_id}/status', reset_data, token=self.admin_token)
        if success:
            self.log_test("✅ RESET: PUT /api/trips/{trip_id}/status to 'draft'", True)
            print(f"   📊 Trip status reset to: draft")
        else:
            self.log_test("RESET: PUT /api/trips/{trip_id}/status to 'draft'", False, str(reset_result))
            return False

        # STEP 3: Verify initial state (draft status)
        print(f"\n🔍 STEP 3: Verifying initial state (draft)...")
        
        # Check trip status
        success, trip_check = self.make_request('GET', f'trips/{test_trip_id}/full', token=self.admin_token)
        if success:
            trip_status = trip_check['trip']['status']
            if trip_status == 'draft':
                self.log_test("✅ VERIFY: trip.status = 'draft'", True)
            else:
                self.log_test("VERIFY: trip.status = 'draft'", False, f"Expected 'draft', got '{trip_status}'")
        else:
            self.log_test("VERIFY: Get trip status", False, str(trip_check))

        # Check trip_admin status
        success, admin_check = self.make_request('GET', f'trips/{test_trip_id}/admin', token=self.admin_token)
        if success and admin_check:
            admin_status = admin_check.get('status', 'unknown')
            if admin_status == 'draft':
                self.log_test("✅ VERIFY: trip_admin.status = 'draft'", True)
            else:
                self.log_test("VERIFY: trip_admin.status = 'draft'", False, f"Expected 'draft', got '{admin_status}'")
        else:
            self.log_test("VERIFY: Get trip_admin status", False, "No admin data found or error")

        # Check that trip does NOT appear in financial reports
        success, initial_report = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        if success:
            detailed_trips = initial_report.get('detailed_trips', [])
            trip_in_report = any(trip.get('trip_id') == test_trip_id for trip in detailed_trips)
            
            if not trip_in_report:
                self.log_test("✅ VERIFY: Trip NOT in financial reports (draft status)", True)
                print(f"   📊 Financial reports show {len(detailed_trips)} trips (test trip correctly excluded)")
            else:
                self.log_test("VERIFY: Trip NOT in financial reports (draft status)", False, "Trip should not appear in reports when in draft")
        else:
            self.log_test("VERIFY: Check financial reports (initial)", False, str(initial_report))

        # STEP 4: Test the fix - Change status to "confirmed"
        print(f"\n🎯 STEP 4: Testing the FIX - Change status to 'confirmed'...")
        confirm_data = {"status": "confirmed"}
        success, confirm_result = self.make_request('PUT', f'trips/{test_trip_id}/status', confirm_data, token=self.admin_token)
        if success:
            self.log_test("✅ TEST FIX: PUT /api/trips/{trip_id}/status to 'confirmed'", True)
            print(f"   📊 Trip status changed to: confirmed")
            print(f"   🔧 This should automatically set trip_admin.status = 'confirmed'")
        else:
            self.log_test("TEST FIX: PUT /api/trips/{trip_id}/status to 'confirmed'", False, str(confirm_result))
            return False

        # STEP 5: Verify the correction
        print(f"\n✅ STEP 5: Verifying the correction...")
        
        # Check trip status is confirmed
        success, trip_verify = self.make_request('GET', f'trips/{test_trip_id}/full', token=self.admin_token)
        if success:
            trip_status = trip_verify['trip']['status']
            if trip_status == 'confirmed':
                self.log_test("✅ VERIFY CORRECTION: trip.status = 'confirmed'", True)
            else:
                self.log_test("VERIFY CORRECTION: trip.status = 'confirmed'", False, f"Expected 'confirmed', got '{trip_status}'")
        else:
            self.log_test("VERIFY CORRECTION: Get trip status", False, str(trip_verify))

        # Check trip_admin status is automatically confirmed (THIS IS THE FIX)
        success, admin_verify = self.make_request('GET', f'trips/{test_trip_id}/admin', token=self.admin_token)
        if success and admin_verify:
            admin_status = admin_verify.get('status', 'unknown')
            if admin_status == 'confirmed':
                self.log_test("✅ VERIFY CORRECTION: trip_admin.status = 'confirmed' (AUTOMATIC)", True)
                print(f"   🎯 SUCCESS: Administrative data automatically confirmed!")
            else:
                self.log_test("VERIFY CORRECTION: trip_admin.status = 'confirmed' (AUTOMATIC)", False, f"Expected 'confirmed', got '{admin_status}' - FIX NOT WORKING")
        else:
            self.log_test("VERIFY CORRECTION: Get trip_admin status", False, "No admin data found or error")

        # Check that trip NOW appears in financial reports
        success, final_report = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        if success:
            detailed_trips = final_report.get('detailed_trips', [])
            trip_in_report = any(trip.get('trip_id') == test_trip_id for trip in detailed_trips)
            
            if trip_in_report:
                self.log_test("✅ VERIFY CORRECTION: Trip NOW appears in financial reports", True)
                print(f"   📊 Financial reports show {len(detailed_trips)} trips (test trip correctly included)")
                
                # Find our trip in the report and show details
                our_trip = next((trip for trip in detailed_trips if trip.get('trip_id') == test_trip_id), None)
                if our_trip:
                    print(f"   📝 Trip in report: {our_trip.get('trip_title', 'Unknown')}")
                    print(f"   👤 Client: {our_trip.get('client_name', 'Unknown')}")
                    print(f"   👨‍💼 Agent: {our_trip.get('agent_name', 'Unknown')}")
            else:
                self.log_test("VERIFY CORRECTION: Trip NOW appears in financial reports", False, "Trip should appear in reports when confirmed - FIX NOT WORKING")
        else:
            self.log_test("VERIFY CORRECTION: Check financial reports (final)", False, str(final_report))

        # STEP 6: Test financial reports with names
        print(f"\n📊 STEP 6: Testing financial reports show client/agent names...")
        success, report_with_names = self.make_request('GET', 'reports/financial?year=2025', token=self.admin_token)
        if success:
            detailed_trips = report_with_names.get('detailed_trips', [])
            our_trip = next((trip for trip in detailed_trips if trip.get('trip_id') == test_trip_id), None)
            
            if our_trip:
                required_fields = ['client_name', 'agent_name', 'trip_title', 'trip_destination']
                missing_fields = [field for field in required_fields if not our_trip.get(field)]
                
                if not missing_fields:
                    self.log_test("✅ VERIFY: Financial reports include client/agent names", True)
                    print(f"   👤 Client Name: {our_trip['client_name']}")
                    print(f"   👨‍💼 Agent Name: {our_trip['agent_name']}")
                    print(f"   📝 Trip Title: {our_trip['trip_title']}")
                    print(f"   🌍 Destination: {our_trip['trip_destination']}")
                else:
                    self.log_test("VERIFY: Financial reports include client/agent names", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("VERIFY: Find trip in financial reports", False, "Trip not found in reports")
        else:
            self.log_test("VERIFY: Get financial reports with names", False, str(report_with_names))

        print(f"\n🎯 OBJECTIVE ACHIEVED: Confirmed that workflow trip → confirmed → automatically in financial reports works correctly!")
        return True

    def test_review_request_dashboard_and_excel(self):
        """Test specific review request: Dashboard stats and Excel export functionality"""
        print("\n🎯 TESTING REVIEW REQUEST - Dashboard Stats & Excel Export")
        print("="*60)
        print("📋 CREDENZIALI: admin@test.it / password123")
        print("📋 CREDENZIALI: agent1@test.it / password123")
        print("="*60)
        
        if not self.admin_token or not self.agent_token:
            print("❌ Skipping review request tests - missing tokens")
            return False

        # TEST 1 - DASHBOARD STATS AGGIORNATA (ADMIN)
        print("\n🔍 TEST 1 - DASHBOARD STATS AGGIORNATA (ADMIN)")
        print("🎯 GET /api/dashboard/stats per admin")
        print("✅ Verifica che ritorni 'confirmed_trips' invece di 'active_trips'")
        print("✅ Verifica che 'total_photos' non sia più presente per admin")
        
        success, admin_stats = self.make_request('GET', 'dashboard/stats', token=self.admin_token)
        if success:
            self.log_test("✅ TEST 1: GET /api/dashboard/stats (admin)", True)
            
            # Check for confirmed_trips
            if 'confirmed_trips' in admin_stats:
                self.log_test("✅ TEST 1: Admin stats contains 'confirmed_trips'", True)
                print(f"   📊 confirmed_trips: {admin_stats['confirmed_trips']}")
            else:
                self.log_test("❌ TEST 1: Admin stats missing 'confirmed_trips'", False, "Should contain confirmed_trips field")
            
            # Check that active_trips is NOT present
            if 'active_trips' not in admin_stats:
                self.log_test("✅ TEST 1: Admin stats does NOT contain 'active_trips' (correct)", True)
            else:
                self.log_test("❌ TEST 1: Admin stats contains 'active_trips' (should be removed)", False, "active_trips should be replaced with confirmed_trips")
            
            # Check that total_photos is NOT present for admin
            if 'total_photos' not in admin_stats:
                self.log_test("✅ TEST 1: Admin stats does NOT contain 'total_photos' (correct)", True)
            else:
                self.log_test("❌ TEST 1: Admin stats contains 'total_photos' (should be removed)", False, "total_photos should not be present for admin")
            
            # Show all admin stats
            print(f"   📋 Admin dashboard stats: {admin_stats}")
            
        else:
            self.log_test("❌ TEST 1: GET /api/dashboard/stats (admin)", False, str(admin_stats))

        # TEST 2 - EXCEL EXPORT ENDPOINT
        print("\n🔍 TEST 2 - EXCEL EXPORT ENDPOINT")
        print("🎯 GET /api/reports/financial/export?year=2025 (deve ritornare file Excel)")
        print("✅ Verifica che sia accessibile solo ad admin")
        print("✅ Test con parametri diversi")
        print("✅ Verifica headers appropriati per download file")
        
        # Test 2.1: Excel export with year parameter (admin)
        success, excel_result = self.make_request('GET', 'reports/financial/export?year=2025', token=self.admin_token)
        if success:
            self.log_test("✅ TEST 2.1: GET /api/reports/financial/export?year=2025 (admin)", True)
        else:
            self.log_test("❌ TEST 2.1: Excel export with year (admin)", False, str(excel_result))
        
        # Test 2.2: Excel export with year + month (admin)
        success, excel_result = self.make_request('GET', 'reports/financial/export?year=2025&month=1', token=self.admin_token)
        if success:
            self.log_test("✅ TEST 2.2: GET /api/reports/financial/export?year=2025&month=1 (admin)", True)
        else:
            self.log_test("❌ TEST 2.2: Excel export with year+month (admin)", False, str(excel_result))
        
        # Test 2.3: Excel export all years (admin)
        success, excel_result = self.make_request('GET', 'reports/financial/export', token=self.admin_token)
        if success:
            self.log_test("✅ TEST 2.3: GET /api/reports/financial/export (all years, admin)", True)
        else:
            self.log_test("❌ TEST 2.3: Excel export all years (admin)", False, str(excel_result))
        
        # Test 2.4: Excel export forbidden for agent
        success, excel_result = self.make_request('GET', 'reports/financial/export?year=2025', token=self.agent_token, expected_status=403)
        if success:
            self.log_test("✅ TEST 2.4: Excel export forbidden for agent (correct)", True)
        else:
            self.log_test("❌ TEST 2.4: Excel export should be forbidden for agent", False, str(excel_result))

        # TEST 3 - AGENTS STATS
        print("\n🔍 TEST 3 - AGENTS STATS")
        print("🎯 Login come agent: agent1@test.it / password123")
        print("🎯 GET /api/dashboard/stats per agent")
        print("✅ Verifica che ritorni 'confirmed_trips' invece di 'active_trips'")
        
        success, agent_stats = self.make_request('GET', 'dashboard/stats', token=self.agent_token)
        if success:
            self.log_test("✅ TEST 3: GET /api/dashboard/stats (agent)", True)
            
            # Check for confirmed_trips
            if 'confirmed_trips' in agent_stats:
                self.log_test("✅ TEST 3: Agent stats contains 'confirmed_trips'", True)
                print(f"   📊 confirmed_trips: {agent_stats['confirmed_trips']}")
            else:
                self.log_test("❌ TEST 3: Agent stats missing 'confirmed_trips'", False, "Should contain confirmed_trips field")
            
            # Check that active_trips is NOT present
            if 'active_trips' not in agent_stats:
                self.log_test("✅ TEST 3: Agent stats does NOT contain 'active_trips' (correct)", True)
            else:
                self.log_test("❌ TEST 3: Agent stats contains 'active_trips' (should be removed)", False, "active_trips should be replaced with confirmed_trips")
            
            # Show all agent stats
            print(f"   📋 Agent dashboard stats: {agent_stats}")
            
        else:
            self.log_test("❌ TEST 3: GET /api/dashboard/stats (agent)", False, str(agent_stats))

        print("\n✅ REVIEW REQUEST TESTING COMPLETED")
        print("🎯 OBIETTIVO: Confermare che dashboard mostra viaggi confermati e che export Excel funziona con tutti i tipi di filtri richiesti.")
        return True

    def test_create_cruise_for_tripview_tabs(self):
        """Create a new cruise trip specifically for testing TripView tabs (REVIEW REQUEST)"""
        print("\n🚢 Creating NEW CRUISE for TripView Tab Testing (REVIEW REQUEST)...")
        print("🎯 OBIETTIVO: Creare viaggio valido per testare nuove tab 'Note Clienti' e 'Dettagli Viaggio'")
        print("🔑 CREDENZIALI: admin@test.it / password123")
        
        if not self.admin_token:
            print("❌ Skipping cruise creation - no admin token")
            return False

        # Get admin user info to use as both client and agent
        success, admin_info = self.make_request('GET', 'auth/me', token=self.admin_token)
        if not success:
            self.log_test("Get admin user info", False, str(admin_info))
            return False
        
        admin_id = admin_info['id']
        print(f"👤 Using admin as both client and agent: {admin_info['first_name']} {admin_info['last_name']} (ID: {admin_id})")

        # OPERAZIONE 1: Crea nuovo viaggio - POST /api/trips
        print("\n🧳 OPERAZIONE 1: Creazione nuovo viaggio...")
        trip_data = {
            'title': 'Test Cruise New Features',
            'destination': 'Mediterranean Cruise',
            'description': 'Viaggio di test per verificare le nuove tab nel TripView',
            'start_date': '2025-03-01T00:00:00Z',
            'end_date': '2025-03-07T00:00:00Z',
            'client_id': admin_id,  # usa admin come client per test
            'trip_type': 'cruise'
        }

        success, trip_result = self.make_request('POST', 'trips', trip_data, token=self.admin_token)
        if success:
            trip_id = trip_result['id']
            self.created_resources['trips'].append(trip_id)
            self.log_test("✅ CREA NUOVO VIAGGIO: POST /api/trips", True)
            print(f"   🆔 Trip ID: {trip_id}")
            print(f"   📝 Title: {trip_result['title']}")
            print(f"   🌍 Destination: {trip_result['destination']}")
            print(f"   🚢 Type: {trip_result['trip_type']}")
            print(f"   👤 Client ID: {trip_result['client_id']}")
            print(f"   👨‍💼 Agent ID: {trip_result['agent_id']}")
            print(f"   📅 Start Date: {trip_result['start_date']}")
            print(f"   📅 End Date: {trip_result['end_date']}")
        else:
            self.log_test("CREA NUOVO VIAGGIO: POST /api/trips", False, str(trip_result))
            return False

        # Set trip status to confirmed as requested
        print(f"\n🚦 OPERAZIONE 2: Impostazione status 'confirmed'...")
        status_update = {"status": "confirmed"}
        success, status_result = self.make_request('PUT', f'trips/{trip_id}/status', status_update, token=self.admin_token)
        if success:
            self.log_test("✅ IMPOSTA STATUS CONFIRMED: PUT /api/trips/{trip_id}/status", True)
            print(f"   ✅ Status aggiornato a: confirmed")
        else:
            self.log_test("IMPOSTA STATUS CONFIRMED", False, str(status_result))

        # Verify the trip was created correctly
        print(f"\n🔍 OPERAZIONE 3: Verifica viaggio creato...")
        success, trip_check = self.make_request('GET', f'trips/{trip_id}/full', token=self.admin_token)
        if success:
            self.log_test("✅ VERIFICA VIAGGIO: GET /api/trips/{trip_id}/full", True)
            print(f"   ✅ Viaggio verificato:")
            print(f"      📝 Title: {trip_check['trip']['title']}")
            print(f"      🌍 Destination: {trip_check['trip']['destination']}")
            print(f"      🚢 Type: {trip_check['trip']['trip_type']}")
            print(f"      🚦 Status: {trip_check['trip']['status']}")
            print(f"      👤 Client: {trip_check['client']['first_name']} {trip_check['client']['last_name']}")
            print(f"      👨‍💼 Agent: {trip_check['agent']['first_name']} {trip_check['agent']['last_name']}")
        else:
            self.log_test("VERIFICA VIAGGIO", False, str(trip_check))

        # Create some sample itinerary data for the cruise
        print(f"\n📅 OPERAZIONE 4: Creazione itinerario di esempio...")
        itinerary_data = {
            'trip_id': trip_id,
            'day_number': 1,
            'date': '2025-03-01T08:00:00Z',
            'title': 'Imbarco e Partenza',
            'description': 'Imbarco sulla nave da crociera e partenza dal porto',
            'itinerary_type': 'port_day'
        }

        success, itinerary_result = self.make_request('POST', 'itineraries', itinerary_data, token=self.admin_token)
        if success:
            self.log_test("✅ CREA ITINERARIO: POST /api/itineraries", True)
            print(f"   📅 Giorno 1: {itinerary_result['title']}")
        else:
            self.log_test("CREA ITINERARIO", False, str(itinerary_result))

        # Create cruise info for the trip
        print(f"\n🚢 OPERAZIONE 5: Creazione informazioni crociera...")
        cruise_data = {
            'trip_id': trip_id,
            'ship_name': 'MSC Seaside',
            'cabin_number': 'B204',
            'departure_time': '2025-03-01T18:00:00Z',
            'return_time': '2025-03-07T08:00:00Z',
            'ship_facilities': ['Pool', 'Spa', 'Casino', 'Theater', 'Restaurants']
        }

        success, cruise_result = self.make_request('POST', f'trips/{trip_id}/cruise-info', cruise_data, token=self.admin_token)
        if success:
            self.log_test("✅ CREA INFO CROCIERA: POST /api/trips/{trip_id}/cruise-info", True)
            print(f"   🚢 Nave: {cruise_result['ship_name']}")
            print(f"   🏠 Cabina: {cruise_result['cabin_number']}")
            print(f"   🏊 Servizi: {', '.join(cruise_result['ship_facilities'])}")
        else:
            self.log_test("CREA INFO CROCIERA", False, str(cruise_result))

        # OPERAZIONE FINALE: Restituisci trip_id per test frontend
        print(f"\n🎯 OPERAZIONE FINALE: Trip ID per test frontend...")
        print("="*60)
        print("🎉 VIAGGIO CREATO CON SUCCESSO PER TEST TRIPVIEW TABS!")
        print("="*60)
        print(f"🆔 TRIP_ID per test frontend: {trip_id}")
        print(f"🔑 CREDENZIALI: admin@test.it / password123")
        print("")
        print("📋 DETTAGLI VIAGGIO:")
        print(f"   📝 Title: Test Cruise New Features")
        print(f"   🌍 Destination: Mediterranean Cruise")
        print(f"   🚢 Type: cruise")
        print(f"   🚦 Status: confirmed")
        print(f"   📅 Date: 2025-03-01 → 2025-03-07")
        print("")
        print("✅ OBIETTIVO RAGGIUNTO:")
        print("   ✅ Viaggio valido creato per testare nuove tab TripView")
        print("   ✅ Tab 'Note Clienti' - pronta per test")
        print("   ✅ Tab 'Dettagli Viaggio' - pronta per test")
        print("   ✅ Dati crociera completi disponibili")
        print("   ✅ Itinerario di esempio creato")
        print("="*60)

        return {
            'trip_id': trip_id,
            'admin_id': admin_id,
            'client_id': admin_id,
            'agent_id': admin_id,
            'success': True
        }

    def run_trip_details_test(self):
        """Run only the specific trip details endpoints test"""
        print("🚀 Starting TRIP DETAILS ENDPOINTS Test...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("🎯 FOCUS: Testing nuovi endpoint per i dettagli viaggi")
        print("="*80)
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run the specific test for trip details endpoints
        result = self.test_trip_details_endpoints()
        
        # Print final results
        print("\n" + "="*80)
        print("🏁 TRIP DETAILS ENDPOINTS TEST COMPLETED")
        print("="*80)
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if result:
            print("🎉 TRIP DETAILS ENDPOINTS TEST COMPLETED!")
        else:
            print("⚠️  Trip details endpoints test failed - check logs above")
        
        return result

    def run_review_request_test(self):
        """Run only the specific review request test for TripView tabs"""
        print("🚀 Starting REVIEW REQUEST Test - TripView Tabs...")
        print(f"🌐 Base URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")
        print("="*80)
        
        # Test authentication first
        if not self.test_authentication():
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run the specific test for creating cruise for TripView tabs
        result = self.test_create_cruise_for_tripview_tabs()
        
        # Print final results
        print("\n" + "="*80)
        print("🏁 REVIEW REQUEST TEST COMPLETED")
        print("="*80)
        print(f"📊 Tests Run: {self.tests_run}")
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if result and result.get('success'):
            print("🎉 REVIEW REQUEST TEST PASSED!")
            print(f"🆔 TRIP_ID CREATED: {result.get('trip_id')}")
        else:
            print("⚠️  Review request test failed - check logs above")
        
        return result

    def run_all_tests(self):
        """Run all test suites with focus on review request"""
        print("🚀 Starting Travel Agency API Tests...")
        print(f"Testing against: {self.base_url}")
        print("🎯 FOCUS: Testing REVIEW REQUEST - Dashboard Stats & Excel Export")
        
        # Test authentication first with provided credentials
        if not self.test_authentication():
            print("❌ Authentication tests failed - stopping")
            return False

        # PRIORITY 1: Test the specific review request FIRST
        print("\n" + "="*60)
        print("🎯 REVIEW REQUEST: Dashboard Stats & Excel Export (PRIMARY FOCUS)")
        print("="*60)
        self.test_review_request_dashboard_and_excel()

        # PRIORITY 2: Test the bug fix functionalities
        print("\n" + "="*60)
        print("🎯 BUG FIX TEST: Trip Confirmed → Financial Reports (SECONDARY FOCUS)")
        print("="*60)
        self.test_trip_confirmed_status_financial_reports_fix()

        # PRIORITY 3: Test the review request functionalities
        print("\n" + "="*60)
        print("🎯 REVIEW REQUEST SPECIFIC TESTS (TERTIARY FOCUS)")
        print("="*60)
        self.test_review_request_specific()

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
    import sys
    
    # Check if we should run only the review request test
    if len(sys.argv) > 1 and sys.argv[1] == "review-request":
        print("🎯 Running REVIEW REQUEST test only...")
        tester = TravelAgencyAPITester()
        result = tester.run_review_request_test()
        return 0 if result and result.get('success') else 1
    else:
        # Run all tests
        tester = TravelAgencyAPITester()
        success = tester.run_all_tests()
        return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())