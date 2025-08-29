import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  User, 
  Plane,
  FileText,
  Settings,
  Ship,
  Clock,
  Info,
  Plus,
  Edit,
  Save,
  X,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TripView = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [tripData, setTripData] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [cruiseInfo, setCruiseInfo] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(null);
  const [newNote, setNewNote] = useState({ day_number: 1, note_text: '' });
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [showQuoteRequest, setShowQuoteRequest] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // State for trip details form data
  const [cruiseDetailsForm, setCruiseDetailsForm] = useState({
    ship_name: '',
    boarding_port: '',
    cabin_number: '',
    package_type: '',
    insurance_type: '',
    restaurant: '',
    dinner_time: ''
  });

  const [resortDetailsForm, setResortDetailsForm] = useState({
    resort_name: '',
    room_type: '',
    meal_plan: '',
    package_formula: '',
    insurance_type: ''
  });

  const [tourDetailsForm, setTourDetailsForm] = useState({
    general_info: ''
  });

  const [customDetailsForm, setCustomDetailsForm] = useState({
    custom_details: ''
  });

  const [quoteRequest, setQuoteRequest] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    travelers: 2,
    budget: '',
    preferences: ''
  });

  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      const requests = [
        axios.get(`${API}/trips/${tripId}/full`),
        axios.get(`${API}/trips/${tripId}/itineraries`),
      ];

      // Cruise info per admin/agent
      if (user.role !== 'client') {
        requests.push(axios.get(`${API}/trips/${tripId}/cruise-info`));
      }

      // Note per tutti i ruoli (clienti vedono le proprie, admin/agent tutte)
      requests.push(axios.get(`${API}/trips/${tripId}/notes`));

      const responses = await Promise.all(requests);
      
      setTripData(responses[0].data);
      setItineraries(responses[1].data);
      
      let responseIndex = 2;
      if (user.role !== 'client') {
        setCruiseInfo(responses[responseIndex].data);
        responseIndex++;
      }
      
      // Note sono sempre l'ultimo elemento
      setNotes(responses[responseIndex].data || []);
      
    } catch (error) {
      console.error('Error fetching trip data:', error);
      toast.error('Errore nel caricamento del viaggio');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (noteData) => {
    try {
      if (editingNote) {
        // Update existing note
        await axios.put(`${API}/notes/${editingNote.id}`, { 
          note_text: noteData.note_text 
        });
        toast.success('Nota aggiornata con successo!');
      } else {
        // Create new note
        await axios.post(`${API}/trips/${tripId}/notes`, {
          day_number: noteData.day_number,
          note_text: noteData.note_text,
          trip_id: tripId
        });
        toast.success('Nota creata con successo!');
      }
      
      setEditingNote(null);
      setNewNote({ day_number: 1, note_text: '' });
      setShowNewNoteDialog(false);
      fetchTripData();
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Errore nel salvataggio della nota');
    }
  };

  const handleQuoteRequest = async () => {
    try {
      const quoteData = {
        destination: quoteRequest.destination,
        travel_dates: `${quoteRequest.start_date} - ${quoteRequest.end_date}`,
        number_of_travelers: parseInt(quoteRequest.travelers),
        trip_type: 'custom',
        budget_range: quoteRequest.budget,
        special_requirements: quoteRequest.preferences,
        contact_preference: 'email'
      };

      await axios.post(`${API}/quote-requests`, quoteData);
      toast.success('Richiesta preventivo inviata! Ti contatteremo presto.');
      
      setShowQuoteRequest(false);
      setQuoteRequest({
        destination: '',
        start_date: '',
        end_date: '',
        travelers: 2,
        budget: '',
        preferences: ''
      });
    } catch (error) {
      console.error('Error sending quote request:', error);
      toast.error('Errore nell\'invio della richiesta');
    }
  };

  const handleStatusChange = async () => {
    try {
      await axios.put(`${API}/trips/${tripId}/status`, { status: newStatus });
      toast.success(`Stato viaggio aggiornato a: ${newStatus}`);
      
      setShowStatusDialog(false);
      setNewStatus('');
      fetchTripData(); // Reload trip data to show new status
    } catch (error) {
      console.error('Error updating trip status:', error);
      const errorMessage = error.response?.data?.detail || 'Errore nell\'aggiornamento dello stato';
      toast.error(errorMessage);
    }
  };

  const openStatusDialog = () => {
    setNewStatus(tripData.trip.status);
    setShowStatusDialog(true);
  };

  const getGridColsClass = () => {
    const totalTabs = tabsToShow.length + (user.role !== 'client' ? 2 : 0); // +2 for client-notes and trip-details
    if (totalTabs <= 2) return 'grid-cols-2';
    if (totalTabs <= 3) return 'grid-cols-3';
    if (totalTabs <= 4) return 'grid-cols-4';
    if (totalTabs <= 5) return 'grid-cols-5';
    return 'grid-cols-6';
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

  if (!tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Viaggio non trovato</h2>
          <Link to="/dashboard">
            <Button>Torna alla Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { trip, agent, client } = tripData;

  // Determina quanti tab mostrare
  const tabsToShow = [];
  
  tabsToShow.push('itinerary');
  
  if (trip.trip_type === 'cruise' && cruiseInfo) {
    tabsToShow.push('cruise');
  }
  
  if (user.role === 'client') {
    tabsToShow.push('notes');
    tabsToShow.push('quote');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to={user.role === 'client' ? '/dashboard' : '/manage-trips'}>
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Plane className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">{trip.title}</h1>
                <p className="text-sm text-slate-600">{trip.destination}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(trip.status)}>
                  {trip.status}
                </Badge>
                {user.role !== 'client' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={openStatusDialog}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Cambia Stato
                  </Button>
                )}
              </div>
              <Badge className={getTripTypeColor(trip.trip_type)}>
                {trip.trip_type}
              </Badge>
              {user.role !== 'client' && (
                <>
                  <Link to={`/trip-admin/${tripId}`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Amministrazione
                    </Button>
                  </Link>
                  <Link to={`/trips/${tripId}/itinerary`}>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Modifica Itinerario
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Plane className="w-6 h-6 text-teal-600" />
              Dettagli Viaggio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Destinazione</p>
                    <p className="text-sm">{trip.destination}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm">
                      {new Date(trip.start_date).toLocaleDateString('it-IT')} - 
                      {new Date(trip.end_date).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              </div>

              {client && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <User className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Cliente</p>
                      <p className="text-sm">{client.first_name} {client.last_name}</p>
                      <p className="text-xs text-slate-500">{client.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {agent && user.role === 'client' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <User className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Il tuo Agente</p>
                      <p className="text-sm">{agent.first_name} {agent.last_name}</p>
                      <p className="text-xs text-slate-500">{agent.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-medium text-slate-800 mb-2">Descrizione</h4>
              <p className="text-slate-600">{trip.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue={tabsToShow[0]} className="space-y-6">
          <TabsList className={`grid w-full ${getGridColsClass()}`}>
            {tabsToShow.includes('itinerary') && (
              <TabsTrigger value="itinerary" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Itinerario
              </TabsTrigger>
            )}
            {tabsToShow.includes('cruise') && (
              <TabsTrigger value="cruise" className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Crociera
              </TabsTrigger>
            )}
            {user.role !== 'client' && (
              <TabsTrigger value="client-notes" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Note Clienti
              </TabsTrigger>
            )}
            {user.role !== 'client' && (
              <TabsTrigger value="trip-details" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Dettagli Viaggio
              </TabsTrigger>
            )}
            {tabsToShow.includes('notes') && (
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Le Mie Note
              </TabsTrigger>
            )}
            {tabsToShow.includes('quote') && (
              <TabsTrigger value="quote" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Richiedi Preventivo
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="itinerary">
            <Card>
              <CardHeader>
                <CardTitle>Itinerario Giornaliero</CardTitle>
                <CardDescription>
                  Programma dettagliato del tuo viaggio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {itineraries.length > 0 ? (
                  <div className="space-y-4">
                    {itineraries.map((itinerary) => (
                      <div key={itinerary.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-teal-100 text-teal-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                            {itinerary.day_number}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-800">{itinerary.title}</h4>
                            <p className="text-sm text-slate-600 mb-2">
                              {new Date(itinerary.date).toLocaleDateString('it-IT')}
                            </p>
                            <p className="text-slate-600">{itinerary.description}</p>
                            <Badge variant="outline" className="mt-2">
                              {itinerary.itinerary_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-500">Itinerario non ancora disponibile</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {tabsToShow.includes('cruise') && cruiseInfo && (
            <TabsContent value="cruise">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="w-5 h-5" />
                    Informazioni Crociera
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-slate-800">Nome Nave</h4>
                        <p className="text-slate-600">{cruiseInfo.ship_name}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">Numero Cabina</h4>
                        <p className="text-slate-600">{cruiseInfo.cabin_number}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-slate-800">Orario Partenza</h4>
                        <p className="text-slate-600">
                          {new Date(cruiseInfo.departure_time).toLocaleString('it-IT')}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">Orario Rientro</h4>
                        <p className="text-slate-600">
                          {new Date(cruiseInfo.return_time).toLocaleString('it-IT')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {cruiseInfo.ship_facilities.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      <h4 className="font-medium text-slate-800 mb-3">Servizi a Bordo</h4>
                      <div className="flex flex-wrap gap-2">
                        {cruiseInfo.ship_facilities.map((facility, index) => (
                          <Badge key={index} variant="outline">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {tabsToShow.includes('notes') && (
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Le Mie Note Personali
                    </span>
                    <Button 
                      onClick={() => setShowNewNoteDialog(true)}
                      size="sm" 
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Aggiungi Nota
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Scrivi qui i tuoi pensieri e ricordi del viaggio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Giorno {note.day_number}</Badge>
                                <span className="text-xs text-slate-500">
                                  {new Date(note.created_at).toLocaleDateString('it-IT')}
                                </span>
                              </div>
                              <p className="text-slate-600">{note.note_text}</p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingNote(note)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Modifica
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-500 mb-4">Nessuna nota ancora scritta</p>
                      <Button onClick={() => setShowNewNoteDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Scrivi la tua prima nota
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Client Notes Tab - For Admin/Agent to see client notes */}
          {user.role !== 'client' && (
            <TabsContent value="client-notes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Note del Cliente
                  </CardTitle>
                  <CardDescription>
                    Note e commenti inviati dal cliente per questo viaggio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {notes && notes.length > 0 ? (
                    <div className="space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Giorno {note.day_number}</Badge>
                              <span className="text-sm text-slate-500">
                                {new Date(note.created_at).toLocaleDateString('it-IT')}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                            {note.note_text}
                          </p>
                          {note.updated_at && note.updated_at !== note.created_at && (
                            <p className="text-xs text-slate-500 mt-2">
                              Modificato il: {new Date(note.updated_at).toLocaleDateString('it-IT')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <h4 className="text-lg font-medium text-slate-800 mb-2">Nessuna nota dal cliente</h4>
                      <p className="text-slate-500">
                        Il cliente non ha ancora lasciato note per questo viaggio
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Trip Details Tab - For Admin/Agent with specific travel info */}
          {user.role !== 'client' && (
            <TabsContent value="trip-details">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Informazioni Dettagliate
                  </CardTitle>
                  <CardDescription>
                    Dettagli specifici da fornire al cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Cruise Information */}
                    {trip.trip_type === 'cruise' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                          <Ship className="w-5 h-5" />
                          Informazioni Crociera
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Nome Nave</label>
                            <Input placeholder="Es: MSC Seaside" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Porto di Imbarco</label>
                            <Input placeholder="Es: Civitavecchia" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Numero Cabina</label>
                            <Input placeholder="Es: 7145" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Tipo Pacchetto</label>
                            <Input placeholder="Es: Balcone Premium" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Tipo Assicurazione</label>
                            <Input placeholder="Es: Annullamento + Medica" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Ristorante</label>
                            <Input placeholder="Es: Ristorante Principale" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Turno Cena</label>
                            <Input placeholder="Es: Secondo turno - 21:00" />
                          </div>
                        </div>
                        <Button className="mt-4">Salva Informazioni Crociera</Button>
                      </div>
                    )}

                    {/* Resort Information */}
                    {trip.trip_type === 'resort' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Informazioni Resort
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Nome Resort</label>
                            <Input placeholder="Es: Sandals Royal Caribbean" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Tipologia Camera</label>
                            <Input placeholder="Es: Junior Suite Vista Mare" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Pasto Entrata</label>
                            <Input placeholder="Es: All Inclusive" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Formula</label>
                            <Input placeholder="Es: All Inclusive Premium" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-1">Assicurazione</label>
                            <Input placeholder="Es: Annullamento + Medica + Bagaglio" />
                          </div>
                        </div>
                        <Button className="mt-4">Salva Informazioni Resort</Button>
                      </div>
                    )}

                    {/* Tour Information */}
                    {trip.trip_type === 'tour' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Informazioni Tour
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-purple-700 mb-1">Informazioni Generali</label>
                            <Textarea 
                              placeholder="Inserisci tutte le informazioni generali del tour: guida, trasporti, hotel, pasti inclusi, punti di interesse, documenti necessari, etc."
                              rows={6}
                            />
                          </div>
                        </div>
                        <Button className="mt-4">Salva Informazioni Tour</Button>
                      </div>
                    )}

                    {/* Custom trip or other types */}
                    {(!trip.trip_type || trip.trip_type === 'custom') && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          Informazioni Personalizzate
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dettagli del Viaggio</label>
                            <Textarea 
                              placeholder="Inserisci tutti i dettagli specifici per questo viaggio personalizzato..."
                              rows={4}
                            />
                          </div>
                        </div>
                        <Button className="mt-4">Salva Informazioni</Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {tabsToShow.includes('quote') && (
            <TabsContent value="quote">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Richiedi Nuovo Preventivo
                  </CardTitle>
                  <CardDescription>
                    Interessato a un altro viaggio? Richiedi un preventivo personalizzato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="destination">Destinazione desiderata</Label>
                        <Input
                          id="destination"
                          value={quoteRequest.destination}
                          onChange={(e) => setQuoteRequest({...quoteRequest, destination: e.target.value})}
                          placeholder="Es: Giappone, Maldive, New York..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="start_date">Data partenza</Label>
                          <Input
                            id="start_date"
                            type="date"
                            value={quoteRequest.start_date}
                            onChange={(e) => setQuoteRequest({...quoteRequest, start_date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_date">Data ritorno</Label>
                          <Input
                            id="end_date"
                            type="date"
                            value={quoteRequest.end_date}
                            onChange={(e) => setQuoteRequest({...quoteRequest, end_date: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="travelers">Numero viaggiatori</Label>
                        <Input
                          id="travelers"
                          type="number"
                          min="1"
                          value={quoteRequest.travelers}
                          onChange={(e) => setQuoteRequest({...quoteRequest, travelers: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="budget">Budget approssimativo (€)</Label>
                        <Input
                          id="budget"
                          value={quoteRequest.budget}
                          onChange={(e) => setQuoteRequest({...quoteRequest, budget: e.target.value})}
                          placeholder="Es: 2000-3000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="preferences">Preferenze e richieste speciali</Label>
                        <Textarea
                          id="preferences"
                          value={quoteRequest.preferences}
                          onChange={(e) => setQuoteRequest({...quoteRequest, preferences: e.target.value})}
                          placeholder="Descrivi le tue preferenze: tipo di viaggio, hotel, attività..."
                          rows={4}
                        />
                      </div>

                      <Button 
                        onClick={handleQuoteRequest}
                        className="w-full"
                        disabled={!quoteRequest.destination}
                      >
                        Invia Richiesta Preventivo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Note Dialog */}
        <Dialog open={showNewNoteDialog || !!editingNote} onOpenChange={() => {
          setShowNewNoteDialog(false);
          setEditingNote(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingNote ? 'Modifica Nota' : 'Nuova Nota'}
              </DialogTitle>
              <DialogDescription>
                Scrivi i tuoi pensieri e ricordi del viaggio
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="day_number">Giorno del viaggio</Label>
                <Input
                  id="day_number"
                  type="number"
                  min="1"
                  value={editingNote ? editingNote.day_number : newNote.day_number}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (editingNote) {
                      setEditingNote({...editingNote, day_number: value});
                    } else {
                      setNewNote({...newNote, day_number: value});
                    }
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="note_text">Il tuo ricordo</Label>
                <Textarea
                  id="note_text"
                  value={editingNote ? editingNote.note_text : newNote.note_text}
                  onChange={(e) => {
                    if (editingNote) {
                      setEditingNote({...editingNote, note_text: e.target.value});
                    } else {
                      setNewNote({...newNote, note_text: e.target.value});
                    }
                  }}
                  placeholder="Racconta la tua esperienza di oggi..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowNewNoteDialog(false);
                setEditingNote(null);
              }}>
                Annulla
              </Button>
              <Button onClick={() => handleSaveNote(editingNote || newNote)}>
                <Save className="w-4 h-4 mr-2" />
                Salva Nota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambia Stato Viaggio</DialogTitle>
              <DialogDescription>
                Seleziona il nuovo stato per questo viaggio. 
                {trip.status === 'draft' && ' Puoi confermare il viaggio per renderlo ufficiale.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Nuovo Stato</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Bozza)</SelectItem>
                    <SelectItem value="active">Active (Attivo)</SelectItem>
                    <SelectItem value="confirmed">Confirmed (Confermato)</SelectItem>
                    <SelectItem value="completed">Completed (Completato)</SelectItem>
                    <SelectItem value="cancelled">Cancelled (Annullato)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus === 'confirmed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✅ Confermando il viaggio, questo diventerà ufficiale e apparirà nei report finanziari.
                  </p>
                </div>
              )}

              {newStatus === 'cancelled' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">
                    ⚠️ Annullando il viaggio, questo non sarà più disponibile per i clienti.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Annulla
              </Button>
              <Button onClick={handleStatusChange} disabled={!newStatus || newStatus === trip.status}>
                <Settings className="w-4 h-4 mr-2" />
                Aggiorna Stato
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default TripView;