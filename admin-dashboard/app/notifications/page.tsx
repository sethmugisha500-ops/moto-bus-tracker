'use client';

import { useState } from 'react';

const notifications = [
  { id: 1, title: 'Road Closure Alert', message: 'Route 101 is closed due to construction', type: 'alert', sentTo: 'All Drivers', date: '2024-01-15 09:30', status: 'sent' },
  { id: 2, title: 'New Promotion', message: 'Get 20% off on your next ride!', type: 'promotion', sentTo: 'All Riders', date: '2024-01-14 14:20', status: 'sent' },
  { id: 3, title: 'Weather Warning', message: 'Heavy rains expected, drive safely', type: 'warning', sentTo: 'All Drivers', date: '2024-01-13 08:15', status: 'sent' },
];

export default function NotificationsPage() {
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSendNotification = () => {
    console.log('Sending notification:', { title, message, selectedAudience });
    setShowSendModal(false);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Management</h1>
          <p className="text-muted text-sm">Send and manage system notifications</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="bg-primary text-dark px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all"
        >
          + Send Notification
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-darkCard border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">12</p>
          <p className="text-xs text-muted">Sent Today</p>
        </div>
        <div className="bg-darkCard border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">245</p>
          <p className="text-xs text-muted">Total Sent</p>
        </div>
        <div className="bg-darkCard border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-500">98%</p>
          <p className="text-xs text-muted">Delivery Rate</p>
        </div>
      </div>

      <div className="bg-darkCard border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-darkInput border-b border-border">
            <tr>
              <th className="text-left p-4 text-muted font-medium">Title</th>
              <th className="text-left p-4 text-muted font-medium">Message</th>
              <th className="text-left p-4 text-muted font-medium">Type</th>
              <th className="text-left p-4 text-muted font-medium">Audience</th>
              <th className="text-left p-4 text-muted font-medium">Date</th>
              <th className="text-left p-4 text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notif) => (
              <tr key={notif.id} className="border-b border-border hover:bg-darkInput/50">
                <td className="p-4 font-medium">{notif.title}</td>
                <td className="p-4">{notif.message}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    notif.type === 'alert' ? 'bg-red-500/20 text-red-500' :
                    notif.type === 'warning' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'
                  }`}>
                    {notif.type}
                  </span>
                </td>
                <td className="p-4">{notif.sentTo}</td>
                <td className="p-4 text-xs text-muted">{notif.date}</td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-500">
                    {notif.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darkCard border border-border rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Send Notification</h2>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3"
            >
              <option value="all">All Users</option>
              <option value="riders">All Riders</option>
              <option value="drivers">All Drivers</option>
              <option value="moto">Moto Drivers</option>
              <option value="bus">Bus Drivers</option>
              <option value="minibus">Mini-Bus Drivers</option>
            </select>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3"
            />
            <textarea
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-darkInput border border-border rounded-lg mb-3 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleSendNotification} className="flex-1 bg-primary text-dark py-2 rounded-lg">Send</button>
              <button onClick={() => setShowSendModal(false)} className="flex-1 bg-darkInput text-white py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}