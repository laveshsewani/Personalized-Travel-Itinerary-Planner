import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Users, Shield } from 'lucide-react';
import { useTripStore } from '../store/tripStore';

export const ShareTripModal = ({ isOpen, onClose, trip }) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [inviting, setInviting] = useState(false);
  const inviteMember = useTripStore((state) => state.inviteMember);

  if (!isOpen || !trip) return null;

  const shareUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    try {
      await inviteMember(trip.id, email, role);
      setEmail('');
    } finally {
      setInviting(false);
    }
  };

  const members = trip.members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Share Trip & Collaborate
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[280px]">{trip.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {/* Public Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Public Shareable Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Invite Collaborator Form */}
          <form onSubmit={handleInvite} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-brand-500" />
              <span>Invite Group Travel Companion</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="email"
                required
                placeholder="companion@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={inviting || !email}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-50 transition-colors"
            >
              {inviting ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </form>

          {/* Members list */}
          {members.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">
                Trip Members ({members.length})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {members.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {m.email}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {m.role || 'editor'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
