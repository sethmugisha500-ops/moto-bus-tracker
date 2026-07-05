'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, RefreshCw, Send, CheckCircle, AlertCircle, Clock, User, Phone, Mail, MessageSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';

// Use globalThis to safely access process.env in environments where "process" may not be declared
const API_URL = (typeof window !== 'undefined' ? (globalThis as any).process?.env?.NEXT_PUBLIC_API_URL : '') || 'https://moto-bus-backend.onrender.com/api';

const supportAPI = {
  get: async (path: string, options?: { params?: Record<string, any> }) => {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const res = await fetch(`${API_URL}${path}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch support data');
    return res.json();
  },
  post: async (path: string, body?: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to send support request');
    return res.json();
  },
  patch: async (path: string, body?: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update support data');
    return res.json();
  },
};

const priorityColors = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-yellow-500/20 text-yellow-500',
  low: 'bg-green-500/20 text-green-500',
};

const statusColors = {
  open: 'bg-yellow-500/20 text-yellow-500',
  in_progress: 'bg-blue-500/20 text-blue-500',
  resolved: 'bg-green-500/20 text-green-500',
  closed: 'bg-gray-500/20 text-gray-400',
};

const statusIcons = {
  open: <AlertCircle size={12} className="text-yellow-500" />,
  in_progress: <Clock size={12} className="text-blue-500" />,
  resolved: <CheckCircle size={12} className="text-green-500" />,
  closed: <X size={12} className="text-gray-500" />,
};

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch tickets
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['support-tickets', search, statusFilter, priorityFilter],
    queryFn: () => supportAPI.get('/tickets', { params: { search, status: statusFilter, priority: priorityFilter } }).then((res: { data: any; }) => res.data),
    refetchInterval: 30000,
  });

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      supportAPI.post(`/tickets/${id}/reply`, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setReplyMessage('');
      toast.success('Reply sent successfully');
    },
    onError: () => {
      toast.error('Failed to send reply');
    },
  });

  // Close ticket mutation
  const closeTicketMutation = useMutation({
    mutationFn: (id: string) => supportAPI.patch(`/tickets/${id}`, { status: 'closed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('Ticket closed');
      setSelectedTicket(null);
    },
    onError: () => {
      toast.error('Failed to close ticket');
    },
  });

  const tickets = data?.tickets || [];
  const stats = data?.stats || {
    open: 0,
    inProgress: 0,
    resolved: 0,
    total: 0,
  };

  const handleSendReply = () => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    sendReplyMutation.mutate({ id: selectedTicket.id, message: replyMessage });
  };

  const handleCloseTicket = () => {
    if (confirm('Are you sure you want to close this ticket?')) {
      closeTicketMutation.mutate(selectedTicket.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="p-4 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold">Support Center</h1>
            <p className="text-muted text-xs">Manage customer support tickets and disputes</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-darkInput hover:bg-darkInput/80 transition-all"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.open}</p>
            <p className="text-xs text-muted">Open Tickets</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
            <p className="text-xs text-muted">In Progress</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
            <p className="text-xs text-muted">Resolved</p>
          </div>
          <div className="bg-darkCard border border-border rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Tickets</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by user, subject, or ticket ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-darkInput border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-darkInput border border-border rounded-lg text-sm"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Tickets Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="bg-darkCard border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border bg-darkInput">
              <h3 className="font-semibold">Recent Tickets</h3>
              <p className="text-xs text-muted mt-1">{tickets.length} tickets found</p>
            </div>
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 hover:bg-darkInput/50 cursor-pointer transition-all ${
                    selectedTicket?.id === ticket.id ? 'bg-darkInput/30' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{ticket.subject}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">#{ticket.id?.slice(-8)} • {ticket.user?.name || ticket.user}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1">
                      {statusIcons[ticket.status as keyof typeof statusIcons]}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={10} /> {ticket.messageCount || ticket.messages}
                      </span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {tickets.length === 0 && (
                <div className="p-8 text-center text-muted">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No tickets found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Details */}
          <div className="bg-darkCard border border-border rounded-xl">
            {selectedTicket ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border bg-darkInput">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Ticket Details</h3>
                      <p className="text-xs text-muted">#{selectedTicket.id?.slice(-8)} • {selectedTicket.user?.name || selectedTicket.user}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="p-1 hover:bg-darkInput rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto max-h-[500px]">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-darkInput rounded-lg p-3">
                      <p className="text-muted text-xs mb-1">Type</p>
                      <p className="text-sm font-medium capitalize">{selectedTicket.type}</p>
                    </div>
                    <div className="bg-darkInput rounded-lg p-3">
                      <p className="text-muted text-xs mb-1">Priority</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[selectedTicket.priority as keyof typeof priorityColors]}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div className="bg-darkInput rounded-lg p-3">
                      <p className="text-muted text-xs mb-1">Status</p>
                      <div className="flex items-center gap-1">
                        {statusIcons[selectedTicket.status as keyof typeof statusIcons]}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[selectedTicket.status as keyof typeof statusColors]}`}>
                          {selectedTicket.status?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="bg-darkInput rounded-lg p-3">
                      <p className="text-muted text-xs mb-1">Created</p>
                      <p className="text-sm">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="bg-darkInput rounded-lg p-4 mb-4">
                    <p className="text-muted text-xs mb-2">User Information</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-muted" />
                        <span>{selectedTicket.user?.name || selectedTicket.user}</span>
                      </div>
                      {selectedTicket.user?.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-muted" />
                          <span>{selectedTicket.user.email}</span>
                        </div>
                      )}
                      {selectedTicket.user?.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-muted" />
                          <span>{selectedTicket.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="mb-4">
                    <p className="text-muted text-xs mb-2">Conversation</p>
                    <div className="space-y-3">
                      {selectedTicket.messages?.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            msg.sender === 'customer'
                              ? 'bg-darkInput'
                              : 'bg-primary/10 ml-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-medium">
                              {msg.sender === 'customer' ? 'Customer' : 'Support Agent'}
                            </span>
                            <span className="text-xs text-muted">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                        </div>
                      ))}
                      {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                        <div className="text-center text-muted text-sm py-4">
                          No messages yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reply Box */}
                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <div className="mt-4">
                      <textarea
                        placeholder="Type your response..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg resize-none focus:outline-none focus:border-primary text-sm"
                      />
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={handleSendReply}
                          disabled={sendReplyMutation.isPending}
                          className="flex-1 bg-primary text-dark py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                          {sendReplyMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-dark border-t-transparent" />
                          ) : (
                            <>
                              <Send size={14} /> Send Reply
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCloseTicket}
                          disabled={closeTicketMutation.isPending}
                          className="flex-1 bg-green-500/20 text-green-500 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
                        >
                          {closeTicketMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
                          ) : (
                            <>
                              <CheckCircle size={14} /> Resolve Ticket
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedTicket.status === 'resolved' && (
                    <div className="text-center p-4 bg-green-500/10 rounded-lg">
                      <CheckCircle size={24} className="text-green-500 mx-auto mb-2" />
                      <p className="text-green-500">This ticket has been resolved</p>
                    </div>
                  )}

                  {selectedTicket.status === 'closed' && (
                    <div className="text-center p-4 bg-gray-500/10 rounded-lg">
                      <X size={24} className="text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-500">This ticket is closed</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-muted">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                  <p>Select a ticket to view details</p>
                  <p className="text-xs mt-1">Click on any ticket from the list</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}