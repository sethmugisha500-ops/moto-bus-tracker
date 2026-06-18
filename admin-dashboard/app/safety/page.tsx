'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import safetyAPI from '@/lib/api';
import { Search, Filter, RefreshCw, AlertTriangle, MapPin, User, Phone, Clock, CheckCircle, XCircle, Eye, Send, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

const alertTypeColors = {
  emergency: 'bg-red-500/20 text-red-500',
  accident: 'bg-yellow-500/20 text-yellow-500',
  dispute: 'bg-orange-500/20 text-orange-500',
  sos: 'bg-red-500/20 text-red-500',
};

const alertStatusColors = {
  active: 'bg-red-500/20 text-red-500',
  investigating: 'bg-yellow-500/20 text-yellow-500',
  resolved: 'bg-green-500/20 text-green-500',
  false_alarm: 'bg-gray-500/20 text-gray-400',
};

const disputeStatusColors = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  investigating: 'bg-blue-500/20 text-blue-500',
  resolved: 'bg-green-500/20 text-green-500',
  rejected: 'bg-red-500/20 text-red-500',
};

export default function SafetyPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sos');
  const [search, setSearch] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  // Fetch SOS Alerts
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['sos-alerts', search],
    queryFn: () =>
      safetyAPI
        .get('/sos-alerts', { params: { search } })
        .then((res: { data: any }) => res.data),
    refetchInterval: 10000,
  });

  // Fetch Disputes
  const { data: disputesData, isLoading: disputesLoading, refetch: refetchDisputes } = useQuery({
    queryKey: ['disputes', search],
    queryFn: () =>
      safetyAPI
        .get('/disputes', { params: { search } })
        .then((res: { data: any }) => res.data),
    refetchInterval: 30000,
  });

  // Fetch Accidents
  const { data: accidentsData, isLoading: accidentsLoading } = useQuery({
    queryKey: ['accidents'],
    queryFn: () => safetyAPI.get('/accidents').then((res: { data: any }) => res.data),
    enabled: activeTab === 'accidents',
  });

  // Resolve Alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      safetyAPI.post(`/sos-alerts/${id}/resolve`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      toast.success('Alert resolved');
      setSelectedAlert(null);
      setResolutionNote('');
    },
    onError: () => {
      toast.error('Failed to resolve alert');
    },
  });

  // Resolve Dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      safetyAPI.post(`/disputes/${id}/resolve`, { decision, note: resolutionNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute resolved');
      setSelectedDispute(null);
      setResolutionNote('');
    },
    onError: () => {
      toast.error('Failed to resolve dispute');
    },
  });

  const alerts = alertsData?.alerts || [];
  const disputes = disputesData?.disputes || [];
  const accidents = accidentsData?.accidents || [];
  const stats = alertsData?.stats || {
    active: 0,
    today: 0,
    resolved: 0,
  };

  const handleResolveAlert = (id: string) => {
    if (!resolutionNote.trim()) {
      toast.error('Please enter resolution notes');
      return;
    }
    resolveAlertMutation.mutate({ id, note: resolutionNote });
  };

  const handleResolveDispute = (id: string, decision: string) => {
    resolveDisputeMutation.mutate({ id, decision });
  };

  if (alertsLoading || disputesLoading || accidentsLoading) {
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
            <h1 className="text-xl font-bold">Safety Center</h1>
            <p className="text-muted text-xs">Monitor safety incidents and manage disputes</p>
          </div>
          <button
            onClick={() => {
              if (activeTab === 'sos') refetchAlerts();
              if (activeTab === 'disputes') refetchDisputes();
            }}
            className="p-2 rounded-lg bg-darkInput hover:bg-darkInput/80 transition-all"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* SOS Stats Banner */}
        {activeTab === 'sos' && (
          <div className={`rounded-xl p-4 mb-6 ${stats.active > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.active > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                <AlertTriangle size={20} className={stats.active > 0 ? 'text-red-500' : 'text-green-500'} />
              </div>
              <div>
                <p className={`font-semibold ${stats.active > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.active > 0 ? `Active SOS Alerts: ${stats.active}` : 'No Active SOS Alerts'}
                </p>
                <p className="text-xs text-muted">
                  {stats.active > 0 ? 'Emergency alerts requiring immediate attention' : 'All clear. No emergencies at this time.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {['sos', 'accidents', 'disputes', 'blocked'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'sos' && stats.active > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {stats.active}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'sos' ? 'alerts' : activeTab === 'disputes' ? 'disputes' : 'incidents'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-darkInput border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* SOS Alerts Tab */}
        {activeTab === 'sos' && (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`bg-darkCard border rounded-xl p-4 transition-all ${
                  alert.status === 'active' ? 'border-red-500/30' : 'border-border'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      alert.type === 'emergency' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <AlertTriangle size={20} className={alert.type === 'emergency' ? 'text-red-500' : 'text-yellow-500'} />
                    </div>
                    <div>
                      <p className="font-semibold">{alert.user?.name || alert.user}</p>
                      <p className="text-xs text-muted">ID: {alert.id?.slice(-8)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${alertTypeColors[alert.type as keyof typeof alertTypeColors]}`}>
                      {alert.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${alertStatusColors[alert.status as keyof typeof alertStatusColors]}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted" />
                    <span className="text-muted">Location:</span>
                    <span>{alert.location?.address || `${alert.lat}, ${alert.lng}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span className="text-muted">Time:</span>
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  {alert.driver && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-muted" />
                      <span className="text-muted">Driver:</span>
                      <span>{alert.driver.name}</span>
                    </div>
                  )}
                  {alert.rideId && (
                    <div className="flex items-center gap-2">
                      <Navigation size={14} className="text-muted" />
                      <span className="text-muted">Ride:</span>
                      <span className="font-mono text-xs">#{alert.rideId?.slice(-8)}</span>
                    </div>
                  )}
                </div>

                {alert.status === 'active' ? (
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setSelectedAlert(alert)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={14} /> Respond Now
                    </button>
                    <button
                      onClick={() => {
                        if (alert.lat && alert.lng) {
                          window.open(`https://www.google.com/maps?q=${alert.lat},${alert.lng}`, '_blank');
                        }
                      }}
                      className="flex-1 bg-primary text-dark py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Navigation size={14} /> View Location
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted">
                      Resolved: {new Date(alert.resolvedAt).toLocaleString()} by {alert.resolvedBy}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-darkCard rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="text-muted">No SOS alerts</p>
                <p className="text-xs text-muted mt-1">All clear! No emergencies reported.</p>
              </div>
            )}
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="space-y-3">
            {disputes.map((dispute: any) => (
              <div key={dispute.id} className="bg-darkCard border border-border rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">{dispute.issue}</p>
                    <p className="text-xs text-muted">Ride #{dispute.rideId?.slice(-8)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${disputeStatusColors[dispute.status as keyof typeof disputeStatusColors]}`}>
                    {dispute.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted" />
                    <span className="text-muted">Rider:</span>
                    <span>{dispute.rider?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted" />
                    <span className="text-muted">Driver:</span>
                    <span>{dispute.driver?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span className="text-muted">Reported:</span>
                    <span>{new Date(dispute.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted">Amount:</span>
                    <span className="text-primary">RWF {dispute.amount}</span>
                  </div>
                </div>

                <div className="bg-darkInput rounded-lg p-3 mb-3">
                  <p className="text-sm">{dispute.description}</p>
                </div>

                {dispute.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResolveDispute(dispute.id, 'resolved')}
                      className="flex-1 bg-green-500/20 text-green-500 py-2 rounded-lg text-sm font-semibold"
                    >
                      Accept & Resolve
                    </button>
                    <button
                      onClick={() => handleResolveDispute(dispute.id, 'rejected')}
                      className="flex-1 bg-red-500/20 text-red-500 py-2 rounded-lg text-sm font-semibold"
                    >
                      Reject Dispute
                    </button>
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="flex-1 bg-primary text-dark py-2 rounded-lg text-sm font-semibold"
                    >
                      Review Details
                    </button>
                  </div>
                )}

                {dispute.status === 'resolved' && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-green-500">✓ Resolved - Refund issued</p>
                  </div>
                )}

                {dispute.status === 'rejected' && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-red-500">✗ Rejected - No refund issued</p>
                  </div>
                )}
              </div>
            ))}

            {disputes.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-darkCard rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="text-muted">No disputes</p>
                <p className="text-xs text-muted mt-1">All disputes have been resolved.</p>
              </div>
            )}
          </div>
        )}

        {/* Accidents Tab */}
        {activeTab === 'accidents' && (
          <div className="space-y-3">
            {accidents.map((accident: any) => (
              <div key={accident.id} className="bg-darkCard border border-border rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">Accident Report</p>
                    <p className="text-xs text-muted">ID: {accident.id?.slice(-8)}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-500">
                    {accident.severity}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted" />
                    <span>{accident.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span>{new Date(accident.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted" />
                    <span>Rider: {accident.rider?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-muted" />
                    <span>Driver: {accident.driver?.name}</span>
                  </div>
                </div>

                <div className="bg-darkInput rounded-lg p-3 mb-3">
                  <p className="text-sm">{accident.description}</p>
                </div>

                <button className="w-full bg-primary/10 text-primary py-2 rounded-lg text-sm font-semibold">
                  View Report
                </button>
              </div>
            ))}

            {accidents.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-darkCard rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="text-muted">No accident reports</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Respond to Alert Modal */}
      {selectedAlert && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setSelectedAlert(null)} />
          <div className="fixed bottom-0 left-0 right-0 bg-darkCard rounded-t-2xl z-50 p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                Respond to Alert
              </h3>
              <button onClick={() => setSelectedAlert(null)} className="p-2">✕</button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted mb-2">Resolution Notes</p>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Describe how the alert was handled..."
                rows={4}
                className="w-full px-4 py-3 bg-darkInput border border-border rounded-lg resize-none focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleResolveAlert(selectedAlert.id)}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold"
              >
                Mark as Resolved
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 bg-darkInput text-white py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}