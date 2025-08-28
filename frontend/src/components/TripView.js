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
  Calendar, 
  MapPin, 
  User, 
  Plane,
  Camera,
  FileText,
  Settings,
  Ship,
  Clock,
  Info,
  Upload
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
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  const fetchTripData = async () => {
    try {
      const [tripRes, itinerariesRes, cruiseRes, photosRes, notesRes] = await Promise.all([
        axios.get(`${API}/trips/${tripId}/full`),
        axios.get(`${API}/trips/${tripId}/itineraries`),
        axios.get(`${API}/trips/${tripId}/cruise-info`),
        axios.get(`${API}/trips/${tripId}/photos`),
        user.role === 'client' ? axios.get(`${API}/trips/${tripId}/notes`) : Promise.resolve({ data: [] })
      ]);

      setTripData(tripRes.data);
      setItineraries(itinerariesRes.data);
      setCruiseInfo(cruiseRes.data);
      setPhotos(photosRes.data);
      setNotes(notesRes.data);
    } catch (error) {
      console.error('Error fetching trip data:', error);
      toast.error('Errore nel caricamento del viaggio');
    } finally {
      setLoading(false);
    }
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

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', `Foto caricata il ${new Date().toLocaleDateString('it-IT')}`);
    formData.append('photo_category', 'destination');

    try {
      await axios.post(`${API}/trips/${tripId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Foto caricata con successo!');
      fetchTripData(); // Refresh data
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Errore nel caricamento della foto');
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
              <Badge className={getStatusColor(trip.status)}>
                {trip.status}
              </Badge>
              <Badge className={getTripTypeColor(trip.trip_type)}>
                {trip.trip_type}
              </Badge>
              {user.role !== 'client' && (
                <Link to={`/trip-admin/${tripId}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Amministrazione
                  </Button>
                </Link>
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

              {agent && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <User className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Agente</p>
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
        <Tabs defaultValue="itinerary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="itinerary" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Itinerario
            </TabsTrigger>
            {trip.trip_type === 'cruise' && (
              <TabsTrigger value="cruise" className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                Crociera
              </TabsTrigger>
            )}
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Foto ({photos.length})
            </TabsTrigger>
            {user.role === 'client' && (
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Le Mie Note
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

          {trip.trip_type === 'cruise' && cruiseInfo && (
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

          <TabsContent value="photos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Foto del Viaggio
                  </span>
                  {user.role === 'client' && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload">
                        <Button size="sm" className="flex items-center gap-2 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          Carica Foto
                        </Button>
                      </label>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <img 
                          src={`${BACKEND_URL}${photo.url}`} 
                          alt={photo.caption}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-sm text-slate-600">{photo.caption}</p>
                          <Badge variant="outline" className="mt-2">
                            {photo.photo_category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <p className="text-slate-500">Nessuna foto ancora caricata</p>
                    {user.role === 'client' && (
                      <p className="text-xs text-slate-400 mt-2">
                        Carica le tue foto per condividere i ricordi del viaggio
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {user.role === 'client' && (
            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Le Mie Note Personali
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
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Giorno {note.day_number}</Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(note.created_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                          <p className="text-slate-600">{note.note_text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-500">Nessuna nota ancora scritta</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default TripView;