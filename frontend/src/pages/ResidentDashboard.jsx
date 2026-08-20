import React, { useState, useEffect } from 'react';
import { complaintService } from '../services/api';
import { API_URL } from '../services/api';
import { 
  Plus, AlertCircle, CheckCircle2, Image as ImageIcon, 
  Clock, Calendar, User, Eye, X, MessageSquare 
} from 'lucide-react';

function ResidentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [activeComplaint, setActiveComplaint] = useState(null);

  const fetchComplaints = async () => {
    try {
      const data = await complaintService.list();
      setComplaints(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await complaintService.create(title, description, category, photoFile);
      setSuccess('Complaint raised successfully! Our administration team has been notified.');
      
      // Reset Form
      setTitle('');
      setDescription('');
      setCategory('Plumbing');
      setPhotoFile(null);
      setPhotoPreview(null);
      setShowForm(false);
      
      // Reload
      fetchComplaints();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to file complaint.');
    } finally {
      setSubmitting(false);
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

  const categories = ['Plumbing', 'Electrical', 'Carpentry', 'Security', 'Common Area', 'Pest Control', 'Others'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Resident Portal</h2>
          <p className="text-gray-600 mt-1">Submit, monitor, and check the logs of your maintenance complaints.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm shadow-sm"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showForm ? 'Cancel Request' : 'Raise Complaint'}</span>
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

      {/* Raise complaint Form panel */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">File New Maintenance Request</h3>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Subject / Short Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bathroom washbasin faucet dripping"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Full Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the issue, location, and preferred inspection time..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Attach Supporting Photo (Optional)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-600 bg-white">
                  <ImageIcon className="h-4.5 w-4.5 text-gray-400" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <div className="relative h-16 w-16 border border-gray-200 rounded-lg overflow-hidden shrink-0">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaints List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">My Maintenance Requests</h3>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {complaints.length} Filed
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            You have not filed any maintenance requests yet. Click "Raise Complaint" above to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 w-20">ID</th>
                  <th className="p-4">Complaint Details</th>
                  <th className="p-4 w-32">Category</th>
                  <th className="p-4 w-32">Status</th>
                  <th className="p-4 w-32">Priority</th>
                  <th className="p-4 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-semibold text-gray-600">#{c.id}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-gray-900 leading-tight">{c.title}</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-md truncate">{c.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-md text-gray-600">
                        {c.category}
                      </span>
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
                        onClick={() => setActiveComplaint(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-primary-500 hover:text-primary-600 rounded-lg text-xs font-semibold text-gray-600 transition bg-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status History / View Logs Modal */}
      {activeComplaint && (
        <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-gray-900">Complaint Logs</h4>
                <p className="text-xs text-gray-500 mt-0.5">Complaint #{activeComplaint.id} timeline and notes</p>
              </div>
              <button 
                onClick={() => setActiveComplaint(null)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Meta Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Title</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{activeComplaint.title}</p>
                  
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-3">Description</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{activeComplaint.description}</p>
                </div>
                <div>
                  {activeComplaint.photo_url ? (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Attached Photo</p>
                      <a 
                        href={`${API_URL}${activeComplaint.photo_url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block rounded-lg overflow-hidden border border-gray-200 h-28 hover:opacity-90 transition group"
                      >
                        <img 
                          src={`${API_URL}${activeComplaint.photo_url}`} 
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

              {/* Status Log Timeline */}
              <div>
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Lifecycle History</span>
                </h5>

                <div className="relative pl-6 border-l-2 border-gray-200 space-y-6 ml-3">
                  {activeComplaint.status_history.map((hist, idx) => (
                    <div key={hist.id} className="relative">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-1.5 h-4 w-4 rounded-full border-4 border-white ${
                        hist.status === 'Resolved' ? 'bg-green-500' :
                        hist.status === 'In_Progress' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></span>

                      <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="text-sm font-bold text-gray-900">
                            Status updated to <span className="underline">{hist.status.replace('_', ' ')}</span>
                          </p>
                          <span className="text-[11px] text-gray-400">
                            {new Date(hist.created_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex gap-4 items-center mt-1 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">Priority: {hist.priority}</span>
                          <span>Actor: {hist.actor_name}</span>
                        </div>

                        {hist.note && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-start gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <p className="italic leading-normal">"{hist.note}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setActiveComplaint(null)} 
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition text-sm font-semibold text-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResidentDashboard;
