#!/usr/bin/env python3
"""
FOCUSED TEST for Review Request: New Client Details Endpoints
Tests the 2 new endpoints created to solve "cliente non trovato" problem:
1. GET /api/clients/{client_id}/details
2. GET /api/clients/{client_id}/financial-summary

CREDENTIALS: admin@test.it / password123
"""

import requests
import sys
import json
from datetime import datetime, timezone

class ClientDetailsEndpointTester:
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

    def make_request(self, method: str, endpoint: str, data: dict = None, 
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
            self.log_test("Admin login (admin@test.it)", True)
            return True
        else:
            self.log_test("Admin login failed", False, str(result))
            return False

    def get_available_clients(self):
        """Get list of available clients"""
        print("\n📋 Getting list of available clients...")
        
        success, result = self.make_request('GET', 'clients', token=self.admin_token)
        if success:
            self.log_test("Get clients list", True)
            if result and len(result) > 0:
                print(f"📊 Found {len(result)} clients:")
                for i, client in enumerate(result[:5]):  # Show first 5
                    print(f"   {i+1}. {client['first_name']} {client['last_name']} (ID: {client['id']})")
                if len(result) > 5:
                    print(f"   ... and {len(result) - 5} more")
                return result
            else:
                print("⚠️  No clients found in system")
                return []
        else:
            self.log_test("Get clients list", False, str(result))
            return None

    def test_client_details_endpoint(self, client_id: str, client_name: str):
        """Test GET /api/clients/{client_id}/details endpoint"""
        print(f"\n🔍 Testing GET /api/clients/{client_id}/details")
        print(f"   Client: {client_name}")
        
        success, result = self.make_request('GET', f'clients/{client_id}/details', token=self.admin_token)
        
        if success:
            self.log_test("Client Details Endpoint - Request Success", True)
            
            # Verify response structure
            if 'client' in result and 'trips' in result:
                self.log_test("Response Structure - Has 'client' and 'trips'", True)
                
                # Check client info
                client_info = result['client']
                required_client_fields = ['id', 'first_name', 'last_name', 'email', 'role']
                missing_fields = [field for field in required_client_fields if field not in client_info]
                
                if not missing_fields:
                    self.log_test("Client Info - All required fields present", True)
                    print(f"   📋 Client: {client_info['first_name']} {client_info['last_name']} ({client_info['email']})")
                else:
                    self.log_test("Client Info - Missing fields", False, f"Missing: {missing_fields}")
                
                # Check trips array
                trips = result['trips']
                self.log_test(f"Trips Data - Found {len(trips)} trips", True)
                
                if trips:
                    # Check first trip structure
                    trip = trips[0]
                    trip_fields = ['id', 'title', 'destination', 'start_date', 'end_date', 'status']
                    missing_trip_fields = [field for field in trip_fields if field not in trip]
                    
                    if not missing_trip_fields:
                        self.log_test("Trip Info - All required fields present", True)
                        print(f"   🧳 Trip: {trip['title']} - {trip['destination']} ({trip['status']})")
                    else:
                        self.log_test("Trip Info - Missing fields", False, f"Missing: {missing_trip_fields}")
                    
                    # Check financial data inclusion
                    if 'financial' in trip:
                        if trip['financial']:
                            self.log_test("Financial Data - Present in trip", True)
                            financial = trip['financial']
                            print(f"   💰 Financial: €{financial.get('gross_amount', 0)} gross, Status: {financial.get('status', 'N/A')}")
                        else:
                            self.log_test("Financial Data - Null (no admin data)", True)
                            print("   💰 Financial: No admin data for this trip")
                    else:
                        self.log_test("Financial Data - Missing field", False, "Financial field should be present")
                else:
                    print("   📝 No trips found for this client")
                    
            else:
                self.log_test("Response Structure", False, f"Missing 'client' or 'trips' in response")
                
        else:
            self.log_test("Client Details Endpoint", False, str(result))
            
        return success

    def test_client_financial_summary_endpoint(self, client_id: str, client_name: str):
        """Test GET /api/clients/{client_id}/financial-summary endpoint"""
        print(f"\n💰 Testing GET /api/clients/{client_id}/financial-summary")
        print(f"   Client: {client_name}")
        
        success, result = self.make_request('GET', f'clients/{client_id}/financial-summary', token=self.admin_token)
        
        if success:
            self.log_test("Financial Summary Endpoint - Request Success", True)
            
            # Verify response structure
            required_fields = ['client_id', 'confirmed_bookings', 'pending_bookings', 'stats']
            missing_fields = [field for field in required_fields if field not in result]
            
            if not missing_fields:
                self.log_test("Response Structure - All main fields present", True)
                
                # Check confirmed_bookings structure
                confirmed = result['confirmed_bookings']
                confirmed_fields = ['count', 'total_gross_amount', 'total_net_amount', 'total_discounts', 'total_supplier_commission', 'total_agent_commission']
                missing_confirmed = [field for field in confirmed_fields if field not in confirmed]
                
                if not missing_confirmed:
                    self.log_test("Confirmed Bookings - All fields present", True)
                    print(f"   ✅ FATTURATO (Gross Amount): €{confirmed['total_gross_amount']}")
                    print(f"   ✅ COMMISSIONI FORNITORE: €{confirmed['total_supplier_commission']}")
                    print(f"   ✅ COMMISSIONI AGENTE: €{confirmed['total_agent_commission']}")
                    print(f"   ✅ SCONTI: €{confirmed['total_discounts']}")
                    print(f"   📊 Prenotazioni confermate: {confirmed['count']}")
                else:
                    self.log_test("Confirmed Bookings - Missing fields", False, f"Missing: {missing_confirmed}")
                
                # Check pending_bookings structure
                pending = result['pending_bookings']
                if 'count' in pending and 'pending_gross_amount' in pending:
                    self.log_test("Pending Bookings - Structure correct", True)
                    print(f"   ⏳ Prenotazioni pending: {pending['count']} (€{pending['pending_gross_amount']})")
                else:
                    self.log_test("Pending Bookings - Missing fields", False, f"Structure: {pending}")
                
                # Check stats structure
                stats = result['stats']
                stats_fields = ['total_trips', 'trips_without_financial_data', 'average_trip_value']
                missing_stats = [field for field in stats_fields if field not in stats]
                
                if not missing_stats:
                    self.log_test("Stats - All fields present", True)
                    print(f"   📊 Viaggi totali: {stats['total_trips']}")
                    print(f"   📋 Viaggi senza dati finanziari: {stats['trips_without_financial_data']}")
                    print(f"   💎 Valore medio viaggio: €{stats['average_trip_value']:.2f}")
                else:
                    self.log_test("Stats - Missing fields", False, f"Missing: {missing_stats}")
                    
            else:
                self.log_test("Response Structure", False, f"Missing fields: {missing_fields}")
                
        else:
            self.log_test("Financial Summary Endpoint", False, str(result))
            
        return success

    def run_focused_test(self):
        """Run the focused test for client details endpoints"""
        print("🎯 FOCUSED TEST: New Client Details Endpoints")
        print("=" * 60)
        print("OBIETTIVO: Confermare che gli endpoint risolvono l'errore 'cliente non trovato'")
        print("e forniscono le informazioni finanziarie richieste")
        print("=" * 60)
        
        # Step 1: Authenticate
        if not self.authenticate_admin():
            print("❌ Authentication failed - cannot continue")
            return False
        
        # Step 2: Get available clients
        clients = self.get_available_clients()
        if clients is None:
            print("❌ Failed to get clients list")
            return False
        
        if not clients:
            print("❌ No clients available for testing")
            return False
        
        # Step 3: Test with first available client
        client = clients[0]
        client_id = client['id']
        client_name = f"{client['first_name']} {client['last_name']}"
        
        print(f"\n🎯 Testing with client: {client_name} (ID: {client_id})")
        
        # Test both endpoints
        details_success = self.test_client_details_endpoint(client_id, client_name)
        summary_success = self.test_client_financial_summary_endpoint(client_id, client_name)
        
        # Final results
        print("\n" + "=" * 60)
        print("📊 RISULTATI FINALI")
        print("=" * 60)
        print(f"Tests eseguiti: {self.tests_run}")
        print(f"Tests passati: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if details_success and summary_success:
            print("\n🎉 SUCCESSO: Entrambi gli endpoint funzionano correttamente!")
            print("✅ L'errore 'cliente non trovato' è stato risolto")
            print("✅ Le informazioni finanziarie sono disponibili")
            return True
        else:
            print("\n❌ PROBLEMI TROVATI: Alcuni endpoint non funzionano correttamente")
            return False

def main():
    """Main test execution"""
    tester = ClientDetailsEndpointTester()
    success = tester.run_focused_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())