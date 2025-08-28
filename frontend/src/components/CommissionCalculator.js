import React, { useState } from 'react';
import { useAuth } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  ArrowLeft, 
  Calculator,
  DollarSign,
  TrendingUp,
  Percent,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CommissionCalculator = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState({
    grossAmount: '',
    netAmount: '',
    discount: '0',
    supplierCommissionRate: '4' // Default 4%
  });

  const [results, setResults] = useState(null);

  const handleCalculate = () => {
    const gross = parseFloat(calculations.grossAmount) || 0;
    const net = parseFloat(calculations.netAmount) || 0;
    const discount = parseFloat(calculations.discount) || 0;
    const supplierRate = parseFloat(calculations.supplierCommissionRate) || 4;

    const grossCommission = gross - discount - net;
    const supplierCommission = gross * (supplierRate / 100);
    const agentCommission = grossCommission - supplierCommission;
    
    // Calculate percentages
    const grossCommissionPercentage = gross > 0 ? ((grossCommission / gross) * 100) : 0;
    const agentCommissionPercentage = gross > 0 ? ((agentCommission / gross) * 100) : 0;
    const supplierCommissionPercentage = supplierRate;

    setResults({
      grossAmount: gross,
      netAmount: net,
      discount: discount,
      grossCommission,
      supplierCommission,
      agentCommission,
      grossCommissionPercentage,
      agentCommissionPercentage,
      supplierCommissionPercentage,
      finalPrice: gross - discount
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  const formatPercentage = (percentage) => {
    return `${percentage.toFixed(2)}%`;
  };

  const handleReset = () => {
    setCalculations({
      grossAmount: '',
      netAmount: '',
      discount: '0',
      supplierCommissionRate: '4'
    });
    setResults(null);
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
              <Calculator className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">Calcolatore Commissioni</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Calcolo Commissioni Agenzia
          </h2>
          <p className="text-slate-600">
            Strumento per calcolare rapidamente commissioni e margini sui viaggi
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Dati Finanziari
              </CardTitle>
              <CardDescription>
                Inserisci gli importi per calcolare le commissioni
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="grossAmount">Importo Lordo (€)</Label>
                <Input
                  id="grossAmount"
                  type="number"
                  step="0.01"
                  placeholder="1500.00"
                  value={calculations.grossAmount}
                  onChange={(e) => setCalculations({...calculations, grossAmount: e.target.value})}
                />
                <p className="text-xs text-slate-500">
                  Prezzo totale del viaggio venduto al cliente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="netAmount">Importo Netto (€)</Label>
                <Input
                  id="netAmount"
                  type="number"
                  step="0.01"
                  placeholder="1200.00"
                  value={calculations.netAmount}
                  onChange={(e) => setCalculations({...calculations, netAmount: e.target.value})}
                />
                <p className="text-xs text-slate-500">
                  Costo del viaggio pagato al fornitore
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Sconto Applicato (€)</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={calculations.discount}
                  onChange={(e) => setCalculations({...calculations, discount: e.target.value})}
                />
                <p className="text-xs text-slate-500">
                  Eventuale sconto concesso al cliente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplierRate">Commissione Fornitore (%)</Label>
                <Input
                  id="supplierRate"
                  type="number"
                  step="0.1"
                  placeholder="4.0"
                  value={calculations.supplierCommissionRate}
                  onChange={(e) => setCalculations({...calculations, supplierCommissionRate: e.target.value})}
                />
                <p className="text-xs text-slate-500">
                  Percentuale di commissione riconosciuta dal fornitore (default 4%)
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCalculate} className="flex-1">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcola
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Risultati Calcolo
              </CardTitle>
              <CardDescription>
                Breakdown dettagliato delle commissioni
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-green-800 mb-1">
                        Commissione Agente
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(results.agentCommission)}
                      </div>
                      <div className="text-xs text-green-600">
                        {formatPercentage(results.agentCommissionPercentage)} del lordo
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-blue-800 mb-1">
                        Commissione Fornitore
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(results.supplierCommission)}
                      </div>
                      <div className="text-xs text-blue-600">
                        {formatPercentage(results.supplierCommissionPercentage)} del lordo
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-2">
                      Breakdown Dettagliato
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Importo Lordo:</span>
                        <span className="font-semibold">{formatCurrency(results.grossAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Sconto Applicato:</span>
                        <span className="font-semibold text-red-600">
                          -{formatCurrency(results.discount)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                        <span className="text-slate-600">Prezzo Finale Cliente:</span>
                        <span className="font-semibold text-lg">
                          {formatCurrency(results.finalPrice)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Costo Netto Fornitore:</span>
                        <span className="font-semibold">{formatCurrency(results.netAmount)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                        <span className="text-slate-600">Commissione Lorda Totale:</span>
                        <span className="font-semibold text-purple-600">
                          {formatCurrency(results.grossCommission)}
                        </span>
                      </div>
                      
                      <div className="pl-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">- Commissione Fornitore ({formatPercentage(results.supplierCommissionPercentage)}):</span>
                          <span className="font-medium text-blue-600">
                            {formatCurrency(results.supplierCommission)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">- Commissione Agente:</span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(results.agentCommission)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profitability Analysis */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-6">
                      <h5 className="font-medium text-slate-800 mb-3">Analisi Profittabilità</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Margine Lordo:</span>
                          <div className="font-semibold">
                            {formatPercentage(results.grossCommissionPercentage)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Margine Agente:</span>
                          <div className="font-semibold text-green-600">
                            {formatPercentage(results.agentCommissionPercentage)}
                          </div>
                        </div>
                      </div>
                      
                      {results.agentCommissionPercentage < 5 && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <Info className="w-4 h-4" />
                            <span className="text-sm font-medium">Margine Basso</span>
                          </div>
                          <p className="text-xs text-yellow-700 mt-1">
                            La commissione agente è inferiore al 5%. Considera di rivedere i prezzi.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calculator className="mx-auto h-16 w-16 text-slate-400 mb-4" />
                  <p className="text-slate-500 mb-2">Nessun calcolo ancora effettuato</p>
                  <p className="text-sm text-slate-400">
                    Inserisci gli importi e clicca su "Calcola" per vedere i risultati
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Examples */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Esempi di Calcolo Rapido</CardTitle>
            <CardDescription>
              Clicca per caricare esempi pre-configurati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="p-4 h-auto text-left"
                onClick={() => {
                  setCalculations({
                    grossAmount: '1500',
                    netAmount: '1200',
                    discount: '0',
                    supplierCommissionRate: '4'
                  });
                }}
              >
                <div>
                  <div className="font-semibold">Viaggio Standard</div>
                  <div className="text-sm text-slate-600">€1500 lordo, €1200 netto</div>
                  <div className="text-xs text-slate-500 mt-1">Margine: 20%</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto text-left"
                onClick={() => {
                  setCalculations({
                    grossAmount: '3000',
                    netAmount: '2400',
                    discount: '150',
                    supplierCommissionRate: '4'
                  });
                }}
              >
                <div>
                  <div className="font-semibold">Viaggio Premium</div>
                  <div className="text-sm text-slate-600">€3000 lordo, sconto €150</div>
                  <div className="text-xs text-slate-500 mt-1">Con sconto cliente</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="p-4 h-auto text-left"
                onClick={() => {
                  setCalculations({
                    grossAmount: '800',
                    netAmount: '720',
                    discount: '0',
                    supplierCommissionRate: '6'
                  });
                }}
              >
                <div>
                  <div className="font-semibold">Weekend Break</div>
                  <div className="text-sm text-slate-600">€800 lordo, 6% fornitore</div>
                  <div className="text-xs text-slate-500 mt-1">Margine ridotto</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CommissionCalculator;