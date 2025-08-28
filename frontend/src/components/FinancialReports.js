import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  ArrowLeft, 
  TrendingUp,
  DollarSign,
  Calendar,
  Download,
  BarChart3,
  PieChart,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialReports = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAgent, setSelectedAgent] = useState(user.role === 'agent' ? user.id : '');
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (user.role === 'admin') {
      fetchAgents();
    }
    fetchAnalytics();
    fetchYearlyData();
  }, [selectedYear, selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setAgents(response.data.filter(u => u.role === 'agent'));
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        year: selectedYear,
        ...(selectedAgent && { agent_id: selectedAgent })
      };
      
      const response = await axios.get(`${API}/analytics/agent-commissions`, { params });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Errore nel caricamento dei report');
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyData = async () => {
    try {
      const response = await axios.get(`${API}/analytics/yearly-summary/${selectedYear}`);
      setYearlyData(response.data);
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatPercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0%';
    return ((numerator / denominator) * 100).toFixed(1) + '%';
  };

  const getCurrentYearRange = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  const getMonthlyBreakdown = () => {
    if (!analytics?.trips) return [];
    
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      name: new Date(selectedYear, i).toLocaleDateString('it-IT', { month: 'long' }),
      revenue: 0,
      commission: 0,
      trips: 0
    }));

    analytics.trips.forEach(trip => {
      if (trip.practice_confirm_date) {
        const date = new Date(trip.practice_confirm_date);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          months[month].revenue += trip.gross_amount || 0;
          months[month].commission += trip.agent_commission || 0;
          months[month].trips += 1;
        }
      }
    });

    return months;
  };

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
              <BarChart3 className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">Report Finanziari</h1>
            </div>
            
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Esporta PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filtri Report</CardTitle>
            <CardDescription>
              Seleziona i parametri per generare il report personalizzato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Anno</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getCurrentYearRange().map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {user.role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="agent">Agente</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti gli agenti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutti gli agenti</SelectItem>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.first_name} {agent.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-end">
                <Button onClick={() => { fetchAnalytics(); fetchYearlyData(); }} disabled={loading}>
                  {loading ? 'Caricamento...' : 'Aggiorna Report'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {analytics && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-100">
                    Fatturato Totale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analytics.total_revenue)}
                      </div>
                      <div className="text-green-100 text-sm">
                        {analytics.year} - {analytics.total_confirmed_trips} viaggi
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">
                    Commissioni Agente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analytics.total_agent_commission)}
                      </div>
                      <div className="text-blue-100 text-sm">
                        {formatPercentage(analytics.total_agent_commission, analytics.total_revenue)} del fatturato
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100">
                    Commissioni Fornitore
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <PieChart className="h-8 w-8 text-purple-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analytics.total_supplier_commission)}
                      </div>
                      <div className="text-purple-100 text-sm">
                        {formatPercentage(analytics.total_supplier_commission, analytics.total_revenue)} del fatturato
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100">
                    Margine Lordo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-orange-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(analytics.total_gross_commission)}
                      </div>
                      <div className="text-orange-100 text-sm">
                        {formatPercentage(analytics.total_gross_commission, analytics.total_revenue)} del fatturato
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Andamento Mensile {selectedYear}
                </CardTitle>
                <CardDescription>
                  Fatturato e commissioni mese per mese
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getMonthlyBreakdown().map((monthData) => (
                    <div key={monthData.month} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-sm font-medium text-slate-600">
                          {monthData.name}
                        </div>
                        <Badge variant="outline">
                          {monthData.trips} viaggi
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-8 text-sm">
                        <div className="text-right">
                          <div className="font-semibold text-slate-800">
                            {formatCurrency(monthData.revenue)}
                          </div>
                          <div className="text-slate-500">Fatturato</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(monthData.commission)}
                          </div>
                          <div className="text-slate-500">Commissioni</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-blue-600">
                            {formatPercentage(monthData.commission, monthData.revenue)}
                          </div>
                          <div className="text-slate-500">Margine</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle>Dettaglio Viaggi Confermati</CardTitle>
                <CardDescription>
                  Lista completa dei viaggi inclusi nel report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.trips && analytics.trips.length > 0 ? analytics.trips.map((trip) => (
                    <div key={trip.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">
                            Pratica: {trip.practice_number}
                          </h4>
                          <p className="text-sm text-slate-600">
                            Prenotazione: {trip.booking_number}
                          </p>
                          <p className="text-xs text-slate-500">
                            Confermata: {new Date(trip.practice_confirm_date).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(trip.gross_amount)}</div>
                            <div className="text-slate-500">Lordo</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(trip.net_amount)}</div>
                            <div className="text-slate-500">Netto</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">{formatCurrency(trip.agent_commission)}</div>
                            <div className="text-slate-500">Agente</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-purple-600">{formatCurrency(trip.supplier_commission)}</div>
                            <div className="text-slate-500">Fornitore</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <BarChart3 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                      <p className="text-slate-500">Nessun viaggio confermato per i filtri selezionati</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!analytics && !loading && (
          <Card>
            <CardContent className="text-center py-16">
              <BarChart3 className="mx-auto h-16 w-16 text-slate-400 mb-6" />
              <h3 className="text-lg font-medium text-slate-800 mb-2">
                Nessun dato disponibile
              </h3>
              <p className="text-slate-600 mb-6">
                Seleziona i filtri e genera il tuo primo report finanziario
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default FinancialReports;