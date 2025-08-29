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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  ArrowLeft, 
  DollarSign, 
  Calculator,
  Plus,
  Trash2,
  FileText,
  Calendar,
  CreditCard,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TripAdmin = () => {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [tripData, setTripData] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAdminDialog, setShowCreateAdminDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const [newAdminData, setNewAdminData] = useState({
    practice_number: '',
    booking_number: '',
    gross_amount: '',
    net_amount: '',
    discount: '0',
    practice_confirm_date: '',
    client_departure_date: '',
    confirmation_deposit: '0'
  });

  const [newPayment, setNewPayment] = useState({
    amount: '',
    payment_date: '',
    payment_type: 'installment',
    notes: ''
  });

  useEffect(() => {
    if (tripId) {
      fetchTripAdminData();
    }
  }, [tripId]);

  const fetchTripAdminData = async () => {
    try {
      const [tripRes, adminRes] = await Promise.all([
        axios.get(`${API}/trips/${tripId}/full`),
        axios.get(`${API}/trips/${tripId}/admin`)
      ]);

      setTripData(tripRes.data);
      setAdminData(adminRes.data);

      if (adminRes.data) {
        const paymentsRes = await axios.get(`${API}/trip-admin/${adminRes.data.id}/payments`);
        setPayments(paymentsRes.data);
      }
    } catch (error) {
      console.error('Error fetching trip admin data:', error);
      toast.error('Errore nel caricamento dei dati amministrativi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      // Validate required fields
      if (!newAdminData.practice_number || !newAdminData.booking_number || 
          !newAdminData.gross_amount || !newAdminData.net_amount ||
          !newAdminData.practice_confirm_date || !newAdminData.client_departure_date) {
        toast.error('Compila tutti i campi obbligatori');
        return;
      }

      const adminData = {
        ...newAdminData,
        trip_id: tripId,
        gross_amount: parseFloat(newAdminData.gross_amount),
        net_amount: parseFloat(newAdminData.net_amount),
        discount: parseFloat(newAdminData.discount || 0),
        confirmation_deposit: parseFloat(newAdminData.confirmation_deposit || 0),
        practice_confirm_date: new Date(newAdminData.practice_confirm_date).toISOString(),
        client_departure_date: new Date(newAdminData.client_departure_date).toISOString()
      };

      await axios.post(`${API}/trips/${tripId}/admin`, adminData);
      toast.success('Dati amministrativi creati con successo!');
      setShowCreateAdminDialog(false);
      setNewAdminData({
        practice_number: '',
        booking_number: '',
        gross_amount: '',
        net_amount: '',
        discount: '0',
        practice_confirm_date: '',
        client_departure_date: '',
        confirmation_deposit: '0'
      });
      fetchTripAdminData();
    } catch (error) {
      console.error('Error creating admin data:', error);
      const errorMessage = error.response?.data?.detail || 'Errore nella creazione dei dati amministrativi';
      toast.error(errorMessage);
    }
  };

  const handleCreatePayment = async () => {
    try {
      // Validate required fields
      if (!newPayment.amount || !newPayment.payment_date) {
        toast.error('Compila tutti i campi obbligatori');
        return;
      }

      // Prepare payment data with correct types
      const paymentData = {
        trip_admin_id: adminData.id,
        amount: parseFloat(newPayment.amount),
        payment_date: new Date(newPayment.payment_date).toISOString(),
        payment_type: newPayment.payment_type || 'installment',
        notes: newPayment.notes || ''
      };

      await axios.post(`${API}/trip-admin/${adminData.id}/payments`, paymentData);
      toast.success('Pagamento registrato con successo!');
      setShowPaymentDialog(false);
      setNewPayment({
        amount: '',
        payment_date: '',
        payment_type: 'installment',
        notes: ''
      });
      fetchTripAdminData();
    } catch (error) {
      console.error('Error creating payment:', error);
      const errorMessage = error.response?.data?.detail || 'Errore nella registrazione del pagamento';
      toast.error(errorMessage);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo pagamento?')) {
      try {
        await axios.delete(`${API}/payments/${paymentId}`);
        toast.success('Pagamento eliminato con successo!');
        fetchTripAdminData();
      } catch (error) {
        console.error('Error deleting payment:', error);
        toast.error('Errore nell\'eliminazione del pagamento');
      }
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
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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
              <DollarSign className="h-8 w-8 text-teal-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Amministrazione Finanziaria</h1>
                <p className="text-sm text-slate-600">{tripData.trip.title}</p>
              </div>
            </div>
            
            {!adminData && (
              <Dialog open={showCreateAdminDialog} onOpenChange={setShowCreateAdminDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Crea Scheda Finanziaria
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crea Scheda Finanziaria</DialogTitle>
                    <DialogDescription>
                      Inserisci i dati amministrativi e finanziari del viaggio
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="practice_number">Numero Pratica</Label>
                      <Input
                        id="practice_number"
                        value={newAdminData.practice_number}
                        onChange={(e) => setNewAdminData({...newAdminData, practice_number: e.target.value})}
                        placeholder="PR001"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="booking_number">Numero Prenotazione</Label>
                      <Input
                        id="booking_number"
                        value={newAdminData.booking_number}
                        onChange={(e) => setNewAdminData({...newAdminData, booking_number: e.target.value})}
                        placeholder="BK001"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gross_amount">Importo Lordo (€)</Label>
                      <Input
                        id="gross_amount"
                        type="number"
                        step="0.01"
                        value={newAdminData.gross_amount}
                        onChange={(e) => setNewAdminData({...newAdminData, gross_amount: e.target.value})}
                        placeholder="1500.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="net_amount">Importo Netto (€)</Label>
                      <Input
                        id="net_amount"
                        type="number"
                        step="0.01"
                        value={newAdminData.net_amount}
                        onChange={(e) => setNewAdminData({...newAdminData, net_amount: e.target.value})}
                        placeholder="1200.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Sconto (€)</Label>
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        value={newAdminData.discount}
                        onChange={(e) => setNewAdminData({...newAdminData, discount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmation_deposit">Acconto Conferma (€)</Label>
                      <Input
                        id="confirmation_deposit"
                        type="number"
                        step="0.01"
                        value={newAdminData.confirmation_deposit}
                        onChange={(e) => setNewAdminData({...newAdminData, confirmation_deposit: e.target.value})}
                        placeholder="300.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="practice_confirm_date">Data Conferma Pratica</Label>
                      <Input
                        id="practice_confirm_date"
                        type="datetime-local"
                        value={newAdminData.practice_confirm_date}
                        onChange={(e) => setNewAdminData({...newAdminData, practice_confirm_date: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client_departure_date">Data Partenza Cliente</Label>
                      <Input
                        id="client_departure_date"
                        type="datetime-local"
                        value={newAdminData.client_departure_date}
                        onChange={(e) => setNewAdminData({...newAdminData, client_departure_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateAdminDialog(false)}>
                      Annulla
                    </Button>
                    <Button onClick={handleCreateAdmin}>
                      Crea Scheda
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {adminData ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Panoramica
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pagamenti ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-100">
                      Importo Lordo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(adminData.gross_amount)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-100">
                      Commissione Agente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(adminData.agent_commission)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-purple-100">
                      Saldo Dovuto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(adminData.balance_due)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-100">
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">
                      {adminData.status.toUpperCase()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Informazioni Pratica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Numero Pratica</Label>
                        <p className="font-semibold">{adminData.practice_number}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Numero Prenotazione</Label>
                        <p className="font-semibold">{adminData.booking_number}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Data Conferma</Label>
                        <p>{new Date(adminData.practice_confirm_date).toLocaleDateString('it-IT')}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Data Partenza</Label>
                        <p>{new Date(adminData.client_departure_date).toLocaleDateString('it-IT')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Riepilogo Finanziario</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Importo Lordo:</span>
                        <span className="font-semibold">{formatCurrency(adminData.gross_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Sconto:</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(adminData.discount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Importo Netto:</span>
                        <span className="font-semibold">{formatCurrency(adminData.net_amount)}</span>
                      </div>
                      <hr className="border-slate-200" />
                      <div className="flex justify-between">
                        <span className="text-slate-600">Commissione Lorda:</span>
                        <span className="font-semibold">{formatCurrency(adminData.gross_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Commissione Fornitore (4%):</span>
                        <span className="font-semibold">{formatCurrency(adminData.supplier_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Commissione Agente:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(adminData.agent_commission)}</span>
                      </div>
                      <hr className="border-slate-200" />
                      <div className="flex justify-between">
                        <span className="text-slate-600">Acconto Versato:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(adminData.confirmation_deposit)}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Saldo Dovuto:</span>
                        <span className="font-bold text-orange-600">{formatCurrency(adminData.balance_due)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Gestione Pagamenti</h2>
                
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Registra Pagamento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Registra Nuovo Pagamento</DialogTitle>
                      <DialogDescription>
                        Inserisci i dettagli del pagamento ricevuto
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Importo (€)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                          placeholder="500.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment_date">Data Pagamento</Label>
                        <Input
                          id="payment_date"
                          type="datetime-local"
                          value={newPayment.payment_date}
                          onChange={(e) => setNewPayment({...newPayment, payment_date: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="payment_type">Tipo Pagamento</Label>
                        <Select value={newPayment.payment_type} onValueChange={(value) => setNewPayment({...newPayment, payment_type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="deposit">Acconto</SelectItem>
                            <SelectItem value="installment">Rata</SelectItem>
                            <SelectItem value="balance">Saldo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Note (opzionale)</Label>
                        <Input
                          id="notes"
                          value={newPayment.notes}
                          onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                          placeholder="Bonifico bancario..."
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                        Annulla
                      </Button>
                      <Button onClick={handleCreatePayment}>
                        Registra Pagamento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {payments.length > 0 ? payments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-100 rounded-full">
                            <CreditCard className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              Pagamento {payment.payment_type}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {new Date(payment.payment_date).toLocaleDateString('it-IT')}
                            </p>
                            {payment.notes && (
                              <p className="text-sm text-slate-500">{payment.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(payment.amount)}
                            </div>
                            <Badge variant="outline">
                              {payment.payment_type}
                            </Badge>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeletePayment(payment.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <Card>
                    <CardContent className="text-center py-16">
                      <CreditCard className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                      <h3 className="text-lg font-medium text-slate-800 mb-2">
                        Nessun pagamento registrato
                      </h3>
                      <p className="text-slate-600 mb-6">
                        Inizia registrando il primo pagamento ricevuto dal cliente
                      </p>
                      <Button onClick={() => setShowPaymentDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Registra primo pagamento
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Analisi Finanziaria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-4">Stato Pagamenti</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="text-green-800">Pagato</span>
                          <span className="font-semibold text-green-800">
                            {formatCurrency(adminData.gross_amount - adminData.balance_due)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span className="text-orange-800">Da pagare</span>
                          <span className="font-semibold text-orange-800">
                            {formatCurrency(adminData.balance_due)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-800 mb-4">Commissioni</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="text-blue-800">Commissione Agente</span>
                          <span className="font-semibold text-blue-800">
                            {formatCurrency(adminData.agent_commission)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <span className="text-purple-800">Commissione Fornitore</span>
                          <span className="font-semibold text-purple-800">
                            {formatCurrency(adminData.supplier_commission)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {adminData.balance_due > 0 && (
                    <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Attenzione</h4>
                          <p className="text-sm text-yellow-700">
                            È presente un saldo dovuto di {formatCurrency(adminData.balance_due)}. 
                            Assicurati che il cliente effettui il pagamento prima della partenza.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <DollarSign className="mx-auto h-16 w-16 text-slate-400 mb-6" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Nessuna scheda finanziaria
              </h3>
              <p className="text-slate-600 mb-6">
                Crea una scheda finanziaria per gestire i dati amministrativi di questo viaggio
              </p>
              <Button onClick={() => setShowCreateAdminDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crea scheda finanziaria
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default TripAdmin;