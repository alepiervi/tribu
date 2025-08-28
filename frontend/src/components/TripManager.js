import React, { useState, useEffect } from 'react';
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
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  MapPin,
  User,
  Plane,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TripManager = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  const [newTrip, setNewTrip] = useState({
    title: '',
    destination: '',
    description: '',
    start_date: '',
    end_date: '',
    client_id: '',
    trip_type: 'tour'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tripsRes, clientsRes] = await Promise.all([
        axios.get(`${API}/trips/with-details`),
        axios.get(`${API}/clients`)
      ]);
      
      setTrips(tripsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async () => {
    try {
      await axios.post(`${API}/trips`, newTrip);
      toast.success('Viaggio creato con successo!');
      setShowCreateDialog(false);
      setNewTrip({
        title: '',
        destination: '',
        description: '',
        start_date: '',
        end_date: '',
        client_id: '',
        trip_type: 'tour'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error('Errore nella creazione del viaggio');
    }
  };

  const handleUpdateTrip = async () => {
    try {
      await axios.put(`${API}/trips/${editingTrip.id}`, editingTrip);
      toast.success('Viaggio aggiornato con successo!');
      setEditingTrip(null);
      fetchData();
    } catch (error) {
      console.error('Error updating trip:', error);
      toast.error('Errore nell\'aggiornamento del viaggio');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo viaggio?')) {
      try {
        await axios.delete(`${API}/trips/${tripId}`);
        toast.success('Viaggio eliminato con successo!');
        fetchData();
      } catch (error) {
        console.error('Error deleting trip:', error);
        toast.error('Errore nell\'eliminazione del viaggio');
      }
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

  const filteredTrips = trips.filter(tripData => 
    tripData.trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tripData.trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tripData.client?.first_name + ' ' + tripData.client?.last_name).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Plane className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">Gestione Viaggi</h1>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nuovo Viaggio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Viaggio</DialogTitle>
                  <DialogDescription>
                    Inserisci i dettagli del nuovo viaggio per il cliente
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titolo Viaggio</Label>
                    <Input
                      id="title"
                      value={newTrip.title}
                      onChange={(e) => setNewTrip({...newTrip, title: e.target.value})}
                      placeholder="Es: Vacanza in Grecia"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destinazione</Label>
                    <Input
                      id="destination"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                      placeholder="Es: Santorini, Grecia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data Inizio</Label>
                    <Input
                      id="start_date"
                      type="datetime-local"
                      value={newTrip.start_date}
                      onChange={(e) => setNewTrip({...newTrip, start_date: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data Fine</Label>
                    <Input
                      id="end_date"
                      type="datetime-local"
                      value={newTrip.end_date}
                      onChange={(e) => setNewTrip({...newTrip, end_date: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client_id">Cliente</Label>
                    <Select value={newTrip.client_id} onValueChange={(value) => setNewTrip({...newTrip, client_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name} - {client.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trip_type">Tipo Viaggio</Label>
                    <Select value={newTrip.trip_type} onValueChange={(value) => setNewTrip({...newTrip, trip_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cruise">Crociera</SelectItem>
                        <SelectItem value="resort">Resort</SelectItem>
                        <SelectItem value="tour">Tour</SelectItem>
                        <SelectItem value="custom">Personalizzato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrizione</Label>
                  <Textarea
                    id="description"
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({...newTrip, description: e.target.value})}
                    placeholder="Descrivi i dettagli del viaggio..."
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Annulla
                  </Button>
                  <Button onClick={handleCreateTrip}>
                    Crea Viaggio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cerca Viaggi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cerca per titolo, destinazione o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips List */}
        <div className="space-y-4">
          {filteredTrips.length > 0 ? filteredTrips.map((tripData) => (
            <Card key={tripData.trip.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
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
                        
                        <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
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
                              {tripData.client?.first_name} {tripData.client?.last_name}
                            </span>
                          </div>
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
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Link to={`/trips/${tripData.trip.id}`}>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Visualizza
                      </Button>
                    </Link>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingTrip(tripData.trip)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifica
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteTrip(tripData.trip.id)}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Elimina
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="text-center py-16">
                <Plane className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Nessun viaggio trovato
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm ? 'Nessun risultato per la ricerca' : 'Non ci sono viaggi ancora creati'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crea il primo viaggio
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        {editingTrip && (
          <Dialog open={!!editingTrip} onOpenChange={() => setEditingTrip(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifica Viaggio</DialogTitle>
                <DialogDescription>
                  Aggiorna i dettagli del viaggio
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_title">Titolo Viaggio</Label>
                  <Input
                    id="edit_title"
                    value={editingTrip.title}
                    onChange={(e) => setEditingTrip({...editingTrip, title: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_destination">Destinazione</Label>
                  <Input
                    id="edit_destination"
                    value={editingTrip.destination}
                    onChange={(e) => setEditingTrip({...editingTrip, destination: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Select value={editingTrip.status} onValueChange={(value) => setEditingTrip({...editingTrip, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Bozza</SelectItem>
                      <SelectItem value="active">Attivo</SelectItem>
                      <SelectItem value="completed">Completato</SelectItem>
                      <SelectItem value="cancelled">Annullato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_trip_type">Tipo Viaggio</Label>
                  <Select value={editingTrip.trip_type} onValueChange={(value) => setEditingTrip({...editingTrip, trip_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cruise">Crociera</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="tour">Tour</SelectItem>
                      <SelectItem value="custom">Personalizzato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Descrizione</Label>
                <Textarea
                  id="edit_description"
                  value={editingTrip.description}
                  onChange={(e) => setEditingTrip({...editingTrip, description: e.target.value})}
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingTrip(null)}>
                  Annulla
                </Button>
                <Button onClick={handleUpdateTrip}>
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

export default TripManager;