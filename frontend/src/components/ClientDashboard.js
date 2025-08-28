import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Plane, 
  Calendar, 
  Camera, 
  LogOut, 
  MapPin,
  Clock,
  User,
  Eye,
  Image,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats and trips
      const [statsRes, tripsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/trips/with-details`)
      ]);

      setStats(statsRes.data);
      setMyTrips(tripsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Attivo';
      case 'draft':
        return 'Bozza';
      case 'completed':
        return 'Completato';
      case 'cancelled':
        return 'Annullato';
      default:
        return status;
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
              <h1 className="text-xl font-bold text-slate-800">I Miei Viaggi</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                {user?.first_name} {user?.last_name}
              </span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Cliente
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
            Benvenuto, {user?.first_name}!
          </h2>
          <p className="text-slate-600">
            Gestisci i tuoi viaggi, visualizza itinerari e condividi i tuoi ricordi
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                I Miei Viaggi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Plane className="h-8 w-8 text-blue-200 mr-3" />
                <div className="text-2xl font-bold">{stats.my_trips || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100">
                Viaggi Futuri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-200 mr-3" />
                <div className="text-2xl font-bold">{stats.upcoming_trips || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">
                Le Mie Foto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Camera className="h-8 w-8 text-purple-200 mr-3" />
                <div className="text-2xl font-bold">{stats.my_photos || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Trips */}
        <Card>
          <CardHeader>
            <CardTitle>I Miei Viaggi</CardTitle>
            <CardDescription>
              Tutti i tuoi viaggi organizzati dalla nostra agenzia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTrips.length > 0 ? myTrips.map((tripData) => (
                <div key={tripData.trip.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-teal-50 rounded-lg">
                          <Plane className="w-6 h-6 text-teal-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-slate-800 mb-2">
                            {tripData.trip.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{tripData.trip.destination}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(tripData.trip.start_date).toLocaleDateString('it-IT')} - 
                                {new Date(tripData.trip.end_date).toLocaleDateString('it-IT')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>
                                Agente: {tripData.agent?.first_name} {tripData.agent?.last_name}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-600 mb-4">{tripData.trip.description}</p>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusColor(tripData.trip.status)}>
                              {getStatusLabel(tripData.trip.status)}
                            </Badge>
                            <Badge variant="outline">
                              {tripData.trip.trip_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Link to={`/trips/${tripData.trip.id}`}>
                        <Button size="sm" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Dettagli
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-16">
                  <Plane className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    Nessun viaggio ancora
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Contatta la nostra agenzia per organizzare il tuo prossimo viaggio
                  </p>
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-medium text-teal-800 mb-2">Contattaci</h4>
                    <p className="text-sm text-teal-700">
                      Parlaci delle tue destinazioni dei sogni e organizzeremo 
                      un viaggio perfetto per te!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ClientDashboard;