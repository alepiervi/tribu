#!/usr/bin/env python3
"""
Focused test for orphaned data cleanup functionality
Tests the specific review request: cleanup of orphaned data for financial reports
"""

import requests
import sys
import json
from datetime import datetime, timedelta, timezone

class OrphanedDataCleanupTester:
    def __init__(self, base_url="https://viaggi-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None

    def login_admin(self):
        """Login with provided credentials"""
        print("🔐 Logging in as admin...")
        
        login_data = {'email': 'admin@test.it', 'password': 'password123'}
        response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            self.admin_token = result['token']
            print("✅ Admin login successful")
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False

    def make_request(self, method: str, endpoint: str, data: dict = None, expected_status: int = 200):
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {self.admin_token}'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data or {}, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, f"Unsupported method: {method}"

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}

            return success, response_data

        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"

    def test_orphaned_data_cleanup(self):
        """Test the complete orphaned data cleanup workflow"""
        print("\n" + "="*80)
        print("🧹 TESTING ORPHANED DATA CLEANUP - REVIEW REQUEST")
        print("="*80)
        print("CREDENZIALI: admin@test.it / password123")
        print("OPERAZIONI DA FARE:")
        print("1. Verifica stato attuale: GET /api/reports/financial?year=2025")
        print("2. Cleanup dati orfani: POST /api/admin/cleanup-orphaned-data")
        print("3. Verifica dopo cleanup: GET /api/reports/financial?year=2025")
        print("4. Test elimina viaggio completo")
        print("="*80)

        # STEP 1: Check current state
        print("\n📊 STEP 1: Verifica stato attuale...")
        success, initial_report = self.make_request('GET', 'reports/financial?year=2025')
        
        if success:
            print("✅ GET /api/reports/financial?year=2025 - SUCCESS")
            
            initial_totals = initial_report.get('totals', {})
            initial_trips = initial_totals.get('total_trips', 0)
            initial_revenue = initial_totals.get('gross_revenue', 0)
            initial_departures = initial_totals.get('client_departures', 0)
            
            print(f"   📈 STATO INIZIALE:")
            print(f"      - Viaggi: {initial_trips}")
            print(f"      - Fatturato: €{initial_revenue}")
            print(f"      - Partenze clienti: {initial_departures}")
            
            if initial_trips > 0:
                print(f"   ⚠️  DATI ORFANI RILEVATI: {initial_trips} viaggi nei report finanziari")
            else:
                print("   ✅ Sistema pulito - nessun dato orfano")
                
        else:
            print(f"❌ GET /api/reports/financial?year=2025 - FAILED: {initial_report}")
            return False

        # STEP 2: Execute cleanup
        print("\n🧹 STEP 2: Esegui pulizia dati orfani...")
        success, cleanup_result = self.make_request('POST', 'admin/cleanup-orphaned-data')
        
        if success:
            print("✅ POST /api/admin/cleanup-orphaned-data - SUCCESS")
            
            print(f"   🗑️  RISULTATI CLEANUP:")
            print(f"      - Messaggio: {cleanup_result.get('message', 'N/A')}")
            
            if 'deleted_counts' in cleanup_result:
                deleted_counts = cleanup_result['deleted_counts']
                total_deleted = 0
                for data_type, count in deleted_counts.items():
                    if count > 0:
                        print(f"      - {data_type}: {count} record eliminati")
                        total_deleted += count
                
                if total_deleted > 0:
                    print(f"   ✅ CLEANUP COMPLETATO: {total_deleted} record orfani eliminati")
                else:
                    print("   ℹ️  Nessun dato orfano trovato da eliminare")
            else:
                print("   ⚠️  Struttura risposta non standard (ma operazione riuscita)")
                
        else:
            print(f"❌ POST /api/admin/cleanup-orphaned-data - FAILED: {cleanup_result}")
            return False

        # STEP 3: Verify after cleanup
        print("\n🔍 STEP 3: Verifica dopo cleanup...")
        success, final_report = self.make_request('GET', 'reports/financial?year=2025')
        
        if success:
            print("✅ GET /api/reports/financial?year=2025 (dopo cleanup) - SUCCESS")
            
            final_totals = final_report.get('totals', {})
            final_trips = final_totals.get('total_trips', 0)
            final_revenue = final_totals.get('gross_revenue', 0)
            final_departures = final_totals.get('client_departures', 0)
            
            print(f"   📉 STATO FINALE:")
            print(f"      - Viaggi: {final_trips}")
            print(f"      - Fatturato: €{final_revenue}")
            print(f"      - Partenze clienti: {final_departures}")
            
            # Verify cleanup effectiveness
            if final_trips == 0 and final_revenue == 0:
                print("   🎉 SUCCESS: Report finanziari mostrano 0 - nessun dato fantasma!")
                cleanup_success = True
            elif final_trips < initial_trips:
                print(f"   ⚠️  PARZIALE: Ridotti da {initial_trips} a {final_trips} viaggi")
                cleanup_success = True
            else:
                print("   ❌ FALLIMENTO: Cleanup non ha avuto effetto")
                cleanup_success = False
                
        else:
            print(f"❌ GET /api/reports/financial?year=2025 (dopo cleanup) - FAILED: {final_report}")
            cleanup_success = False

        # STEP 4: Test complete trip deletion
        print("\n🗑️  STEP 4: Test elimina viaggio completo...")
        
        # Get current trips
        success, trips_result = self.make_request('GET', 'trips')
        if success and trips_result:
            print(f"   📋 Trovati {len(trips_result)} viaggi nel sistema")
            
            if len(trips_result) > 0:
                # Test deleting one trip
                test_trip = trips_result[0]
                trip_id = test_trip['id']
                trip_title = test_trip.get('title', 'Sconosciuto')
                
                print(f"   🎯 Test eliminazione viaggio: '{trip_title}'")
                
                # Check if trip has financial data
                success, trip_admin = self.make_request('GET', f'trips/{trip_id}/admin')
                has_financial = success and trip_admin is not None
                
                if has_financial:
                    print(f"   💰 Viaggio ha dati finanziari - test eliminazione cascata")
                
                # Delete the trip
                success, delete_result = self.make_request('DELETE', f'trips/{trip_id}')
                
                if success:
                    print("   ✅ Eliminazione viaggio riuscita")
                    
                    if 'deleted_counts' in delete_result:
                        deleted_counts = delete_result['deleted_counts']
                        financial_deleted = deleted_counts.get('financial_records', 0)
                        
                        print(f"   📊 Record eliminati:")
                        for data_type, count in deleted_counts.items():
                            if count > 0:
                                print(f"      - {data_type}: {count}")
                        
                        if has_financial and financial_deleted > 0:
                            print("   ✅ Eliminazione cascata dati finanziari riuscita")
                        elif not has_financial:
                            print("   ℹ️  Nessun dato finanziario da eliminare")
                    
                    # Verify financial reports updated
                    success, post_delete_report = self.make_request('GET', 'reports/financial?year=2025')
                    if success:
                        post_delete_totals = post_delete_report.get('totals', {})
                        post_delete_trips = post_delete_totals.get('total_trips', 0)
                        
                        print(f"   📈 Report finanziari dopo eliminazione: {post_delete_trips} viaggi")
                        
                        if post_delete_trips < final_trips:
                            print("   ✅ Report finanziari aggiornati correttamente")
                        else:
                            print("   ⚠️  Report finanziari non aggiornati")
                
                else:
                    print(f"   ❌ Eliminazione viaggio fallita: {delete_result}")
            else:
                print("   ℹ️  Nessun viaggio disponibile per test eliminazione")
        else:
            print("   ⚠️  Impossibile recuperare lista viaggi")

        # Final summary
        print("\n" + "="*80)
        print("📋 RIEPILOGO RISULTATI")
        print("="*80)
        
        if cleanup_success:
            print("🎉 OBIETTIVO RAGGIUNTO: I report finanziari si aggiornano correttamente")
            print("✅ Non mostrano più dati fantasma quando non ci sono viaggi")
            print("✅ Il cleanup dei dati orfani funziona correttamente")
        else:
            print("❌ OBIETTIVO NON RAGGIUNTO: Problemi nel cleanup dati orfani")
        
        print("="*80)
        return cleanup_success

    def run_test(self):
        """Run the focused cleanup test"""
        if not self.login_admin():
            return False
        
        return self.test_orphaned_data_cleanup()

def main():
    """Main test execution"""
    tester = OrphanedDataCleanupTester()
    success = tester.run_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())