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
  User,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinancialReports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState(user.role === 'agent' ? user.id : 'all');
  const [agents, setAgents] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState('');
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [exportMonth, setExportMonth] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAgents();
    }
    // Always fetch financial reports on mount
    fetchFinancialReports();
  }, []); // Empty dependency array for mount-only effect

  useEffect(() => {
    // Fetch when filters change (excluding initial mount)
    fetchFinancialReports();
  }, [selectedYear, selectedMonth, selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setAgents(response.data.filter(u => u.role === 'agent'));
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchFinancialReports = async () => {
    setLoading(true);
    try {
      const params = {
        year: selectedYear,
        ...(selectedMonth && selectedMonth !== "all" && { month: selectedMonth }),
        ...(selectedAgent && selectedAgent !== "all" && { agent_id: selectedAgent })
      };
      
      const response = await axios.get(`${API}/reports/financial`, { params });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      toast.error('Errore nel caricamento dei report finanziari');
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

  const formatPercentage = (numerator, denominator) => {
    if (!denominator || denominator === 0) return '0%';
    return ((numerator / denominator) * 100).toFixed(1) + '%';
  };

  const getCurrentYearRange = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  const getMonths = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(2000, i).toLocaleDateString('it-IT', { month: 'long' })
    }));
  };

  const canExportExcel = () => {
    return reportData?.can_export_excel || false;
  };

  const handleExportExcel = async () => {
    try {
      let exportParams = {};
      
      // Build export parameters based on type
      if (exportType === 'year') {
        exportParams = { year: exportYear };
      } else if (exportType === 'month') {
        exportParams = { year: exportYear, month: exportMonth };
      } else if (exportType === 'all') {
        exportParams = {}; // No filters for all years
      }

      // Add agent filter if selected
      if (selectedAgent && selectedAgent !== 'all') {
        exportParams.agent_id = selectedAgent;
      }

      // Call backend export endpoint
      const response = await axios.get(`${API}/reports/financial/export`, { 
        params: exportParams,
        responseType: 'blob' // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on export type
      let filename = 'report_finanziario';
      if (exportType === 'year') {
        filename += `_${exportYear}`;
      } else if (exportType === 'month') {
        filename += `_${exportYear}_${exportMonth}`;
      } else if (exportType === 'all') {
        filename += '_tutti_anni';
      }
      filename += '.xlsx';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Report Excel scaricato con successo!');
      setShowExportDialog(false);
      
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Errore nell\'esportazione del report Excel');
    }
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
            
            <div className="flex gap-2">
              {canExportExcel() && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="w-4 h-4" />
                  Esporta Excel
                </Button>
              )}
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Anno</Label>
                <Select value={selectedYear ? selectedYear.toString() : ""} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona anno" />
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

              <div className="space-y-2">
                <Label htmlFor="month">Mese (opzionale)</Label>
                <Select value={selectedMonth ? selectedMonth.toString() : ""} onValueChange={(value) => setSelectedMonth(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutto l'anno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutto l'anno</SelectItem>
                    {getMonths().map(month => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {user.role === 'admin' && (
                <div className="space-y-2">
                  <Label htmlFor="agent">Agente</Label>
                  <Select value={selectedAgent || ""} onValueChange={(value) => setSelectedAgent(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tutti gli agenti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli agenti</SelectItem>
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
                <Button onClick={fetchFinancialReports} disabled={loading}>
                  {loading ? 'Caricamento...' : 'Aggiorna Report'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {reportData && reportData.totals && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-100">
                    Fatturato Lordo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(reportData.totals.gross_revenue)}
                      </div>
                      <div className="text-green-100 text-sm">
                        {reportData.totals.total_trips} viaggi
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-100">
                    Commissioni Agenti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-blue-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(reportData.totals.agent_commissions)}
                      </div>
                      <div className="text-blue-100 text-sm">
                        {formatPercentage(reportData.totals.agent_commissions, reportData.totals.gross_revenue)} del fatturato
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-100">
                    Commissioni Fornitori
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <PieChart className="h-8 w-8 text-purple-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(reportData.totals.supplier_commissions)}
                      </div>
                      <div className="text-purple-100 text-sm">
                        {formatPercentage(reportData.totals.supplier_commissions, reportData.totals.gross_revenue)} del fatturato
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-orange-100">
                    Sconti Totali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-orange-200 mr-3" />
                    <div>
                      <div className="text-2xl font-bold">
                        {formatCurrency(reportData.totals.total_discounts)}
                      </div>
                      <div className="text-orange-100 text-sm">
                        {reportData.totals.client_departures} partenze
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Breakdown - only show if yearly data requested */}
            {reportData.monthly_breakdown && reportData.monthly_breakdown.length > 0 && (
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
                    {reportData.monthly_breakdown.map((monthData) => (
                      <div key={monthData.month} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-20 text-sm font-medium text-slate-600">
                            {monthData.month_name}
                          </div>
                          <Badge variant="outline">
                            {monthData.total_trips} viaggi
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-8 text-sm">
                          <div className="text-right">
                            <div className="font-semibold text-slate-800">
                              {formatCurrency(monthData.gross_revenue)}
                            </div>
                            <div className="text-slate-500">Fatturato</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(monthData.agent_commissions)}
                            </div>
                            <div className="text-slate-500">Comm. Agenti</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-semibold text-purple-600">
                              {formatCurrency(monthData.supplier_commissions)}
                            </div>
                            <div className="text-slate-500">Comm. Fornitori</div>
                          </div>

                          <div className="text-right">
                            <div className="font-semibold text-orange-600">
                              {formatCurrency(monthData.total_discounts)}
                            </div>
                            <div className="text-slate-500">Sconti</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  {reportData.detailed_trips && reportData.detailed_trips.length > 0 ? reportData.detailed_trips.map((trip) => (
                    <div key={trip.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="font-semibold text-slate-800">
                              {trip.trip_title || 'Titolo non disponibile'}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              Pratica: {trip.practice_number}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <User className="w-4 h-4" />
                              <span>
                                <strong>Cliente:</strong> {trip.client_name || 'Non disponibile'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Users className="w-4 h-4" />
                              <span>
                                <strong>Agente:</strong> {trip.agent_name || 'Non disponibile'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Prenotazione: {trip.booking_number}</span>
                            <span>Confermata: {new Date(trip.practice_confirm_date).toLocaleDateString('it-IT')}</span>
                            {trip.trip_destination && <span>Dest.: {trip.trip_destination}</span>}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm ml-4">
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
                          <div className="text-right">
                            <div className="font-semibold text-orange-600">{formatCurrency(trip.discount)}</div>
                            <div className="text-slate-500">Sconto</div>
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

        {!reportData && !loading && (
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