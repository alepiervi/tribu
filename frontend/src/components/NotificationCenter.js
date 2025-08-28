import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Bell, 
  ArrowLeft, 
  Clock, 
  DollarSign,
  AlertTriangle,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications/payment-deadlines`);
      setNotifications(response.data.notifications);
      setStats({
        total_count: response.data.total_count,
        high_priority_count: response.data.high_priority_count,
        medium_priority_count: response.data.medium_priority_count,
        low_priority_count: response.data.low_priority_count
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Errore nel caricamento delle notifiche');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'low': return <Bell className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Urgente';
      case 'medium': return 'Media';
      case 'low': return 'Bassa';
      default: return 'Normale';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'payment_deadline': return 'Scadenza Pagamento';
      case 'balance_due': return 'Saldo in Scadenza';
      default: return 'Notifica';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const groupedNotifications = {
    high: notifications.filter(n => n.priority === 'high'),
    medium: notifications.filter(n => n.priority === 'medium'),
    low: notifications.filter(n => n.priority === 'low')
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
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <Bell className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">Centro Notifiche</h1>
            </div>
            
            <Button 
              onClick={fetchNotifications}
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Aggiorna
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-slate-500 to-slate-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-100">
                Totale Notifiche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-slate-200 mr-3" />
                <div className="text-2xl font-bold">{stats.total_count || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-100">
                Priorità Alta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-200 mr-3" />
                <div className="text-2xl font-bold">{stats.high_priority_count || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">
                Priorità Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-200 mr-3" />
                <div className="text-2xl font-bold">{stats.medium_priority_count || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">
                Priorità Bassa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Bell className="h-8 w-8 text-blue-200 mr-3" />
                <div className="text-2xl font-bold">{stats.low_priority_count || 0}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications by Priority */}
        {Object.entries(groupedNotifications).map(([priority, priorityNotifications]) => (
          priorityNotifications.length > 0 && (
            <Card key={priority} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getPriorityIcon(priority)}
                  Notifiche - Priorità {getPriorityLabel(priority)}
                  <Badge className={getPriorityColor(priority)}>
                    {priorityNotifications.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {priority === 'high' && 'Richiede attenzione immediata'}
                  {priority === 'medium' && 'Da gestire nei prossimi giorni'}
                  {priority === 'low' && 'Monitora quando possibile'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priorityNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`border rounded-lg p-4 transition-colors hover:bg-slate-50 ${
                        priority === 'high' ? 'border-red-200' : 
                        priority === 'medium' ? 'border-yellow-200' : 'border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getPriorityIcon(priority)}
                            <h4 className="font-semibold text-slate-800">{notification.title}</h4>
                            <Badge className={getPriorityColor(priority)}>
                              {getPriorityLabel(priority)}
                            </Badge>
                          </div>
                          
                          <p className="text-slate-600 mb-3">{notification.message}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">
                                {formatAmount(notification.amount)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Scade in {notification.days_until_due} giorni
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 text-slate-600">
                              <User className="w-4 h-4" />
                              <span>{notification.client_name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline">
                              {getTypeLabel(notification.type)}
                            </Badge>
                            <Badge variant="outline">
                              {notification.payment_type}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Link to={`/trips/${notification.trip_id}`}>
                            <Button size="sm" variant="outline">
                              Visualizza Viaggio
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ))}

        {/* No Notifications */}
        {notifications.length === 0 && (
          <Card>
            <CardContent className="text-center py-16">
              <Bell className="mx-auto h-16 w-16 text-slate-400 mb-6" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Nessuna notifica
              </h3>
              <p className="text-slate-600 mb-6">
                Ottimo! Non ci sono scadenze urgenti al momento
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="font-medium text-green-800 mb-2">Tutto sotto controllo</h4>
                <p className="text-sm text-green-700">
                  Tutti i pagamenti sono in regola e non ci sono scadenze imminenti.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {notifications.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Azioni Rapide</CardTitle>
              <CardDescription>
                Strumenti per gestire le notifiche
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link to="/financial-reports">
                  <Button variant="outline" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Report Finanziari
                  </Button>
                </Link>
                
                <Link to="/manage-trips">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Gestisci Viaggi
                  </Button>
                </Link>
                
                <Link to="/clients">
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contatta Clienti
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default NotificationCenter;