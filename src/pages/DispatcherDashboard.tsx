import { useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  CheckCircle, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  ChevronLeft,
  Filter,
  AlertCircle,
  MapPin,
  Clock,
  Zap
} from 'lucide-react';

import type { AuthUser, DeliveryRequest, Rider } from '../types';
import { assignRider, fetchAvailableRiders, fetchRequests, subscribeToRequests } from '../lib/api';
import { useLogoutFlow } from '../hooks/useLogoutFlow';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';

// --- Shared Themed Sub-components ---

const NavItem = ({ icon: Icon, label, active, onClick, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
      active 
        ? "bg-white/10 text-white shadow-sm" 
        : "text-white/60 hover:text-white hover:bg-white/5"
    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const SummaryCard = ({ label, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={22} />
    </div>
  </div>
);

const PriorityBadge = ({ priority }: { priority: string }) => {
  const isHigh = priority === 'high';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${
      isHigh ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-500 border-slate-100"
    }`}>
      {isHigh && <Zap size={10} className="inline mr-1 -mt-0.5" />}
      {priority}
    </span>
  );
};

// --- Main Dispatcher Dashboard ---

export function DispatcherDashboard({ user }: { user: AuthUser }) {
  const { confirmOpen, loading: loggingOut, requestLogout, cancelLogout, confirmLogout } = useLogoutFlow();
  const [pending, setPending] = useState<DeliveryRequest[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState<DeliveryRequest | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
  const [riderSearch, setRiderSearch] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    const [reqs, availableRiders] = await Promise.all([
      fetchRequests('pending'), 
      fetchAvailableRiders()
    ]);
setPending(
  reqs.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;
    return 0;
  })
);
    setRiders(availableRiders);
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    return subscribeToRequests((all) => setPending(all.filter(r => r.current_status === 'pending')), 'pending');
  }, []);

  const filteredRequests = useMemo(() => {
    const q = search.toLowerCase();
    return pending.filter(r => 
      r.tracking_code.toLowerCase().includes(q) || 
      r.customer_name?.toLowerCase().includes(q)
    );
  }, [pending, search]);

  const visibleRiders = riders.filter(r => 
    r.full_name.toLowerCase().includes(riderSearch.toLowerCase())
  );

  const handleAssign = async () => {
    if (!assignTarget || !selectedRiderId) return;
    setSubmitting(true);
    try {
      await assignRider(assignTarget.delivery_request_id, selectedRiderId);
      setAssignTarget(null);
      refresh();
    } catch (e) {
      alert("Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-slate-900 overflow-hidden font-sans">
      {/* Sidebar - Consistent with Retailer Brand Blue */}
      <aside className="w-64 bg-[#0047BB] flex flex-col p-6 text-white shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-[#0047BB] font-black italic">R</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reflex</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-4 px-2">Dispatch Ops</div>
          <NavItem icon={LayoutDashboard} label="Live Map" disabled />
          <NavItem icon={Truck} label="Unassigned" active />
          <NavItem icon={CheckCircle} label="Active Tasks" disabled />
          <NavItem icon={Users} label="Riders Fleet" disabled />
          <NavItem icon={BarChart3} label="Performance" disabled />
          <NavItem icon={Settings} label="Ops Settings" disabled />
        </nav>

        <button
          onClick={requestLogout}
          className="mt-auto flex items-center gap-3 px-4 py-3 text-white/60 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </aside>

      <LogoutConfirmModal
        open={confirmOpen}
        loading={loggingOut}
        onCancel={cancelLogout}
        onConfirm={confirmLogout}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-lg">Unassigned Requests</h2>
            <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs font-bold border border-orange-100">
              {pending.length} Pending
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">Lead Dispatcher</p>
              </div>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-sm">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-6">
              <SummaryCard label="Pending Requests" value={pending.length} icon={Clock} colorClass="bg-orange-50 text-orange-600" />
              <SummaryCard label="High Priority" value={pending.filter(r => r.priority === 'high').length} icon={AlertCircle} colorClass="bg-red-50 text-red-600" />
              <SummaryCard label="Available Riders" value={riders.length} icon={Users} colorClass="bg-emerald-50 text-emerald-600" />
            </div>

            {/* Main Data Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by code or customer..." 
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-600/10 transition-all" 
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600">
                  <Filter size={14} /> Filter
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <tr>
                      <th className="px-6 py-4 text-left">Request Info</th>
                      <th className="px-6 py-4 text-left">Origin / Retailer</th>
                      <th className="px-6 py-4 text-left">Destination</th>
                      <th className="px-6 py-4 text-left">Priority</th>
                      <th className="px-6 py-4 text-left">Time Elapsed</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                       <tr><td colSpan={6} className="p-10 text-center animate-pulse text-slate-300 font-bold uppercase tracking-widest">Loading Requests...</td></tr>
                    ) : filteredRequests.map((req) => (
                      <tr key={req.delivery_request_id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-mono font-bold text-blue-600 text-xs mb-1">{req.tracking_code}</p>
                          <p className="font-black text-slate-900">{req.customer_name}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-500 uppercase">{req.retailer_name || 'Generic Retail'}</p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-start gap-2 max-w-[200px]">
                            <MapPin size={14} className="text-slate-300 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-600 leading-snug">{req.customer_address}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <PriorityBadge priority={req.priority || 'standard'} />
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-slate-400">
                             <Clock size={14} />
                             <span className="text-xs font-medium">12m ago</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => setAssignTarget(req)}
                            className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tight hover:bg-[#0047BB] hover:text-white hover:border-[#0047BB] transition-all shadow-sm"
                          >
                            Assign Rider
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Assignment Slide-over (Screenshot 2 Theme) */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !submitting && setAssignTarget(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8 animate-in slide-in-from-right duration-300">
            
            <div className="flex items-center gap-4 mb-8">
               <button onClick={() => setAssignTarget(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <ChevronLeft size={20} />
               </button>
               <div>
                  <h3 className="text-xl font-black">Assign Rider</h3>
                  <p className="text-xs font-mono font-bold text-blue-600 uppercase tracking-tighter">{assignTarget.tracking_code}</p>
               </div>
            </div>

            {/* Request Summary Card */}
            <div className="bg-slate-50 p-5 rounded-2xl mb-8">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Delivery Summary</p>
               <div className="space-y-3">
                  <div className="flex justify-between">
                     <span className="text-sm font-bold">{assignTarget.customer_name}</span>
                     <PriorityBadge priority={assignTarget.priority || 'standard'} />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed"><MapPin size={12} className="inline mr-1" /> {assignTarget.customer_address}</p>
                  <p className="text-xs font-medium text-slate-400 bg-white p-2 rounded-lg border border-slate-100">
                     <Truck size={12} className="inline mr-2" /> {assignTarget.item_description}
                  </p>
               </div>
            </div>

            {/* Rider Selection List */}
            <div className="flex-1 overflow-hidden flex flex-col">
               <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="text" 
                    value={riderSearch}
                    onChange={(e) => setRiderSearch(e.target.value)}
                    placeholder="Search available riders..." 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition-colors" 
                  />
               </div>

               <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {visibleRiders.map((rider) => (
                    <button
                      key={rider.user_id}
                      onClick={() => setSelectedRiderId(rider.user_id)}
                      className={`w-full group flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selectedRiderId === rider.user_id 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-white transition-colors">
                          {rider.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">{rider.full_name}</p>
                          <div className="flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Idle / Nearby</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Capacity</p>
                         <p className="text-xs font-black">{rider.capacity_pct || '0'}%</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Action Footer */}
            <div className="pt-8 space-y-3">
               <button 
                 onClick={handleAssign}
                 disabled={!selectedRiderId || submitting}
                 className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all"
               >
                 {submitting ? 'Processing...' : 'Confirm Assignment'}
               </button>
               <button 
                 onClick={() => setAssignTarget(null)}
                 className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 text-sm"
               >
                 Dismiss
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}