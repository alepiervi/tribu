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
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  UserPlus,
  ArrowLeft,
  Shield,
  ShieldOff,
  Mail,
  User,
  Eye,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'client'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const endpoint = user.role === 'admin' ? '/users' : '/clients';
      const response = await axios.get(`${API}${endpoint}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await axios.post(`${API}/auth/register`, newUser);
      toast.success('Utente creato con successo!');
      setShowCreateDialog(false);
      setNewUser({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'client'
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Errore nella creazione dell\'utente');
    }
  };

  const handleUpdateUser = async () => {
    try {
      await axios.put(`${API}/users/${editingUser.id}`, {
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        email: editingUser.email
      });
      toast.success('Utente aggiornato con successo!');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Errore nell\'aggiornamento dell\'utente');
    }
  };

  const handleBlockUser = async (userId, blocked) => {
    try {
      const endpoint = blocked ? 'block' : 'unblock';
      await axios.post(`${API}/users/${userId}/${endpoint}`);
      toast.success(`Utente ${blocked ? 'bloccato' : 'sbloccato'} con successo!`);
      fetchUsers();
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      toast.error('Errore nell\'operazione');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo utente?')) {
      try {
        await axios.delete(`${API}/users/${userId}`);
        toast.success('Utente eliminato con successo!');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Errore nell\'eliminazione dell\'utente');
      }
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Amministratore';
      case 'agent': return 'Agente';
      case 'client': return 'Cliente';
      default: return role;
    }
  };

  const filteredUsers = users.filter(u => 
    u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
              <Users className="h-8 w-8 text-teal-600 mr-3" />
              <h1 className="text-xl font-bold text-slate-800">
                {user.role === 'admin' ? 'Gestione Utenti' : 'Gestione Clienti'}
              </h1>
            </div>
            
            {user.role === 'admin' && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Nuovo Utente
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Crea Nuovo Utente</DialogTitle>
                    <DialogDescription>
                      Inserisci i dettagli del nuovo utente
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Nome</Label>
                        <Input
                          id="first_name"
                          value={newUser.first_name}
                          onChange={(e) => setNewUser({...newUser, first_name: e.target.value})}
                          placeholder="Mario"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Cognome</Label>
                        <Input
                          id="last_name"
                          value={newUser.last_name}
                          onChange={(e) => setNewUser({...newUser, last_name: e.target.value})}
                          placeholder="Rossi"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="mario@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Cellulare</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                        placeholder="+39 123 456 7890"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Ruolo</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="agent">Agente</SelectItem>
                          <SelectItem value="admin">Amministratore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Annulla
                    </Button>
                    <Button onClick={handleCreateUser}>
                      Crea Utente
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
        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cerca Utenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cerca per nome, cognome o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length > 0 ? filteredUsers.map((u) => (
            <Card key={u.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {u.first_name} {u.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span>{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Badge className={getRoleColor(u.role)}>
                          {getRoleLabel(u.role)}
                        </Badge>
                        {u.blocked && (
                          <Badge variant="destructive">Bloccato</Badge>
                        )}
                        <span className="text-xs text-slate-500">
                          Registrato: {new Date(u.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' && u.role === 'client' && (
                      <Link to={`/clients/${u.id}`}>
                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Dettagli
                        </Button>
                      </Link>
                    )}
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingUser(u)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifica
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleBlockUser(u.id, !u.blocked)}
                      className={`flex items-center gap-2 ${u.blocked ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}`}
                    >
                      {u.blocked ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                      {u.blocked ? 'Sblocca' : 'Blocca'}
                    </Button>
                    
                    {user.role === 'admin' && u.id !== user.id && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteUser(u.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Elimina
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <Card>
              <CardContent className="text-center py-16">
                <Users className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                <h3 className="text-lg font-medium text-slate-800 mb-2">
                  Nessun utente trovato
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm ? 'Nessun risultato per la ricerca' : 'Non ci sono utenti registrati'}
                </p>
                {!searchTerm && user.role === 'admin' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crea il primo utente
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Modifica Utente</DialogTitle>
                <DialogDescription>
                  Aggiorna le informazioni dell'utente
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit_first_name">Nome</Label>
                    <Input
                      id="edit_first_name"
                      value={editingUser.first_name}
                      onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_last_name">Cognome</Label>
                    <Input
                      id="edit_last_name"
                      value={editingUser.last_name}
                      onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Cellulare</Label>
                  <Input
                    id="edit_phone"
                    type="tel"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    placeholder="+39 123 456 7890"
                  />
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <strong>Ruolo:</strong> {getRoleLabel(editingUser.role)}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Status:</strong> {editingUser.blocked ? 'Bloccato' : 'Attivo'}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Annulla
                </Button>
                <Button onClick={handleUpdateUser}>
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

export default UserManagement;