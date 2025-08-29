import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { 
  ArrowLeft, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuoteRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchQuoteRequests();
  }, []);

  const fetchQuoteRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/quote-requests`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching quote requests:', error);
      toast.error('Errore nel caricamento delle richieste preventivo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'responded': return <Mail className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const handleUpdateStatus = async (requestId, newStatus, responseText = '') => {
    try {
      await axios.put(`${API}/quote-requests/${requestId}`, {
        status: newStatus,
        response: responseText,
        responded_at: new Date().toISOString(),
        responded_by: user.id
      });

      toast.success(`Richiesta ${newStatus === 'responded' ? 'risposta inviata' : 'aggiornata'} con successo`);
      setShowResponseDialog(false);
      setSelectedRequest(null);
      setResponse('');
      fetchQuoteRequests();
    } catch (error) {
      console.error('Error updating quote request:', error);
      toast.error('Errore nell\'aggiornamento della richiesta');
    }
  };

  const openResponseDialog = (request) => {
    setSelectedRequest(request);
    setResponse('');
    setShowResponseDialog(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Non specificato';
    return amount;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento richieste preventivo...</p>
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
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <MessageSquare className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">Richieste Preventivo</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {requests.filter(r => r.status === 'pending').length} In attesa
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {requests.filter(r => r.status === 'responded').length} Risposte
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {requests.length > 0 ? (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-teal-600" />
                        {request.destination}
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">
                            {request.status === 'pending' && 'In attesa'}
                            {request.status === 'responded' && 'Risposto'}
                            {request.status === 'accepted' && 'Accettato'}
                            {request.status === 'rejected' && 'Rifiutato'}
                          </span>
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {request.travel_dates}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {request.number_of_travelers} viaggiatori
                        </span>
                        {request.budget_range && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Budget: {formatCurrency(request.budget_range)}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    
                    <div className="text-xs text-slate-500">
                      {formatDate(request.created_at)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cliente e Dettagli */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-slate-800 mb-2">Dettagli Cliente</h4>
                        <div className="space-y-2 text-sm">
                          {request.client_name && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-500" />
                              <span><strong>Nome:</strong> {request.client_name}</span>
                            </div>
                          )}
                          {request.client_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <span><strong>Email:</strong> {request.client_email}</span>
                            </div>
                          )}
                          {request.client_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-500" />
                              <span><strong>Cellulare:</strong> {request.client_phone}</span>
                            </div>
                          )}
                          <div>
                            <strong>Tipo viaggio:</strong> {request.trip_type}
                          </div>
                          <div>
                            <strong>Contatto preferito:</strong> {request.contact_preference}
                          </div>
                        </div>
                      </div>
                      
                      {request.special_requirements && (
                        <div>
                          <h4 className="font-medium text-slate-800 mb-2">Richieste Speciali</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                            {request.special_requirements}
                          </p>
                        </div>
                      )}

                      {request.notes && (
                        <div>
                          <h4 className="font-medium text-slate-800 mb-2">Note</h4>
                          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                            {request.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Azioni e Risposta */}
                    <div className="space-y-4">
                      {request.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-medium text-yellow-800 mb-3">Azioni Disponibili</h4>
                          <div className="flex gap-2 flex-wrap">
                            <Button 
                              size="sm" 
                              onClick={() => openResponseDialog(request)}
                              className="flex items-center gap-2"
                            >
                              <Mail className="w-4 h-4" />
                              Rispondi
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateStatus(request.id, 'accepted')}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Accetta
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateStatus(request.id, 'rejected')}
                              className="flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Rifiuta
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteRequest(request.id)}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Cancella
                            </Button>
                          </div>
                        </div>
                      )}

                      {request.response && (
                        <div>
                          <h4 className="font-medium text-slate-800 mb-2">Risposta Inviata</h4>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">{request.response}</p>
                            {request.responded_at && (
                              <p className="text-xs text-blue-600 mt-2">
                                Inviata il: {formatDate(request.responded_at)}
                              </p>
                            )}
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteRequest(request.id)}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Elimina Richiesta
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <MessageSquare className="mx-auto h-16 w-16 text-slate-400 mb-6" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Nessuna richiesta preventivo
              </h3>
              <p className="text-slate-600">
                Le richieste di preventivo dei clienti appariranno qui
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Rispondi alla Richiesta Preventivo</DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  Destinazione: <strong>{selectedRequest.destination}</strong><br />
                  Date: <strong>{selectedRequest.travel_dates}</strong><br />
                  Viaggiatori: <strong>{selectedRequest.number_of_travelers}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Messaggio di Risposta
              </label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Scrivi la tua risposta dettagliata per il cliente..."
                rows={6}
                className="w-full"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                💡 <strong>Suggerimento:</strong> Includi informazioni su prezzi, disponibilità, 
                opzioni di viaggio e prossimi passi per la prenotazione.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => handleUpdateStatus(selectedRequest?.id, 'responded', response)}
              disabled={!response.trim()}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Invia Risposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuoteRequests;