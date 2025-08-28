import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  ArrowLeft, 
  User,
  Mail,
  Phone,
  Calendar,
  Plane,
  DollarSign,
  TrendingUp,
  Eye,
  MapPin,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ClientDetail = () => {
  const { clientId } = useParams();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [clientTrips, setClientTrips] = useState([]);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      const [clientRes, tripsRes, financialRes] = await Promise.all([
        axios.get(`${API}/users/${clientId}`),
        axios.get(`${API}/trips/with-details`),
        axios.get(`${API}/clients/${clientId}/financial-summary`)
      ]);

      setClient(clientRes.data);
      // Filter trips for this client
      setClientTrips(tripsRes.data.filter(tripData => tripData.trip.client_id === clientId));
      setFinancialSummary(financialRes.data);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Errore nel caricamento dei dati cliente');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTripTypeColor = (type) => {
    switch (type) {
      case 'cruise': return 'bg-blue-100 text-blue-800';
      case 'resort': return 'bg-green-100 text-green-800';
      case 'tour': return 'bg-purple-100 text-purple-800';
      case 'custom': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Cliente non trovato</h2>
          <Link to="/clients">
            <Button>Torna ai Clienti</Button>
          </Link>
        </div>
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
              <Link to="/clients">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <User className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  {client.first_name} {client.last_name}
                </h1>
                <p className="text-sm text-slate-600">Dettagli Cliente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={client.blocked ? 'destructive' : 'secondary'}>
                {client.blocked ? 'Bloccato' : 'Attivo'}
              </Badge>
              <Badge variant="outline">
                Cliente dal {new Date(client.created_at).toLocaleDateString('it-IT')}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="w-6 h-6 text-teal-600" />
              Informazioni Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Registrato il</p>
                    <p className="text-sm">
                      {new Date(client.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              </div>

              {financialSummary && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Plane className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Viaggi Totali</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {financialSummary.total_bookings}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-slate-600">
                    <DollarSign className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Valore Totale</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(financialSummary.total_revenue)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="p-4 bg-teal-50 rounded-lg">
                  <h4 className="font-medium text-teal-800 mb-2">Status Account</h4>
                  <p className="text-sm text-teal-700">
                    {client.blocked ? 'Account bloccato - Contatta amministratore' : 'Account attivo e in regola'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="trips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Viaggi ({clientTrips.length})
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analisi Finanziaria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle>Storico Viaggi</CardTitle>
                <CardDescription>
                  Tutti i viaggi prenotati dal cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientTrips.length > 0 ? (
                  <div className="space-y-4">
                    {clientTrips.map((tripData) => (
                      <div key={tripData.trip.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-teal-50 rounded-lg">
                              <Plane className="w-6 h-6 text-teal-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-slate-800 mb-2">
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
                                {tripData.agent && (
                                  <div className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    <span>
                                      Agente: {tripData.agent.first_name} {tripData.agent.last_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-slate-600 mb-4 line-clamp-2">
                                {tripData.trip.description}
                              </p>
                              
                              <div className="flex items-center gap-3">
                                <Badge className={getStatusColor(tripData.trip.status)}>
                                  {tripData.trip.status}
                                </Badge>
                                <Badge className={getTripTypeColor(tripData.trip.trip_type)}>
                                  {tripData.trip.trip_type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-4">
                            <Link to={`/trips/${tripData.trip.id}`}>
                              <Button size="sm" className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Visualizza
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Plane className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2">
                      Nessun viaggio ancora prenotato
                    </h3>
                    <p className="text-slate-600 mb-6">
                      Questo cliente non ha ancora prenotato viaggi con la tua agenzia
                    </p>
                    <Link to="/manage-trips">
                      <Button>
                        <Plane className="w-4 h-4 mr-2" />
                        Crea primo viaggio
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            {financialSummary ? (
              <div className="space-y-6">
                {/* Financial KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-blue-100">
                        Prenotazioni Totali
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {financialSummary.total_bookings}
                      </div>
                      <div className="text-blue-100 text-sm">
                        {financialSummary.confirmed_bookings} confermate
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-green-100">
                        Fatturato Confermato
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(financialSummary.confirmed_revenue)}
                      </div>
                      <div className="text-green-100 text-sm">
                        Su {formatCurrency(financialSummary.total_revenue)} totale
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-purple-100">
                        Commissioni Generate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(financialSummary.confirmed_agent_commission)}
                      </div>
                      <div className="text-purple-100 text-sm">
                        Margine agenzia
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-orange-100">
                        Sconti Applicati
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(financialSummary.confirmed_discounts)}
                      </div>
                      <div className="text-orange-100 text-sm">
                        Valore scontato
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Confirmed Bookings Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prenotazioni Confermate</CardTitle>
                    <CardDescription>
                      Dettaglio finanziario delle prenotazioni confermate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {financialSummary.confirmed_booking_details.length > 0 ? (
                      <div className="space-y-4">
                        {financialSummary.confirmed_booking_details.map((booking) => (
                          <div key={booking.trip_id} className="border border-slate-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {booking.trip_title}
                                </h4>
                                <p className="text-sm text-slate-600 mb-2">
                                  {booking.trip_destination} | Pratica: {booking.practice_number}
                                </p>
                                <div className="text-xs text-slate-500">
                                  Confermato: {booking.confirmation_date && new Date(booking.confirmation_date).toLocaleDateString('it-IT')} | 
                                  Partenza: {booking.departure_date && new Date(booking.departure_date).toLocaleDateString('it-IT')}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div className="text-right">
                                  <div className="font-semibold">{formatCurrency(booking.gross_amount)}</div>
                                  <div className="text-slate-500">Fatturato</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-red-600">
                                    -{formatCurrency(booking.discount)}
                                  </div>
                                  <div className="text-slate-500">Sconto</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-green-600">
                                    {formatCurrency(booking.agent_commission)}
                                  </div>
                                  <div className="text-slate-500">Commissione</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-slate-500">Nessuna prenotazione confermata</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <TrendingUp className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                  <h3 className="text-lg font-medium text-slate-800 mb-2">
                    Dati finanziari non disponibili
                  </h3>
                  <p className="text-slate-600">
                    Non ci sono ancora dati finanziari per questo cliente
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClientDetail;