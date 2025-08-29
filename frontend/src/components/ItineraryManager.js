import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { 
  ArrowLeft, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ItineraryManager = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [tripData, setTripData] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(null);

  const [newItinerary, setNewItinerary] = useState({
    day_number: '',
    date: '',
    title: '',
    description: '',
    itinerary_type: 'tour_day'
  });

  useEffect(() => {
    if (tripId) {
      fetchData();
    }
  }, [tripId]);

  const fetchData = async () => {
    try {
      const [tripRes, itinerariesRes] = await Promise.all([
        axios.get(`${API}/trips/${tripId}/full`),
        axios.get(`${API}/trips/${tripId}/itineraries`)
      ]);

      setTripData(tripRes.data);
      setItineraries(itinerariesRes.data.sort((a, b) => a.day_number - b.day_number));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItinerary = async () => {
    try {
      // Validate required fields
      if (!newItinerary.day_number || !newItinerary.date || !newItinerary.title) {
        toast.error('Compila tutti i campi obbligatori');
        return;
      }

      const itineraryData = {
        ...newItinerary,
        trip_id: tripId,
        day_number: parseInt(newItinerary.day_number),
        date: new Date(newItinerary.date).toISOString()
      };

      await axios.post(`${API}/itineraries`, itineraryData);
      toast.success('Giornata aggiunta con successo!');
      setShowCreateDialog(false);
      setNewItinerary({
        day_number: '',
        date: '',
        title: '',
        description: '',
        itinerary_type: 'tour_day'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating itinerary:', error);
      const errorMessage = error.response?.data?.detail || 'Errore nella creazione della giornata';
      toast.error(errorMessage);
    }
  };

  const handleUpdateItinerary = async () => {
    try {
      // Validate required fields
      if (!editingItinerary.day_number || !editingItinerary.date || !editingItinerary.title) {
        toast.error('Compila tutti i campi obbligatori');
        return;
      }

      const itineraryData = {
        ...editingItinerary,
        day_number: parseInt(editingItinerary.day_number),
        date: new Date(editingItinerary.date).toISOString(),
        trip_id: tripId
      };

      await axios.put(`${API}/itineraries/${editingItinerary.id}`, itineraryData);
      toast.success('Giornata aggiornata con successo!');
      setEditingItinerary(null);
      fetchData();
    } catch (error) {
      console.error('Error updating itinerary:', error);
      const errorMessage = error.response?.data?.detail || 'Errore nell\'aggiornamento della giornata';
      toast.error(errorMessage);
    }
  };

  const handleDeleteItinerary = async (itineraryId) => {
    if (window.confirm('Sei sicuro di voler eliminare questa giornata?')) {
      try {
        await axios.delete(`${API}/itineraries/${itineraryId}`);
        toast.success('Giornata eliminata con successo!');
        fetchData();
      } catch (error) {
        console.error('Error deleting itinerary:', error);
        toast.error('Errore nell\'eliminazione della giornata');
      }
    }
  };

  const getItineraryTypeColor = (type) => {
    switch (type) {
      case 'port_day': return 'bg-blue-100 text-blue-800';
      case 'sea_day': return 'bg-cyan-100 text-cyan-800';
      case 'resort_day': return 'bg-green-100 text-green-800';
      case 'tour_day': return 'bg-purple-100 text-purple-800';
      case 'free_day': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItineraryTypeLabel = (type) => {
    switch (type) {
      case 'port_day': return 'Giornata Porto';
      case 'sea_day': return 'Giornata Mare';
      case 'resort_day': return 'Giornata Resort';
      case 'tour_day': return 'Giornata Tour';
      case 'free_day': return 'Giornata Libera';
      default: return type;
    }
  };

  const generateNextDayNumber = () => {
    if (itineraries.length === 0) return 1;
    return Math.max(...itineraries.map(i => i.day_number)) + 1;
  };

  const calculateNextDate = () => {
    if (!tripData || itineraries.length === 0) {
      return tripData?.trip.start_date?.split('T')[0] || '';
    }
    
    const lastItinerary = itineraries[itineraries.length - 1];
    const lastDate = new Date(lastItinerary.date);
    lastDate.setDate(lastDate.getDate() + 1);
    return lastDate.toISOString().split('T')[0];
  };

  const openCreateDialog = () => {
    setNewItinerary({
      day_number: generateNextDayNumber(),
      date: calculateNextDate(),
      title: '',
      description: '',
      itinerary_type: 'tour_day'
    });
    setShowCreateDialog(true);
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
          <Link to="/manage-trips">
            <Button>Torna ai Viaggi</Button>
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
              <Link to={`/trips/${tripId}`}>
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Calendar className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Gestione Itinerario</h1>
                <p className="text-sm text-slate-600">{tripData.trip.title}</p>
              </div>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={openCreateDialog}>
                  <Plus className="w-4 h-4" />
                  Aggiungi Giornata
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Aggiungi Nuova Giornata</DialogTitle>
                  <DialogDescription>
                    Crea una nuova giornata nell'itinerario del viaggio
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="day_number">Giorno #</Label>
                    <Input
                      id="day_number"
                      type="number"
                      value={newItinerary.day_number || generateNextDayNumber()}
                      onChange={(e) => setNewItinerary({...newItinerary, day_number: e.target.value})}
                      placeholder="1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Data</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newItinerary.date || calculateNextDate()}
                      onChange={(e) => setNewItinerary({...newItinerary, date: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="title">Titolo Giornata</Label>
                    <Input
                      id="title"
                      value={newItinerary.title}
                      onChange={(e) => setNewItinerary({...newItinerary, title: e.target.value})}
                      placeholder="Es: Visita Roma - Colosseo e Fori Imperiali"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="itinerary_type">Tipo Giornata</Label>
                    <Select value={newItinerary.itinerary_type} onValueChange={(value) => setNewItinerary({...newItinerary, itinerary_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="port_day">Giornata Porto</SelectItem>
                        <SelectItem value="sea_day">Giornata Mare</SelectItem>
                        <SelectItem value="resort_day">Giornata Resort</SelectItem>
                        <SelectItem value="tour_day">Giornata Tour</SelectItem>
                        <SelectItem value="free_day">Giornata Libera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione Programma</Label>
                  <Textarea
                    id="description"
                    value={newItinerary.description}
                    onChange={(e) => setNewItinerary({...newItinerary, description: e.target.value})}
                    placeholder="Descrivi il programma della giornata..."
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleCreateItinerary}>
                    Aggiungi Giornata
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trip Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Informazioni Viaggio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium">Destinazione</p>
                  <p className="text-sm text-slate-600">{tripData.trip.destination}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm text-slate-600">
                    {new Date(tripData.trip.start_date).toLocaleDateString('it-IT')} - 
                    {new Date(tripData.trip.end_date).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-medium">Durata</p>
                  <p className="text-sm text-slate-600">
                    {Math.ceil((new Date(tripData.trip.end_date) - new Date(tripData.trip.start_date)) / (1000 * 60 * 60 * 24))} giorni
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itinerary Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Itinerario Dettagliato</span>
              <Badge variant="outline">
                {itineraries.length} giorni programmati
              </Badge>
            </CardTitle>
            <CardDescription>
              Programma giornaliero del viaggio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {itineraries.length > 0 ? (
              <div className="space-y-6">
                {itineraries.map((itinerary, index) => (
                  <div key={itinerary.id} className="relative">
                    {/* Timeline connector */}
                    {index < itineraries.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-16 bg-slate-200"></div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      {/* Day number circle */}
                      <div className="flex-shrink-0 w-12 h-12 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center font-bold text-lg">
                        {itinerary.day_number}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 border border-slate-200 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800">
                                {itinerary.title}
                              </h3>
                              <Badge className={getItineraryTypeColor(itinerary.itinerary_type)}>
                                {getItineraryTypeLabel(itinerary.itinerary_type)}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-3">
                              {new Date(itinerary.date).toLocaleDateString('it-IT', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            
                            <p className="text-slate-700">{itinerary.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setEditingItinerary(itinerary)}
                              className="flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Modifica
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteItinerary(itinerary.id)}
                              className="flex items-center gap-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                              Elimina
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Nessuna giornata programmata
                </h3>
                <p className="text-slate-600 mb-6">
                  Inizia creando il programma della prima giornata del viaggio
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crea prima giornata
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {editingItinerary && (
          <Dialog open={!!editingItinerary} onOpenChange={() => setEditingItinerary(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifica Giornata</DialogTitle>
                <DialogDescription>
                  Aggiorna i dettagli della giornata
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_day_number">Giorno #</Label>
                  <Input
                    id="edit_day_number"
                    type="number"
                    value={editingItinerary.day_number}
                    onChange={(e) => setEditingItinerary({...editingItinerary, day_number: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_date">Data</Label>
                  <Input
                    id="edit_date"
                    type="date"
                    value={editingItinerary.date?.split('T')[0] || ''}
                    onChange={(e) => setEditingItinerary({...editingItinerary, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit_title">Titolo Giornata</Label>
                  <Input
                    id="edit_title"
                    value={editingItinerary.title}
                    onChange={(e) => setEditingItinerary({...editingItinerary, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="edit_itinerary_type">Tipo Giornata</Label>
                  <Select value={editingItinerary.itinerary_type} onValueChange={(value) => setEditingItinerary({...editingItinerary, itinerary_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="port_day">Giornata Porto</SelectItem>
                      <SelectItem value="sea_day">Giornata Mare</SelectItem>
                      <SelectItem value="resort_day">Giornata Resort</SelectItem>
                      <SelectItem value="tour_day">Giornata Tour</SelectItem>
                      <SelectItem value="free_day">Giornata Libera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Descrizione Programma</Label>
                <Textarea
                  id="edit_description"
                  value={editingItinerary.description}
                  onChange={(e) => setEditingItinerary({...editingItinerary, description: e.target.value})}
                  rows={4}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingItinerary(null)}>
                  Annulla
                </Button>
                <Button onClick={handleUpdateItinerary}>
                  Salva Modifiche
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default ItineraryManager;