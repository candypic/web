import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers,
  FaUserPlus,
  FaCheckCircle,
  FaTimes,
  FaWhatsapp,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBell,
  FaTrashAlt,
  FaCheck,
  FaClock,
  FaShieldAlt,
  FaFilter,
} from 'react-icons/fa';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabaseClient';
import {
  listCrewMembers,
  approveCrewMember,
  rejectCrewMember,
} from '../../lib/galleryApi';

export default function AdminCrew() {
  const [crew, setCrew] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  // Manual Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCrew, setNewCrew] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Candid Photographer',
    city: 'Kumta',
  });

  // Fetch Crew
  const fetchCrew = async () => {
    try {
      setLoading(true);
      const data = await listCrewMembers('all');
      setCrew(data);
    } catch (err) {
      console.error('Error loading crew members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrew();
    const channel = supabase
      .channel('crew-profiles-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_profiles' }, () => {
        fetchCrew();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Approve Handler
  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await approveCrewMember(id);
      await fetchCrew();
    } catch (err) {
      alert(`Error approving crew member: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Update Role Handler (Chandan sets role)
  const handleUpdateRole = async (id, newRole) => {
    try {
      setActionLoading(true);
      const { error } = await supabase
        .from('crew_profiles')
        .update({ role: newRole })
        .eq('id', id);
      if (error) throw error;
      await fetchCrew();
    } catch (err) {
      alert(`Failed to update role: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Handler
  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to decline this application?')) return;
    try {
      setActionLoading(true);
      await rejectCrewMember(id);
      await fetchCrew();
    } catch (err) {
      alert(`Error rejecting application: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete / Remove Handler
  const handleDelete = async (id) => {
    if (!confirm('Remove this crew member from the studio roster?')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('crew_profiles').delete().eq('id', id);
      if (error) throw error;
      await fetchCrew();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Add Submit
  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!newCrew.name.trim() || !newCrew.phone.trim()) {
      alert('Please fill in name and phone number.');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from('crew_profiles').insert([
        {
          name: newCrew.name.trim(),
          email: newCrew.email.trim().toLowerCase() || `${newCrew.name.toLowerCase().replace(/\s+/g, '')}@candypic.com`,
          phone: newCrew.phone.trim(),
          role: newCrew.role,
          city: newCrew.city || 'Kumta',
          status: 'approved',
          approved_by: 'chandan@candypic.com',
          approved_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;

      setIsAddModalOpen(false);
      setNewCrew({ name: '', email: '', phone: '', role: 'Candid Photographer', city: 'Kumta' });
      await fetchCrew();
    } catch (err) {
      alert(`Add error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingList = crew.filter((c) => c.status === 'pending');
  const approvedList = crew.filter(
    (c) =>
      c.status === 'approved' &&
      (filterRole === 'all' || c.role === filterRole)
  );

  const handleTestBroadcast = async () => {
    console.log('[CandyPic Test] Triggering test broadcast to studio-live-events...');
    const testChannel = supabase.channel('studio-live-events', {
      config: { broadcast: { self: true } },
    });

    const testPayload = {
      type: 'broadcast',
      event: 'shoot-assigned',
      payload: {
        title: '📸 Live Shoot Assignment Alert!',
        body: 'This is a live test broadcast! Your device is successfully connected to Candy Pic Studio alerts.',
        assignedTeam: 'You',
        date: new Date().toISOString().split('T')[0],
        client: 'Test Couple',
        venue: 'Gokarna Beach',
      },
    };

    if (testChannel.state === 'joined') {
      const res = await testChannel.send(testPayload);
      console.log('[CandyPic Test] Sent immediately on joined channel:', res);
      alert('✅ Broadcast dispatched! Check your notification bar / lock-screen.');
    } else {
      testChannel.subscribe(async (status) => {
        console.log('[CandyPic Test] Channel status:', status);
        if (status === 'SUBSCRIBED') {
          const res = await testChannel.send(testPayload);
          console.log('[CandyPic Test] Broadcast send result:', res);
          alert('✅ Broadcast dispatched! Check your notification bar / lock-screen.');
        }
      });
    }
  };

  return (
    <AdminLayout
      title="Crew Roster &amp; Approvals"
      subtitle="Review incoming team registrations and manage active studio crew"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestBroadcast}
            className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Dispatch a test broadcast to all connected phones/devices"
          >
            <FaBell size={11} className="text-brand-gold" /> Test Broadcast
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full px-5 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-lg shadow-brand-gold/20 flex items-center gap-2 cursor-pointer"
          >
            <FaUserPlus size={11} /> Add Crew Member
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* =========================================================================
            1. PENDING APPROVALS SECTION (SUPER ADMIN: CHANDAN@CANDYPIC.COM)
            ========================================================================= */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
                <FaClock size={18} />
              </div>
              <div>
                <h2 className="font-serif text-xl text-white font-medium flex items-center gap-2.5">
                  Pending Applications
                  {pendingList.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-red text-white text-xs font-bold animate-pulse">
                      {pendingList.length} Awaiting Approval
                    </span>
                  )}
                </h2>
                <p className="text-xs text-brand-muted font-light mt-0.5">
                  Registered from website login • Approving adds them to calendar booking dropdowns.
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-brand-muted font-light py-6 text-center">Loading crew applications...</p>
          ) : pendingList.length === 0 ? (
            <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5">
              <FaCheckCircle className="text-emerald-400 text-2xl mx-auto mb-2 opacity-80" />
              <p className="text-sm text-white font-medium">All caught up!</p>
              <p className="text-xs text-brand-muted font-light mt-0.5">
                There are no pending crew applications requiring approval.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {pendingList.map((applicant) => (
                <div
                  key={applicant.id}
                  className="p-5 rounded-2xl bg-black/40 border border-brand-gold/30 hover:border-brand-gold/60 transition-all flex flex-col justify-between gap-4 shadow-lg shadow-brand-gold/5"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-lg text-white font-medium">{applicant.name}</h3>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                          {applicant.role}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold uppercase">
                        Pending
                      </span>
                    </div>

                    <div className="text-xs text-brand-muted space-y-1 pt-1 font-light">
                      <p className="flex items-center gap-2">
                        <FaEnvelope className="text-brand-gold/70" size={11} />
                        <span>{applicant.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaPhone className="text-brand-gold/70" size={11} />
                        <span className="text-white font-medium">{applicant.phone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-brand-gold/70" size={11} />
                        <span>{applicant.city || 'Kumta'}</span>
                      </p>
                    </div>

                    {applicant.push_token && (
                      <div className="pt-1">
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                          <FaBell size={9} /> Lock-screen Push Notifications Active
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    {applicant.phone && (
                      <a
                        href={`https://wa.me/${applicant.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hi ${applicant.name}, this is Chandan from Candy Pic regarding your crew application.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full px-3 py-1.5 bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      >
                        <FaWhatsapp size={12} /> Chat
                      </a>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(applicant.id)}
                        disabled={actionLoading}
                        className="rounded-full px-3.5 py-1.5 bg-white/5 hover:bg-brand-red text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(applicant.id)}
                        disabled={actionLoading}
                        className="rounded-full px-5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1"
                      >
                        <FaCheck size={10} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            2. ACTIVE STUDIO CREW ROSTER SECTION
            ========================================================================= */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-white/10">
            <div>
              <h2 className="font-serif text-xl text-white font-medium">
                Active Studio Crew ({approvedList.length})
              </h2>
              <p className="text-xs text-brand-muted font-light mt-0.5">
                These photographers and crew members appear in the shoot assignment dropdown.
              </p>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-brand-muted" size={11} />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="rounded-xl bg-black/40 border border-white/15 px-3 py-1.5 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
              >
                <option value="all">All Specializations</option>
                <option value="Studio Lead & Candid Lead">Studio Lead</option>
                <option value="Candid Photographer">Candid Photographer</option>
                <option value="Traditional Photographer">Traditional Photographer</option>
                <option value="Drone Pilot & Aerial Cinema">Drone Pilot / Aerial</option>
                <option value="Lead Cinematographer">Cinematographer</option>
                <option value="Editor / Retoucher">Editor / Retoucher</option>
                <option value="Assistant / Lighting">Assistant / Lighting</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {approvedList.map((member) => (
              <div
                key={member.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-base text-white font-medium">{member.name}</h3>

                    {/* Role Selector (Chandan can change role anytime) */}
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      disabled={actionLoading}
                      className="rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-brand-gold [color-scheme:dark] cursor-pointer"
                      title="Click to reassign this crew member's role"
                    >
                      <option value="Studio Lead">Studio Lead</option>
                      <option value="Candid Photographer">Candid Photographer</option>
                      <option value="Traditional Photographer">Traditional Photographer</option>
                      <option value="Drone Pilot & Aerial Cinema">Drone Pilot & Aerial Cinema</option>
                      <option value="Lead Cinematographer">Lead Cinematographer</option>
                      <option value="Editor / Retoucher">Editor / Retoucher</option>
                      <option value="Assistant / Lighting">Assistant / Lighting</option>
                    </select>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                      Active
                    </span>
                  </div>

                  <p className="text-xs text-brand-muted font-light mt-1 flex flex-wrap items-center gap-2">
                    <span>📞 {member.phone}</span>
                    <span>•</span>
                    <span>📧 {member.email}</span>
                    <span>•</span>
                    <span>📍 {member.city || 'Kumta'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {member.phone && (
                    <a
                      href={`https://wa.me/${member.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full px-3 py-1.5 bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                      title="Direct WhatsApp chat"
                    >
                      <FaWhatsapp size={13} /> WhatsApp
                    </a>
                  )}

                  {member.email !== 'chandan@candypic.com' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(member.id)}
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-brand-red text-brand-muted hover:text-white flex items-center justify-center text-xs transition-colors"
                      title="Remove from studio roster"
                    >
                      <FaTrashAlt size={11} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          MANUAL ADD CREW MEMBER MODAL
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-brand-dark border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-serif text-xl text-white">Add Studio Crew Member</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManual} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Hegde"
                  value={newCrew.name}
                  onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                  className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={newCrew.phone}
                    onChange={(e) => setNewCrew({ ...newCrew, phone: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Optional"
                    value={newCrew.email}
                    onChange={(e) => setNewCrew({ ...newCrew, email: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    Role / Specialization
                  </label>
                  <select
                    value={newCrew.role}
                    onChange={(e) => setNewCrew({ ...newCrew, role: e.target.value })}
                    className="w-full rounded-xl bg-brand-deep border border-white/15 px-2.5 py-2 text-xs text-white outline-none focus:border-brand-gold [color-scheme:dark]"
                  >
                    <option value="Candid Photographer">Candid Photographer</option>
                    <option value="Traditional Photographer">Traditional Photographer</option>
                    <option value="Drone Pilot &amp; Aerial Cinema">Drone Pilot / Aerial</option>
                    <option value="Lead Cinematographer">Cinematographer</option>
                    <option value="Editor / Retoucher">Editor / Retoucher</option>
                    <option value="Assistant / Lighting">Assistant / Lighting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-brand-muted mb-1 font-semibold">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kumta"
                    value={newCrew.city}
                    onChange={(e) => setNewCrew({ ...newCrew, city: e.target.value })}
                    className="w-full rounded-xl bg-black/40 border border-white/15 px-3.5 py-2 text-xs text-white outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-full px-5 py-2 text-xs text-brand-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-full px-6 py-2 bg-brand-gold text-brand-dark font-bold text-xs uppercase tracking-wider hover:bg-brand-gold-soft transition-all shadow-md shadow-brand-gold/20 cursor-pointer"
                >
                  {actionLoading ? 'Adding...' : 'Add to Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
