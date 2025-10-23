import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Support() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const userId = 'current-user-id';

  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    category: 'general',
    priority: 'normal',
    description: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/support/tickets?user_id=${userId}`);
      const result = await response.json();
      if (result.success) {
        setTickets(result.data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/support/tickets/${ticketId}`);
      const result = await response.json();
      if (result.success) {
        setSelectedTicket(result.data);
      }
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    }
  };

  const createTicket = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTicketForm, user_id: userId })
      });
      const result = await response.json();
      if (result.success) {
        setShowNewTicket(false);
        setNewTicketForm({ subject: '', category: 'general', priority: 'normal', description: '' });
        fetchTickets();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const response = await fetch(`http://localhost:5000/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, message: newMessage })
      });
      const result = await response.json();
      if (result.success) {
        setNewMessage('');
        fetchTicketDetails(selectedTicket.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <MessageSquare className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'closed':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <MessageSquare className="w-10 h-10 text-blue-400" />
              Support Center
            </h1>
            <p className="text-gray-300">Get help with your account and challenges</p>
          </div>

          <button
            onClick={() => setShowNewTicket(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Your Tickets</h2>

              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white/20 border-t-blue-500"></div>
                </div>
              ) : tickets.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No tickets yet</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => fetchTicketDetails(ticket.id)}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedTicket?.id === ticket.id
                          ? 'bg-blue-500/30 border-2 border-blue-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-white text-sm">{ticket.subject}</h3>
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded border ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                        <span className={`px-2 py-1 rounded border ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {showNewTicket ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Create New Ticket</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                    <input
                      type="text"
                      value={newTicketForm.subject}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, subject: e.target.value })}
                      className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                      <select
                        value={newTicketForm.category}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="general">General</option>
                        <option value="technical">Technical</option>
                        <option value="billing">Billing</option>
                        <option value="account">Account</option>
                        <option value="challenge">Challenge</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                      <select
                        value={newTicketForm.priority}
                        onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                        className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newTicketForm.description}
                      onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                      className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none h-32 resize-none"
                      placeholder="Please provide details about your issue..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={createTicket}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition"
                    >
                      Submit Ticket
                    </button>
                    <button
                      onClick={() => setShowNewTicket(false)}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedTicket ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
                <div className="mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded border text-sm ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                      <span className={`px-3 py-1 rounded border text-sm ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400">Category: {selectedTicket.category}</p>
                  <p className="text-gray-400 text-sm">
                    Created: {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <p className="text-gray-300">{selectedTicket.description}</p>
                </div>

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {selectedTicket.messages?.map((message: any) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.is_staff
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">
                          {message.is_staff ? 'Support Team' : 'You'}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300">{message.message}</p>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'closed' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                      placeholder="Type your message..."
                    />
                    <button
                      onClick={sendMessage}
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
