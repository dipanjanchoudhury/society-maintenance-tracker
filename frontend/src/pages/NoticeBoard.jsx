import React, { useState, useEffect } from 'react';
import { noticeService } from '../services/api';
import { Pin, Calendar, AlertCircle, FileText, CheckCircle2, User } from 'lucide-react';

function NoticeBoard({ user }) {
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNotices = async () => {
    try {
      const list = await noticeService.list();
      setNotices(list);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await noticeService.create(title, content, isImportant);
      setSuccess('Notice posted successfully! Residents have been notified.');
      setTitle('');
      setContent('');
      setIsImportant(false);
      fetchNotices();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to post notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Notice Board</h2>
          <p className="text-gray-600 mt-1">Stay updated with the latest society announcements.</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post notice form (Admin only) */}
        {user.role === 'admin' && (
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-500" />
              <span>Publish Notice</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Water Shutoff Schedule"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Notice Content
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Provide all relevant details here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isImportant" className="text-xs font-medium text-amber-900 cursor-pointer flex items-center gap-1.5 select-none">
                  <Pin className="h-3.5 w-3.5 fill-amber-700 text-amber-700" />
                  <span>Mark as Important (Pins & Emails Residents)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Notice'}
              </button>
            </form>
          </div>
        )}

        {/* Notice List */}
        <div className={`${user.role === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              No announcements posted yet.
            </div>
          ) : (
            notices.map((notice) => (
              <div 
                key={notice.id} 
                className={`bg-white rounded-xl shadow-sm border p-6 transition hover:shadow-md relative overflow-hidden ${
                  notice.is_important ? 'border-amber-400 bg-amber-50/10' : 'border-gray-200'
                }`}
              >
                {/* Pinned ribbon */}
                {notice.is_important && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] uppercase font-bold tracking-wider py-1 px-3 rounded-bl-lg flex items-center gap-1">
                    <Pin className="h-3 w-3 fill-current" />
                    <span>Pinned</span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 leading-tight pr-16">
                      {notice.title}
                    </h4>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(notice.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        By {notice.author_name}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {notice.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NoticeBoard;
