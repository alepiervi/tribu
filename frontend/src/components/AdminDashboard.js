import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Plane, 
  Users, 
  Calendar, 
  TrendingUp, 
  LogOut, 
  Settings,
  Bell,
  DollarSign,
  BarChart3,
  UserCheck,
  AlertTriangle,
  Plus,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [recentTrips, setRecentTrips] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [statsRes, tripsRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/trips/with-details`),
        axios.get(`${API}/notifications/payment-deadlines`)
      ]);

      setStats(statsRes.data);
      setRecentTrips(tripsRes.data.slice(0, 5)); // Show last 5 trips
      setNotifications(notificationsRes.data.notifications.slice(0, 3)); // Show top 3 notifications
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
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
              <h1 className="text-xl font-bold text-slate-800">Travel Agency - Admin</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/notifications">
                <Button variant="outline" size="sm" className="relative">
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </Link>
              <span className="text-sm text-slate-600">
                {user?.first_name} {user?.last_name}
              </span>
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Admin
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
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
            Dashboard Amministratore
          </h2>
          <p className="text-slate-600">
            Panoramica completa dell'agenzia viaggi e controllo gestionale
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
                <div className="text-2xl font-bold">{stats.total_trips || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Utenti Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-200 mr-3" />
                <div className="text-2xl font-bold">{stats.total_users || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Viaggi Confermati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-200 mr-3" />
                <div className="text-2xl font-bold">{stats.confirmed_trips || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Azioni Amministrative</CardTitle>
            <CardDescription>
              Strumenti di gestione per amministratori
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/manage-trips">
                <Button
                  className="flex items-center gap-3 h-auto p-4 w-full bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                  variant="outline"
                >
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Gestisci Viaggi</div>
                    <div className="text-sm text-teal-600">Crea e modifica tutti i viaggi</div>
                  </div>
                </Button>
              </Link>

              <Link to="/users">
                <Button
                  className="flex items-center gap-3 h-auto p-4 w-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  variant="outline"
                >
                  <UserCheck className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Gestisci Utenti</div>
                    <div className="text-sm text-blue-600">Admin, agenti e clienti</div>
                  </div>
                </Button>
              </Link>

              <Link to="/financial-reports">
                <Button
                  className="flex items-center gap-3 h-auto p-4 w-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                  variant="outline"
                >
                  <BarChart3 className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Report Finanziari</div>
                    <div className="text-sm text-purple-600">Analytics complete</div>
                  </div>
                </Button>
              </Link>

              <Link to="/commission-calculator">
                <Button
                  className="flex items-center gap-3 h-auto p-4 w-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  variant="outline"
                >
                  <DollarSign className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Calcolatore Commissioni</div>
                    <div className="text-sm text-green-600">Calcoli finanziari</div>
                  </div>
                </Button>
              </Link>

              <Link to="/calendar">
                <Button
                  className="flex items-center gap-3 h-auto p-4 w-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                  variant="outline"
                >
                  <Calendar className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Calendario Globale</div>
                    <div className="text-sm text-orange-600">Tutti i viaggi</div>
                  </div>
                </Button>
              </Link>

              <Link to="/notifications">
                <Button
                  className="flex items-center gap-3 h-auto p-4 w-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  variant="outline"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Centro Notifiche</div>
                    <div className="text-sm text-red-600">Scadenze e avvisi</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Trips */}
          <Card>
            <CardHeader>
              <CardTitle>Viaggi Recenti</CardTitle>
              <CardDescription>
                Ultimi viaggi creati nell'agenzia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrips.length > 0 ? recentTrips.map((tripData) => (
                  <div key={tripData.trip.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{tripData.trip.title}</h4>
                      <p className="text-sm text-slate-600">{tripData.trip.destination}</p>
                      <p className="text-xs text-slate-500">
                        Cliente: {tripData.client?.first_name} {tripData.client?.last_name} | 
                        Agente: {tripData.agent?.first_name} {tripData.agent?.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={tripData.trip.status === 'active' ? 'default' : 'secondary'}
                        className="mb-2"
                      >
                        {tripData.trip.status}
                      </Badge>
                      <Link to={`/trips/${tripData.trip.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-center py-4">Nessun viaggio recente</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifiche Urgenti</CardTitle>
              <CardDescription>
                Avvisi e scadenze importanti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.length > 0 ? notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-slate-800">{notification.title}</h4>
                      <p className="text-sm text-slate-600">{notification.message}</p>
                      <p className="text-xs text-slate-500">
                        Scade in {notification.days_until_due} giorni
                      </p>
                    </div>
                    <Badge 
                      variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-slate-500 text-center py-4">Nessuna notifica urgente</p>
                )}
                {notifications.length > 0 && (
                  <Link to="/notifications">
                    <Button variant="outline" className="w-full">
                      Vedi tutte le notifiche
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;