import { useEffect, useState } from 'react';
import { 
  Truck, 
  History, 
  User, 
  LogOut, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Package, 
  ChevronRight, 
  Navigation,
  QrCode,
  ArrowLeft
} from 'lucide-react';

import type { AuthUser, DeliveryRequest, DeliveryStatus } from '../types';
import { fetchRequests, pollRequests, updateRequestStatus } from '../lib/api';
import { useLogoutFlow } from '../hooks/useLogoutFlow';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';

// --- Shared Theme Components ---

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

const StatusPill = ({ status }: { status: string }) => {
  const styles: any = {
    assigned: "bg-blue-50 text-blue-600 border-blue-100",
    picked_up: "bg-purple-50 text-purple-600 border-purple-100",
    delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || "bg-slate-100 text-slate-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
};

// --- Rider Component Logic ---

const NEXT_ACTION: Partial<Record<DeliveryStatus, { label: string; next: DeliveryStatus }>> = {
  assigned: { label: 'Confirm Picked Up', next: 'picked_up' },
  picked_up: { label: 'Mark as Delivered', next: 'delivered' },
};

export function RiderApp({ user: _user }: { user: AuthUser }) {
  const { confirmOpen, loading: loggingOut, requestLogout, cancelLogout, confirmLogout } = useLogoutFlow();
  const [tasks, setTasks] = useState<DeliveryRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | DeliveryStatus>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests()
      .then(setTasks)
      .catch(() => setSyncError(true))
      .finally(() => setLoading(false));

    // No live push channel from the backend (see lib/api.ts's
    // pollRequests docstring) — a rider needs to notice a new
    // assignment from the dispatcher without refreshing the page, so
    // this polls instead of relying on a stream that doesn't exist.
    return pollRequests(setTasks, { onError: () => setSyncError(true) });
  }, []);

  const selectedTask = tasks.find((t) => t.delivery_request_id === selectedId) ?? null;
  const visible = tasks.filter((t) => (tab === 'all' ? t.current_status !== 'pending' : t.current_status === tab));

  const handleStatusUpdate = async () => {
    if (!selectedTask) return;
    const action = NEXT_ACTION[selectedTask.current_status];
    if (!action) return;

    if (action.next === 'delivered' && !confirming) {
      setConfirming(true);
      return;
    }

    setBusy(true);
    setStatusError(null);
    try {
      await updateRequestStatus(
        selectedTask.delivery_request_id,
        action.next,
        undefined,
        action.next === 'delivered' ? scanCode.trim().toUpperCase() : undefined
      );
      setConfirming(false);
      setScanCode('');
      const updated = await fetchRequests();
      setTasks(updated);
      if (action.next === 'delivered') setSelectedId(null);
    } catch (err) {
      // 422 here almost always means the scan code didn't match
      // tracking_code (see status.php) — surface that inline next to the
      // input instead of an alert() that blocks the whole page.
      setStatusError(err instanceof Error ? err.message : 'Could not update status. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FB] text-slate-900 overflow-hidden">
      {/* Sidebar - Consistent Brand Blue */}
      <aside className="w-64 bg-[#0047BB] flex flex-col p-6 text-white shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-[#0047BB] font-black italic">R</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reflex</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40 mb-4 px-2">Fleet Access</div>
          <NavItem icon={Truck} label="My Deliveries" active />
          <NavItem icon={History} label="History" disabled />
          <NavItem icon={User} label="My Profile" disabled />
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

      {/* Main Content Pane */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left List Pane */}
        <div className={`w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 ${selectedTask ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">My Deliveries</h2>
              {syncError && (
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Sync issue</span>
              )}
            </div>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
               {(['all', 'assigned', 'picked_up'] as const).map(t => (
                 <button 
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${tab === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {t}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="p-10 text-center animate-pulse text-slate-300 font-bold uppercase tracking-widest text-xs">Loading Tasks...</div>
            ) : visible.map(task => (
              <button 
                key={task.delivery_request_id}
                onClick={() => { setSelectedId(task.delivery_request_id); setConfirming(false); setStatusError(null); }}
                className={`w-full text-left p-6 transition-all group hover:bg-blue-50/30 ${selectedId === task.delivery_request_id ? 'bg-blue-50 border-r-4 border-blue-600' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                   <StatusPill status={task.current_status} />
                   <p className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-blue-400">{task.tracking_code}</p>
                </div>
                <p className="font-black text-slate-900 mb-1">{task.customer_name}</p>
                <p className="text-xs text-slate-400 line-clamp-1">{task.customer_address}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="flex-1 bg-[#F8F9FB] overflow-y-auto">
          {!selectedTask ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <Package size={48} strokeWidth={1} className="mb-4" />
               <p className="font-bold uppercase tracking-[0.2em] text-[11px]">Select a task to start</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto p-12">
               {/* Header Info */}
               <div className="mb-10">
                  <button onClick={() => setSelectedId(null)} className="lg:hidden flex items-center gap-2 text-blue-600 font-bold text-sm mb-6">
                    <ArrowLeft size={16} /> Back to List
                  </button>
                  <div className="flex justify-between items-end">
                    <div>
                       <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-2">Ongoing Delivery</p>
                       <h2 className="text-3xl font-black text-slate-900">{selectedTask.customer_name}</h2>
                    </div>
                    <p className="font-mono font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border border-slate-100">{selectedTask.tracking_code}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-8">
                  {/* Stepper Logic Card */}
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Delivery Progress</h3>
                     
                     <div className="space-y-0">
                        {[
                          { key: 'assigned', label: 'Order Assigned', desc: 'Rider confirmed for pickup' },
                          { key: 'picked_up', label: 'Item Picked Up', desc: 'In transit to customer' },
                          { key: 'delivered', label: 'Completed', desc: 'Package dropped off' }
                        ].map((step, idx) => {
                          const statusList: DeliveryStatus[] = ['assigned', 'picked_up', 'delivered'];
                          const currentIdx = statusList.indexOf(selectedTask.current_status);
                          const isDone = idx < currentIdx || selectedTask.current_status === 'delivered';
                          const isCurrent = idx === currentIdx && selectedTask.current_status !== 'delivered';

                          return (
                            <div key={step.key} className="flex gap-6 group">
                              <div className="flex flex-col items-center">
                                 <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : isCurrent ? 'bg-white border-blue-600 text-blue-600' : 'bg-white border-slate-100 text-slate-200'}`}>
                                    {isDone ? <CheckCircle2 size={14} /> : <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-blue-600' : 'bg-slate-200'}`}></div>}
                                 </div>
                                 {idx !== 2 && <div className={`w-[2px] h-12 ${isDone ? 'bg-emerald-100' : 'bg-slate-50'}`}></div>}
                              </div>
                              <div className="pb-8">
                                 <p className={`font-black text-sm transition-colors ${isDone || isCurrent ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</p>
                                 <p className="text-[11px] text-slate-400 mt-1">{step.desc}</p>
                              </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>

                  {/* Destination Quick-Action Card */}
                  <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-4">
                           <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                              <MapPin size={24} />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Destination Address</p>
                              <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedTask.customer_address}</p>
                           </div>
                        </div>
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(selectedTask.customer_address)}`}
                          target="_blank"
                          className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                        >
                          <Navigation size={20} />
                        </a>
                     </div>
                     <div className="flex gap-4 pt-6 border-t border-slate-50">
                        <div className="flex-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Contact</p>
                           <a href={`tel:${selectedTask.customer_phone}`} className="flex items-center gap-2 text-sm font-black text-slate-900 hover:text-blue-600 transition-colors">
                              <Phone size={14} /> {selectedTask.customer_phone}
                           </a>
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Item Type</p>
                           <p className="text-sm font-bold text-slate-700">{selectedTask.item_description}</p>
                        </div>
                     </div>
                  </div>

                  {/* Contextual Action Button */}
                  <div className="pt-4">
                     {selectedTask.current_status !== 'delivered' && (
                        confirming ? (
                          <div className="bg-white p-8 rounded-2xl border-2 border-blue-600 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                   <QrCode size={20} />
                                </div>
                                <div>
                                   <h4 className="font-black text-lg">Verify Delivery</h4>
                                   <p className="text-xs text-slate-400">Ask customer for the code on their receipt</p>
                                </div>
                             </div>
                             
                             <input 
                               type="text" 
                               value={scanCode}
                               onChange={(e) => { setScanCode(e.target.value.toUpperCase()); setStatusError(null); }}
                               placeholder="ENTER VERIFICATION CODE" 
                               className={`w-full text-center py-5 bg-slate-50 border rounded-xl text-xl font-mono font-black tracking-[0.3em] outline-none focus:bg-white transition-all ${statusError ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-blue-600'}`}
                               autoFocus
                             />
                             {statusError && (
                               <p className="text-xs text-red-500 font-bold text-center -mt-3">{statusError}</p>
                             )}

                             <div className="flex gap-3">
                                <button 
                                  onClick={handleStatusUpdate}
                                  disabled={!scanCode || busy}
                                  className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {busy ? 'Verifying...' : 'Finish Delivery'}
                                </button>
                                <button onClick={() => { setConfirming(false); setStatusError(null); }} className="px-6 py-4 text-slate-400 font-bold hover:text-slate-600">Cancel</button>
                             </div>
                          </div>
                        ) : (
                          <button 
                            onClick={handleStatusUpdate}
                            disabled={busy}
                            className="w-full py-5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black uppercase tracking-[0.1em] shadow-sm hover:bg-blue-600 hover:text-white transition-all group"
                          >
                            {busy ? 'Updating...' : NEXT_ACTION[selectedTask.current_status]?.label}
                            <ChevronRight size={18} className="inline ml-2 transition-transform group-hover:translate-x-1" />
                          </button>
                        )
                     )}
                     
                     {selectedTask.current_status === 'delivered' && (
                        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
                           <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                           <p className="text-emerald-700 font-black uppercase tracking-widest text-xs">Delivery Successfully Completed</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}