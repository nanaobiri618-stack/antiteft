'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  MapPin, 
  Smartphone, 
  AlertTriangle, 
  Lock, 
  Volume2, 
  RotateCcw, 
  Database,
  Activity,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Settings,
  Bell,
  Menu,
  X,
  User,
  Power
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-3xl border border-slate-200 flex items-center justify-center text-slate-400">Initializing OSINT Map...</div>
});

export default function Dashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gridState, setGridState] = useState<'min' | 'mid' | 'max'>('mid');
  const [intelOpen, setIntelOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      fetchData(session.user.id);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
        fetchData(session.user.id);
      }
    });

    const devicesSubscription = supabase
      .channel('public:devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload: any) => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(devicesSubscription);
    };
  }, []);

  async function fetchData(userId?: string) {
    const idToUse = userId || user?.id;
    if (!idToUse) return;

    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', idToUse)
        .order('last_seen', { ascending: false });

      if (devicesError) throw devicesError;
      setDevices(devicesData || []);
      
      if (devicesData && devicesData.length > 0 && !selectedDevice) {
        setSelectedDevice(devicesData[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const [commandLoading, setCommandLoading] = useState<string | null>(null);

  async function sendCommand(deviceId: string, command: string) {
    if (!deviceId) return;
    setCommandLoading(command);
    try {
      const updates: any = { pending_command: command };
      if (['ALARM', 'LOCK', 'FAKE_POWER', 'SPEAK'].includes(command)) {
        updates.status = 'Lost';
      }

      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId);

      if (error) throw error;
      // Success feedback
    } catch (error) {
      console.error('Error sending command:', error);
      alert('Failed to transmit command. Check connection.');
    } finally {
      setCommandLoading(null);
    }
  }

  function parseStatus(status: string) {
    if (!status) return { mainStatus: 'Unknown', intelligence: null };
    try {
      if (status.startsWith('{')) {
        const data = JSON.parse(status);
        return { 
          mainStatus: data.status || 'Active', 
          intelligence: data 
        };
      }
    } catch (e) {}
    return { mainStatus: status, intelligence: null };
  }

  if (loading) return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center gap-6">
      <div className="relative">
        <Shield className="w-16 h-16 text-red-600 animate-pulse" />
        <div className="absolute inset-0 bg-red-600/20 blur-2xl rounded-full" />
      </div>
      <div className="space-y-2 text-center">
        <p className="text-white font-black uppercase tracking-[0.2em] text-sm">Initializing Defense Grid</p>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Securing connection to master node...</p>
      </div>
    </div>
  );

  if (!user) return null;

  const sheetVariants = {
    min: { y: 'calc(100% - 80px)' },
    mid: { y: '40%' },
    max: { y: '0%' }
  };

  return (
    <div className="relative h-screen w-screen bg-zinc-950 overflow-hidden font-sans">
      
      {/* Background Map */}
      <div className="absolute inset-0 z-0 h-full w-full">
        <DashboardMap devices={devices} selectedDeviceId={selectedDevice?.id} />
      </div>

      {/* Top Status Card */}
      <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-20 pointer-events-none">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 p-5 pointer-events-auto flex items-center justify-between ring-1 ring-black/5"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl ${selectedDevice?.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 shadow-inner'}`}>
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {selectedDevice?.status === 'Active' ? 'System Protected' : 'System Vulnerable'}
                </h1>
                <div className={`w-2 h-2 rounded-full ${selectedDevice?.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                {selectedDevice?.model || 'Scanning Nodes...'} • {selectedDevice?.status === 'Active' ? 'Live Encryption' : 'Attention Required'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
             <button 
               onClick={() => setIntelOpen(true)}
               className="h-11 px-5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/20"
             >
               View Intel
             </button>
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-all border border-slate-100"
             >
               <User className="w-5 h-5" />
             </button>
          </div>
        </motion.div>
      </div>

      {/* Intelligence Overlay (OSINT Report) */}
      <AnimatePresence>
        {intelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">Intelligence Report</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Node Telemetry</p>
                  </div>
                </div>
                <button onClick={() => setIntelOpen(false)} className="p-3 hover:bg-white rounded-2xl shadow-sm transition-all border border-transparent hover:border-slate-100">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
                <div className="font-mono text-[11px] text-slate-600 leading-relaxed">
                  {selectedDevice?.status ? (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Latitude</p>
                             <p className="text-sm font-black text-slate-900">{selectedDevice.current_lat || 'N/A'}</p>
                          </div>
                          <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Longitude</p>
                             <p className="text-sm font-black text-slate-900">{selectedDevice.current_lng || 'N/A'}</p>
                          </div>
                       </div>
                       <div className="p-6 bg-zinc-900 text-zinc-100 rounded-[2.5rem] shadow-xl">
                          <p className="text-[9px] font-black text-zinc-500 uppercase mb-4 tracking-[0.2em]">Raw OSINT Data Feed</p>
                          <pre className="whitespace-pre-wrap text-[10px] leading-relaxed opacity-80">
                            {selectedDevice.status}
                          </pre>
                       </div>
                    </div>
                  ) : (
                    <div className="text-center py-24">
                      <Activity className="w-16 h-16 text-slate-100 mx-auto mb-6 animate-pulse" />
                      <p className="font-black text-slate-300 uppercase tracking-[0.2em] text-xs">Awaiting decryption keys...</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Live Feed Active</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sidebar (Profile/Logout) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-[120] p-8 sm:p-10 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Account</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Management Console</p>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 space-y-10 overflow-y-auto custom-scrollbar pr-2">
                <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-red-600 to-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/20">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-lg font-black text-slate-900 truncate tracking-tight">{user.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Master Operator</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Defense Nodes</h3>
                    <div className="h-0.5 flex-1 bg-slate-50 mx-4" />
                    <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{devices.length}</span>
                  </div>
                  <div className="space-y-3">
                    {devices.map(device => (
                      <button 
                        key={device.id}
                        onClick={() => {
                          setSelectedDevice(device);
                          setSidebarOpen(false);
                        }}
                        className={`w-full p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-left group ${selectedDevice?.id === device.id ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-50 text-slate-600 hover:border-slate-100 hover:bg-slate-50'}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedDevice?.id === device.id ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}`}>
                          <Smartphone className="w-6 h-6" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="block text-sm font-black truncate tracking-tight">{device.model || 'Unknown Device'}</span>
                          <span className="block text-[9px] font-bold uppercase tracking-widest opacity-60">
                            ID: {device.id.slice(0, 8)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="mt-8 w-full h-16 bg-zinc-900 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"
              >
                <LogOut className="w-5 h-5" />
                Terminate Session
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Map Zoom Controls */}
      <div className="absolute bottom-1/2 translate-y-[-50%] right-6 flex flex-col gap-2 z-20">
         <button className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center text-slate-900 hover:scale-110 transition-all active:scale-90 font-black text-xl">
           +
         </button>
         <button className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 flex items-center justify-center text-slate-900 hover:scale-110 transition-all active:scale-90 font-black text-xl">
           −
         </button>
      </div>

      {/* Draggable/Collapsible Bottom Action Grid */}
      <motion.div 
        variants={sheetVariants}
        initial="mid"
        animate={gridState}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-0 z-30 flex flex-col pointer-events-none"
      >
        <div className="flex-1" />
        
        <div className="w-full bg-white/90 backdrop-blur-2xl rounded-t-[4rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-white/50 p-6 sm:p-8 pointer-events-auto flex flex-col h-[80vh]">
          <div className="flex flex-col items-center gap-2 mb-8 cursor-pointer group" onClick={() => setGridState(gridState === 'max' ? 'mid' : gridState === 'mid' ? 'max' : 'mid')}>
            <div className="w-14 h-1.5 bg-slate-200 group-hover:bg-slate-300 rounded-full transition-colors" />
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] group-hover:text-red-500 transition-colors">
              {gridState === 'max' ? 'Minimize Dashboard' : 'Maximize Dashboard'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
            <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              <ActionButton icon={<Volume2 className="w-8 h-8" />} label="Siren" onClick={() => sendCommand(selectedDevice?.id, 'ALARM')} desc="Trigger panic alarm" isLoading={commandLoading === 'ALARM'} color="bg-white hover:bg-blue-600 hover:text-white text-blue-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<Lock className="w-8 h-8" />} label="Lockdown" onClick={() => sendCommand(selectedDevice?.id, 'LOCK')} desc="Remote device lock" isLoading={commandLoading === 'LOCK'} color="bg-white hover:bg-orange-600 hover:text-white text-orange-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<MapPin className="w-8 h-8" />} label="Locate" onClick={() => sendCommand(selectedDevice?.id, 'LOCATE')} desc="Triangulate node" isLoading={commandLoading === 'LOCATE'} color="bg-white hover:bg-emerald-600 hover:text-white text-emerald-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<Activity className="w-8 h-8" />} label="Track" onClick={() => sendCommand(selectedDevice?.id, 'TRACK')} desc="Continuous logging" isLoading={commandLoading === 'TRACK'} color="bg-white hover:bg-purple-600 hover:text-white text-purple-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<X className="w-8 h-8" />} label="Wipe" onClick={() => sendCommand(selectedDevice?.id, 'WIPE')} desc="Purge device data" isLoading={commandLoading === 'WIPE'} color="bg-white hover:bg-red-600 hover:text-white text-red-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<Power className="w-8 h-8" />} label="Fake Off" onClick={() => sendCommand(selectedDevice?.id, 'FAKE_POWER')} desc="Simulate shutdown" isLoading={commandLoading === 'FAKE_POWER'} color="bg-white hover:bg-zinc-900 hover:text-white text-zinc-900 border-slate-100 shadow-sm" />
              <ActionButton icon={<Volume2 className="w-8 h-8" />} label="Speak" onClick={() => sendCommand(selectedDevice?.id, 'SPEAK')} desc="Voice transmission" isLoading={commandLoading === 'SPEAK'} color="bg-white hover:bg-indigo-600 hover:text-white text-indigo-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<Shield className="w-8 h-8" />} label="Found" onClick={() => sendCommand(selectedDevice?.id, 'FOUND')} desc="Clear status logs" isLoading={commandLoading === 'FOUND'} color="bg-white hover:bg-teal-600 hover:text-white text-teal-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<Smartphone className="w-8 h-8" />} label="Nearby" onClick={() => sendCommand(selectedDevice?.id, 'SCAN_NEARBY')} desc="Bluetooth scan" isLoading={commandLoading === 'SCAN_NEARBY'} color="bg-white hover:bg-pink-600 hover:text-white text-pink-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<Database className="w-8 h-8" />} label="Network" onClick={() => sendCommand(selectedDevice?.id, 'SCAN_NETWORK')} desc="Analyze carriers" isLoading={commandLoading === 'SCAN_NETWORK'} color="bg-white hover:bg-amber-600 hover:text-white text-amber-600 border-amber-100 shadow-sm" />
              <ActionButton icon={<AlertTriangle className="w-8 h-8" />} label="Signal" onClick={() => sendCommand(selectedDevice?.id, 'CALL_SIGNAL')} desc="Force tower ping" isLoading={commandLoading === 'CALL_SIGNAL'} color="bg-white hover:bg-rose-600 hover:text-white text-rose-600 border-slate-100 shadow-sm" />
              <ActionButton icon={<RotateCcw className="w-8 h-8" />} label="Reset" onClick={() => sendCommand(selectedDevice?.id, 'RESET')} desc="Soft node reboot" isLoading={commandLoading === 'RESET'} color="bg-white hover:bg-slate-400 hover:text-white text-slate-400 border-slate-100 shadow-sm" />
            </div>
          </div>

          <div className="flex justify-center pb-8">
             <button 
               onClick={() => setGridState(gridState === 'min' ? 'mid' : 'min')}
               className="px-8 py-3 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-red-500 transition-all hover:bg-white shadow-sm"
             >
               {gridState === 'min' ? 'Expand Controls' : 'Hide Dashboard'}
             </button>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .leaflet-container {
          background: #f8fafc;
        }
      `}</style>
    </div>
  );
}

function ActionButton({ icon, label, onClick, color, desc, isLoading }: { icon: any, label: string, onClick: () => void, color: string, desc: string, isLoading?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={isLoading}
      className={`flex flex-col items-center justify-center gap-3 p-6 sm:p-8 rounded-[2.5rem] border transition-all hover:scale-[1.03] active:scale-95 ${color} group relative overflow-hidden ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="absolute inset-0 bg-current opacity-0 group-active:opacity-5 transition-opacity" />
      <div className="relative z-10">
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
      </div>
      <div className="text-center relative z-10">
        <span className="block text-xs font-black uppercase tracking-widest mb-1">{label}</span>
        <span className="block text-[8px] font-bold uppercase tracking-tight opacity-40 group-hover:opacity-60 transition-opacity">
          {isLoading ? 'Transmitting...' : desc}
        </span>
      </div>
    </button>
  );
}
