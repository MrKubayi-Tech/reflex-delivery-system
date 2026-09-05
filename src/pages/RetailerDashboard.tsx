import { useEffect, useMemo, useState, type FormEvent } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  History, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search,  
  Printer, 
  ChevronRight,
  Bell,
  Smartphone,
  MapPin,
  Clock,
  CheckCircle2
} from "lucide-react";

import type {
  AuthUser,
  DeliveryRequest,
  NewDeliveryRequestInput,
} from "../types";
import {
  createRequest,
  fetchRequests,
  subscribeToRequests,
  ApiError,
} from "../lib/api";
import { useLogoutFlow } from "../hooks/useLogoutFlow";
import { LogoutConfirmModal } from "../components/LogoutConfirmModal";

// --- Sub-components for the New Visual Language ---

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

const SummaryCard = ({ label, value, icon: Icon, trend }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      {trend && <p className="text-[10px] text-slate-400 mt-1">{trend}</p>}
    </div>
    <div className="p-3 bg-slate-50 rounded-lg text-blue-600">
      <Icon size={24} />
    </div>
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const styles: any = {
    pending: "bg-orange-50 text-orange-600 border-orange-100",
    assigned: "bg-blue-50 text-blue-600 border-blue-100",
    picked_up: "bg-purple-50 text-purple-600 border-purple-100",
    delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${styles[status] || "bg-slate-50 text-slate-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
};

// --- Main Dashboard Component ---

export function RetailerDashboard({ user }: { user: AuthUser }) {
  const { confirmOpen, loading: loggingOut, requestLogout, cancelLogout, confirmLogout } = useLogoutFlow();
  const [currentView, setCurrentView] = useState<'dashboard' | 'deliveries' | 'details'>('dashboard');
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
 const [, setLoading] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  
  // Form State
  const [form, setForm] = useState<NewDeliveryRequestInput>({
    customer_name: "", customer_phone: "", customer_address: "", item_description: "", priority: "standard"
  });
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests().then(setRequests).finally(() => setLoading(false));
    return subscribeToRequests(setRequests);
  }, []);

  const stats = useMemo(() => ({
    total: requests.length,
    active: requests.filter(r => r.current_status !== 'delivered').length,
    delivered: requests.filter(r => r.current_status === 'delivered').length,
    pending: requests.filter(r => r.current_status === 'pending').length
  }), [requests]);

  function resetForm() {
    setForm({ customer_name: "", customer_phone: "", customer_address: "", item_description: "", priority: "standard" });
    setCreateErrors({});
  }

  async function handleCreateRequest(e: FormEvent) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    setCreateErrors({});
    try {
      await createRequest(form);
      // subscribeToRequests will push the fresh list via SSE, but refetch
      // immediately too so the retailer sees their own new request without
      // waiting on the next stream tick.
      const updated = await fetchRequests();
      setRequests(updated);
      resetForm();
      setShowNewRequestModal(false);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setCreateErrors(err.fieldErrors);
      } else {
        setCreateErrors({ _general: err instanceof ApiError ? err.message : 'Could not create the request.' });
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-slate-900 overflow-hidden">
      {/* Sidebar - Deep Brand Blue */}
      <aside className="w-64 bg-[#0047BB] flex flex-col p-6 text-white shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-[#0047BB] font-black italic">R</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reflex</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-4 px-2">Retailer</div>
          <NavItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <NavItem icon={PlusCircle} label="New Delivery" onClick={() => setShowNewRequestModal(true)} />
          <NavItem icon={Package} label="My Deliveries" active={currentView === 'deliveries'} onClick={() => setCurrentView('deliveries')} />
          <NavItem icon={History} label="History" disabled />
          <NavItem icon={Users} label="Customers" disabled />
          <NavItem icon={BarChart3} label="Reports" disabled />
          <NavItem icon={Settings} label="Settings" disabled />
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="font-semibold text-lg">
            {currentView === 'dashboard' && "Retailer Dashboard"}
            {currentView === 'deliveries' && "My Deliveries"}
            {currentView === 'details' && "Delivery Details"}
          </h2>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-slate-400 hover:text-slate-600">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-bold leading-none">{user.name}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Njeri Electronics</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                JN
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentView === 'dashboard' && (
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-6">
                <SummaryCard label="Total Requests" value={stats.total} icon={Package} trend="All Time" />
                <SummaryCard label="In Progress" value={stats.active} icon={Clock} trend="Active" />
                <SummaryCard label="Delivered" value={stats.delivered} icon={CheckCircle2} trend="Today" />
                <SummaryCard label="Pending Assignment" value={stats.pending} icon={Users} trend="Waiting" />
              </div>

              <div className="grid grid-cols-3 gap-6">
                {/* Recent Deliveries Table */}
                <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold">Recent Deliveries</h3>
                    <button onClick={() => setCurrentView('deliveries')} className="text-blue-600 text-xs font-bold hover:underline">View all</button>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-5 py-3 text-left">Tracking Code</th>
                        <th className="px-5 py-3 text-left">Customer</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {requests.slice(0, 5).map(r => (
                        <tr key={r.tracking_code} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-slate-600">{r.tracking_code}</td>
                          <td className="px-5 py-4 font-medium">{r.customer_name}</td>
                          <td className="px-5 py-4"><StatusPill status={r.current_status} /></td>
                          <td className="px-5 py-4 text-right">
                            <button className="text-slate-300 hover:text-slate-600">
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Status Chart Placeholder & Quick Actions */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold mb-6">Requests by Status</h3>
                    <div className="aspect-square relative flex items-center justify-center">
                       {/* Simple CSS Donut representation */}
                       <div className="w-32 h-32 rounded-full border-[12px] border-blue-600 border-r-orange-400 border-b-purple-400 border-l-emerald-400"></div>
                       <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black">{stats.total}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold mb-4">Quick Actions</h3>
                    <button onClick={() => setShowNewRequestModal(true)} className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-md"><PlusCircle size={18}/></div>
                      <div>
                        <p className="text-sm font-bold">New Request</p>
                        <p className="text-[11px] text-slate-400">Log a new delivery</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'deliveries' && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                 <div className="flex gap-4">
                    {['All', 'Pending', 'Assigned', 'Picked Up', 'Delivered'].map((tab, i) => (
                      <button key={tab} className={`pb-2 text-sm font-bold border-b-2 transition-colors ${i === 0 ? 'border-blue-600 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        {tab} {i === 0 && <span className="ml-1 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{requests.length}</span>}
                      </button>
                    ))}
                 </div>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="text" placeholder="Search deliveries..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-600/10" />
                 </div>
              </div>
              <table className="w-full text-sm">
                 <thead className="bg-slate-50/50 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-8 py-4 text-left">Tracking Code</th>
                      <th className="px-8 py-4 text-left">Customer</th>
                      <th className="px-8 py-4 text-left">Rider</th>
                      <th className="px-8 py-4 text-left">Status</th>
                      <th className="px-8 py-4 text-left">Created At</th>
                      <th className="px-8 py-4 text-right"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {requests.map(r => (
                      <tr 
                        key={r.delivery_request_id} 
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                        onClick={() => { setSelectedRequest(r); setCurrentView('details'); }}
                      >
                        <td className="px-8 py-5 font-mono font-bold text-blue-700">{r.tracking_code}</td>
                        <td className="px-8 py-5">
                          <p className="font-bold">{r.customer_name}</p>
                          <p className="text-[11px] text-slate-400">{r.customer_phone}</p>
                        </td>
                        <td className="px-8 py-5 text-slate-500 font-medium">{r.rider_name || '—'}</td>
                        <td className="px-8 py-5"><StatusPill status={r.current_status} /></td>
                        <td className="px-8 py-5 text-slate-400">Today, 10:10 AM</td>
                        <td className="px-8 py-5 text-right"><ChevronRight size={18} className="text-slate-300 ml-auto" /></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>
          )}

          {currentView === 'details' && selectedRequest && (
            <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8">
               <div className="col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-start mb-8">
                        <div>
                           <StatusPill status={selectedRequest.current_status} />
                           <h2 className="text-2xl font-black mt-2">{selectedRequest.tracking_code}</h2>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">
                           <Printer size={16} /> Print
                        </button>
                     </div>

                     <div className="grid grid-cols-2 gap-10">
                        <div>
                           <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest mb-4">Customer Info</p>
                           <div className="space-y-4">
                              <div className="flex gap-3">
                                 <Users className="text-blue-600 shrink-0" size={20} />
                                 <div>
                                    <p className="font-bold leading-tight">{selectedRequest.customer_name}</p>
                                    <p className="text-sm text-slate-500">{selectedRequest.customer_phone}</p>
                                 </div>
                              </div>
                              <div className="flex gap-3">
                                 <MapPin className="text-blue-600 shrink-0" size={20} />
                                 <p className="text-sm text-slate-600 leading-relaxed">{selectedRequest.customer_address}</p>
                              </div>
                           </div>
                        </div>
                        <div>
                           <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest mb-4">Item Details</p>
                           <div className="bg-slate-50 p-4 rounded-xl">
                              <p className="text-sm font-bold text-slate-900">{selectedRequest.item_description}</p>
                              <div className="mt-3 flex justify-between text-[11px] font-bold">
                                 <span className="text-slate-400">Request ID: #24</span>
                                 <span className="text-blue-600">Standard Delivery</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                     <h3 className="font-bold mb-6">Status History</h3>
                     <div className="space-y-0">
                        {[
                          { label: 'Delivered', time: '10:24 AM', user: 'Peter Maina (Rider)', done: true },
                          { label: 'Picked Up', time: '09:45 AM', user: 'Peter Maina (Rider)', done: true },
                          { label: 'Assigned', time: '09:15 AM', user: 'Mary W. (Dispatcher)', done: true },
                          { label: 'Request Created', time: '09:10 AM', user: 'Jane Njeri (Retailer)', done: true }
                        ].map((step, idx) => (
                           <div key={idx} className="flex gap-6 group">
                              <div className="flex flex-col items-center">
                                 <div className={`w-3 h-3 rounded-full ${step.done ? 'bg-blue-600' : 'bg-slate-200'} z-10`}></div>
                                 {idx !== 3 && <div className="w-[2px] h-16 bg-slate-100"></div>}
                              </div>
                              <div className="pb-8">
                                 <p className="font-bold text-sm leading-none">{step.label}</p>
                                 <p className="text-xs text-slate-400 mt-1">Today, {step.time}</p>
                                 <p className="text-[11px] text-slate-500 mt-2 font-medium italic">by {step.user}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                     <p className="text-[11px] font-bold uppercase text-slate-400 tracking-widest mb-6">Proof of Delivery</p>
                     <div className="bg-white border-2 border-slate-50 p-4 rounded-xl mb-4 mx-auto w-48 h-48 flex items-center justify-center">
                        {/* Mock QR Code */}
                        <div className="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                           {Array.from({length: 36}).map((_, i) => (
                              <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                           ))}
                        </div>
                     </div>
                     <p className="text-[10px] text-slate-400">Scanned at 10:24 AM</p>
                     <button className="mt-6 text-blue-600 text-xs font-bold uppercase tracking-wider hover:underline">View Fullscreen</button>
                  </div>
                  
                  <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                     <p className="text-[10px] font-bold uppercase opacity-60 tracking-widest mb-4">Assigned Rider</p>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl">👤</div>
                        <div>
                           <p className="font-bold">Peter Maina</p>
                           <p className="text-xs opacity-70">0788 123 456</p>
                        </div>
                     </div>
                     <button className="w-full mt-6 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold">Contact Rider</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Slide-over New Request Panel (matches Screenshot 2) */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !creating && setShowNewRequestModal(false)}></div>
           <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-8">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-xl font-black">New Delivery Request</h2>
                 <button onClick={() => !creating && setShowNewRequestModal(false)} className="text-slate-300 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-6 flex-1 overflow-y-auto">
                 {createErrors._general && (
                   <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                     <p className="text-xs text-red-600 font-bold leading-tight">{createErrors._general}</p>
                   </div>
                 )}
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Name *</label>
                    <input
                      type="text"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-600/10 outline-none"
                      placeholder="e.g. Faith Njeri"
                    />
                    {createErrors.customer_name && <p className="text-[11px] text-red-500 font-semibold mt-1">{createErrors.customer_name}</p>}
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Phone *</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="tel"
                        value={form.customer_phone}
                        onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                        placeholder="0712 345 678"
                      />
                    </div>
                    {createErrors.customer_phone && <p className="text-[11px] text-red-500 font-semibold mt-1">{createErrors.customer_phone}</p>}
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Delivery Address *</label>
                    <textarea
                      rows={3}
                      value={form.customer_address}
                      onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none resize-none"
                      placeholder="House No, Street, Area..."
                    ></textarea>
                    {createErrors.customer_address && <p className="text-[11px] text-red-500 font-semibold mt-1">{createErrors.customer_address}</p>}
                 </div>
                 <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Item Description *</label>
                    <input
                      type="text"
                      value={form.item_description}
                      onChange={(e) => setForm({ ...form, item_description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none"
                      placeholder="e.g. Wireless Earphones (1pc)"
                    />
                    {createErrors.item_description && <p className="text-[11px] text-red-500 font-semibold mt-1">{createErrors.item_description}</p>}
                 </div>

                 <div className="pt-6">
                    <button
                      type="submit"
                      disabled={creating}
                      className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      {creating ? 'Creating...' : 'Create Delivery Request'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { resetForm(); setShowNewRequestModal(false); }}
                      disabled={creating}
                      className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 mt-2 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}