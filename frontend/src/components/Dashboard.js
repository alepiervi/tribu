import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { 
  Plane, 
  Users, 
  Calendar, 
  TrendingUp, 
  LogOut, 
  Settings,
  Bell,
  Search,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Errore nel caricamento delle statistiche');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Plane className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">Travel Agency</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Benvenuto, {user?.first_name} {user?.last_name}
              </span>
              <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Esci
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Dashboard
          </h2>
          <p className="text-slate-600">
            Panoramica delle attività dell'agenzia viaggi
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Viaggi Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-blue-200 mr-3" />
                <div className="text-2xl font-bold">
                  {stats.total_trips || stats.my_trips || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Viaggi Attivi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-200 mr-3" />
                <div className="text-2xl font-bold">
                  {stats.active_trips || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                {user?.role === 'client' ? 'Le Mie Foto' : 'Utenti Totali'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-200 mr-3" />
                <div className="text-2xl font-bold">
                  {stats.my_photos || stats.total_users || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">
                {user?.role === 'client' ? 'Viaggi Futuri' : 'Viaggi Completati'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-200 mr-3" />
                <div className="text-2xl font-bold">
                  {stats.upcoming_trips || stats.completed_trips || stats.total_photos || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
            <CardDescription>
              Accesso rapido alle funzionalità principali
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.role !== 'client' && (
                <>
                  <Button
                    className="flex items-center gap-3 h-auto p-4 bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                    variant="outline"
                    onClick={() => window.location.href = '/manage-trips'}
                  >
                    <Plus className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Gestisci Viaggi</div>
                      <div className="text-sm text-teal-600">Crea e modifica viaggi</div>
                    </div>
                  </Button>

                  <Button
                    className="flex items-center gap-3 h-auto p-4 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                    variant="outline"
                    onClick={() => window.location.href = '/clients'}
                  >
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Gestisci Clienti</div>
                      <div className="text-sm text-blue-600">Visualizza e modifica clienti</div>
                    </div>
                  </Button>

                  <Button
                    className="flex items-center gap-3 h-auto p-4 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                    variant="outline"
                    onClick={() => window.location.href = '/financial-reports'}
                  >
                    <TrendingUp className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Report Finanziari</div>
                      <div className="text-sm text-purple-600">Analytics e commissioni</div>
                    </div>
                  </Button>
                </>
              )}

              <Button
                className="flex items-center gap-3 h-auto p-4 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                variant="outline"
                onClick={() => window.location.href = '/calendar'}
              >
                <Calendar className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Calendario</div>
                  <div className="text-sm text-green-600">Visualizza programmi viaggi</div>
                </div>
              </Button>

              {user?.role !== 'client' && (
                <Button
                  className="flex items-center gap-3 h-auto p-4 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                  variant="outline"
                  onClick={() => window.location.href = '/notifications'}
                >
                  <Bell className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Notifiche</div>
                    <div className="text-sm text-orange-600">Scadenze e promemoria</div>
                  </div>
                </Button>
              )}

              {user?.role === 'client' && (
                <Button
                  className="flex items-center gap-3 h-auto p-4 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                  variant="outline"
                  onClick={() => window.location.href = '/trips'}
                >
                  <Search className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">I Miei Viaggi</div>
                    <div className="text-sm text-slate-600">Visualizza tutti i tuoi viaggi</div>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Attività Recente</CardTitle>
            <CardDescription>
              Ultime operazioni nell'agenzia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    Sistema attivo e funzionante
                  </p>
                  <p className="text-xs text-slate-500">
                    Benvenuto nella tua dashboard dell'agenzia viaggi
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Ora
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;