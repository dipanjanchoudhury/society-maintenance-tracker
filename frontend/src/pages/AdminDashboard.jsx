import React, { useState, useEffect } from 'react';
import { complaintService, settingsService, API_URL } from '../services/api';
import { 
  AlertCircle, CheckCircle2, Clock, Inbox, ShieldAlert, 
  Eye, X, Filter, BarChart, Settings, Sliders, MessageSquare, Image as ImageIcon 
} from 'lucide-react';

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [thresholdDays, setThresholdDays] = useState('5');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters State
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalPriority, setModalPriority] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Configuration Panel
  const [showConfig, setShowConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadData = async () => {
    try {
      // 1. Load complaints
      const complaintsData = await complaintService.list({
        category: filterCategory || undefined,
        status: filterStatus || undefined
      });
      setComplaints(complaintsData);

      // 2. Load stats
      const statsData = await complaintService.getDashboardStats();
      setStats(statsData);

      // 3. Load configurations
      const config = await settingsService.list();
      const threshold = config.find(c => c.key === 'overdue_threshold_days');
      if (threshold) {
        setThresholdDays(threshold.value);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterCategory, filterStatus]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setError('');
    setSuccess('');
    setUpdating(true);
    try {
      const updated = await complaintService.updateStatus(
        selectedComplaint.id,
        modalStatus,
        modalPriority,
        modalNote
      );
      setSuccess(`Complaint #${selectedComplaint.id} updated and resident notified.`);
      setSelectedComplaint(null);
      setModalNote('');
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update complaint status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSavingConfig(true);
    try {
      await settingsService.update('overdue_threshold_days', thresholdDays);
      setSuccess(`Overdue threshold successfully set to ${thresholdDays} days!`);
      setShowConfig(false);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to save overdue configurations.');
    } finally {
      setSavingConfig(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In_Progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-100';
      case 'Medium':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-100';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const openDetails = (c) => {
    setSelectedComplaint(c);
    setModalStatus(c.status);
    setModalPriority(c.priority);
    setModalNote('');
  };

  const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Security', 'Common Area', 'Pest Control', 'Others'];
  const statuses = ['Open', 'In_Progress', 'Resolved'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h2>
          <p className="text-gray-600 mt-1">Review system complaints, resolve issues, and adjust settings.</p>
        </div>
        
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-semibold text-gray-600 bg-white shadow-sm"
        >
          <Settings className="h-4.5 w-4.5" />
          <span>Config Threshold</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-sm text-green-700 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Threshold Configuration Panel */}
      {showConfig && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-md animate-in fade-in duration-150">
          <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary-500" />
            <span>Configure Overdue Threshold</span>
          </h3>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Threshold Period (in days)
              </label>
              <input
                type="number"
                min="1"
                required
                value={thresholdDays}
                onChange={(e) => setThresholdDays(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Complaints remaining open beyond this limit are flagged as overdue and pinned to the top of the queue.
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-3.5 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs font-semibold text-gray-600"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={savingConfig}
                className="px-3.5 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-xs font-semibold"
              >
                {savingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Filed</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.total_complaints}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Tasks</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">
                {stats.open_complaints + stats.in_progress_complaints}
              </h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resolved</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.resolved_complaints}</h4>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overdue Issues</p>
              <h4 className="text-2xl font-bold text-gray-900 mt-0.5 text-red-600">{stats.overdue_complaints}</h4>
            </div>
          </div>
        </div>
      )}

      {/* Main content split: Table and category chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Complaints Table Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Header & filters */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-gray-900">Complaints Queue</h3>
            
            {/* Filters panel */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs bg-white"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 text-xs bg-white"
              >
                <option value="">All Statuses</option>
                {statuses.map(st => (
                  <option key={st} value={st}>{st.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No matching complaints in queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4 w-20">ID</th>
                    <th className="p-4">Complaint / Unit</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Priority</th>
                    <th className="p-4 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {complaints.map((c) => (
                    <tr 
                      key={c.id} 
                      className={`transition hover:bg-gray-50/50 ${
                        c.is_overdue ? 'bg-red-50/20 border-l-4 border-l-red-500' : ''
                      }`}
                    >
                      <td className="p-4 font-semibold text-gray-600">
                        {c.is_overdue && (
                          <span className="block text-[8px] bg-red-600 text-white font-bold text-center px-1 rounded uppercase mb-1">
                            Overdue
                          </span>
                        )}
                        #{c.id}
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{c.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {c.creator_name} ({c.creator_unit || 'No unit'}) | Cat: {c.category}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center text-xs border px-2.5 py-1 rounded-full font-medium ${getStatusColor(c.status)}`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center text-xs border px-2 py-0.5 rounded font-semibold ${getPriorityColor(c.priority)}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openDetails(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-primary-100 hover:border-primary-500 bg-primary-50/50 hover:bg-primary-50 text-primary-700 hover:text-primary-800 rounded-lg text-xs font-semibold transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dashboard SVG category breakdown card */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-fit">
          <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary-500" />
            <span>Category Analysis</span>
          </h3>
          
          {stats && Object.keys(stats.category_counts).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(stats.category_counts).map(([cat, count]) => {
                const percentage = Math.round((count / stats.total_complaints) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center text-xs text-gray-600 mb-1 font-medium">
                      <span>{cat}</span>
                      <span>{count} issues ({percentage}%)</span>
                    </div>
                    {/* Visual Bar representation */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 text-center py-6">No category data recorded.</p>
          )}
        </div>
      </div>

      {/* Admin action modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Manage Complaint #{selectedComplaint.id}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Raised by {selectedComplaint.creator_name} ({selectedComplaint.creator_unit || 'Unit unspecified'})
                </p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content & Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Info panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</p>
                  <p className="text-xs text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">
                    {selectedComplaint.description}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Created Date</span>
                      <p className="font-semibold text-gray-700 mt-0.5">
                        {new Date(selectedComplaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Overdue Flag</span>
                      <p className={`font-semibold mt-0.5 ${selectedComplaint.is_overdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {selectedComplaint.is_overdue ? 'Yes (Overdue)' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  {selectedComplaint.photo_url ? (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Attached Photo</p>
                      <a 
                        href={`${API_URL}${selectedComplaint.photo_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block rounded-lg overflow-hidden border border-gray-200 h-28 hover:opacity-90 transition"
                      >
                        <img 
                          src={`${API_URL}${selectedComplaint.photo_url}`} 
                          alt="Complaint photo" 
                          className="h-full w-full object-cover" 
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center bg-gray-100 border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                      <ImageIcon className="h-6 w-6 mb-1" />
                      <span>No photo provided</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="space-y-4 border-t border-gray-100 pt-4">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Update Lifecycle State</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Set Status
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                    >
                      <option value="Open">Open</option>
                      <option value="In_Progress">In Progress</option>
                      <option value="Resolved">Resolved (Close Complaint)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Set Priority
                    </label>
                    <select
                      value={modalPriority}
                      onChange={(e) => setModalPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Administration Note / Log Message
                  </label>
                  <textarea
                    rows={3}
                    value={modalNote}
                    onChange={(e) => setModalNote(e.target.value)}
                    placeholder="Describe actions taken, schedules made, or why the issue was marked as resolved..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Resident will receive an email containing this message when you update the status.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Save & Notify'}
                  </button>
                </div>
              </form>

              {/* Status Log Timeline */}
              <div className="border-t border-gray-100 pt-4">
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Logs & History</h5>
                <div className="relative pl-6 border-l-2 border-gray-200 space-y-4 ml-3">
                  {selectedComplaint.status_history.map((hist) => (
                    <div key={hist.id} className="relative">
                      <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-4 border-white bg-gray-400"></span>
                      <div className="text-xs">
                        <div className="flex justify-between items-center text-gray-800">
                          <span className="font-bold">Status: {hist.status.replace('_', ' ')}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(hist.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-0.5">Priority: {hist.priority} | Actor: {hist.actor_name}</p>
                        {hist.note && (
                          <p className="mt-1 italic text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                            "{hist.note}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
