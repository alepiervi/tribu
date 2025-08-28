import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  ArrowLeft, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plane,
  MapPin,
  User,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CalendarView = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await axios.get(`${API}/trips/with-details`);
      setTrips(response.data);
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast.error('Errore nel caricamento dei viaggi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTripTypeColor = (type) => {
    switch (type) {
      case 'cruise': return 'bg-blue-50 border-blue-200';
      case 'resort': return 'bg-green-50 border-green-200';
      case 'tour': return 'bg-purple-50 border-purple-200';
      case 'custom': return 'bg-orange-50 border-orange-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Generate calendar grid for month view
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get trips for a specific date
  const getTripsForDate = (date) => {
    if (!date) return [];
    
    return trips.filter(tripData => {
      const startDate = new Date(tripData.trip.start_date);
      const endDate = new Date(tripData.trip.end_date);
      
      return date >= startDate.setHours(0, 0, 0, 0) && 
             date <= endDate.setHours(23, 59, 59, 999);
    });
  };

  // Navigation functions
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const navigate = (direction) => {
    switch (view) {
      case 'month': return navigateMonth(direction);
      case 'week': return navigateWeek(direction);
      case 'day': return navigateDay(direction);
      default: return navigateMonth(direction);
    }
  };

  const formatDateHeader = () => {
    switch (view) {
      case 'month':
        return currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('it-IT')} - ${weekEnd.toLocaleDateString('it-IT')}`;
      case 'day':
        return currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

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
              <Calendar className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">Calendario Viaggi</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={view === 'month' ? 'default' : 'ghost'}
                  onClick={() => setView('month')}
                  className="px-3 py-1 text-xs"
                >
                  Mese
                </Button>
                <Button
                  size="sm"
                  variant={view === 'week' ? 'default' : 'ghost'}
                  onClick={() => setView('week')}
                  className="px-3 py-1 text-xs"
                >
                  Settimana
                </Button>
                <Button
                  size="sm"
                  variant={view === 'day' ? 'default' : 'ghost'}
                  onClick={() => setView('day')}
                  className="px-3 py-1 text-xs"
                >
                  Giorno
                </Button>
              </div>
              
              {/* Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                  Oggi
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {formatDateHeader()}
          </h2>
          <p className="text-slate-600">
            {trips.length} viaggi totali - Visualizza i tuoi programmi
          </p>
        </div>

        {view === 'month' && (
          <Card>
            <CardContent className="p-6">
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                {/* Day headers */}
                {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day) => (
                  <div key={day} className="bg-slate-100 p-3 text-center text-sm font-medium text-slate-600">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  const dayTrips = day ? getTripsForDate(day) : [];
                  const isToday = day && day.toDateString() === new Date().toDateString();
                  
                  return (
                    <div 
                      key={index} 
                      className={`bg-white p-2 min-h-[120px] ${
                        !day ? 'bg-slate-50' : ''
                      } ${isToday ? 'ring-2 ring-teal-500' : ''}`}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-2 ${
                            isToday ? 'text-teal-600' : 'text-slate-800'
                          }`}>
                            {day.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {dayTrips.slice(0, 2).map((tripData) => (
                              <Link 
                                key={tripData.trip.id} 
                                to={`/trips/${tripData.trip.id}`}
                                className="block"
                              >
                                <div className={`p-1 rounded text-xs border ${getTripTypeColor(tripData.trip.trip_type)} hover:shadow-sm transition-shadow cursor-pointer`}>
                                  <div className="font-medium truncate">
                                    {tripData.trip.title}
                                  </div>
                                  <div className="text-slate-600 truncate">
                                    {tripData.client?.first_name} {tripData.client?.last_name}
                                  </div>
                                </div>
                              </Link>
                            ))}
                            
                            {dayTrips.length > 2 && (
                              <div className="text-xs text-slate-500 px-1">
                                +{dayTrips.length - 2} altri
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {view === 'day' && (
          <div className="space-y-6">
            {/* Day view - show all trips for the selected day */}
            <Card>
              <CardHeader>
                <CardTitle>Viaggi del Giorno</CardTitle>
                <CardDescription>
                  Tutti i viaggi programmati per {currentDate.toLocaleDateString('it-IT')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dayTrips = getTripsForDate(currentDate);
                  return dayTrips.length > 0 ? (
                    <div className="space-y-4">
                      {dayTrips.map((tripData) => (
                        <Link 
                          key={tripData.trip.id} 
                          to={`/trips/${tripData.trip.id}`}
                          className="block"
                        >
                          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                                      <User className="w-4 h-4" />
                                      <span>
                                        {tripData.client?.first_name} {tripData.client?.last_name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {new Date(tripData.trip.start_date).toLocaleDateString('it-IT')} - 
                                        {new Date(tripData.trip.end_date).toLocaleDateString('it-IT')}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <Badge className={getStatusColor(tripData.trip.status)}>
                                      {tripData.trip.status}
                                    </Badge>
                                    <Badge variant="outline">
                                      {tripData.trip.trip_type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-500">Nessun viaggio programmato per oggi</p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Viaggi Attivi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {trips.filter(t => t.trip.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Viaggi in Bozza
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {trips.filter(t => t.trip.status === 'draft').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Viaggi Completati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {trips.filter(t => t.trip.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CalendarView;