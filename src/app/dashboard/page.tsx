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
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      fetchData();
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    });

    const devicesSubscription = supabase
      .channel('public:devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(devicesSubscription);
    };
  }, []);

  async function fetchData() {
    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id)
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

  async function sendCommand(deviceId: string, command: string) {
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
      alert(`Command ${command} deployed successfully.`);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  }

  const parseStatus = (status: string) => {
    if (!status) return { mainStatus: 'Secure', intelligence: null };
    if (status.includes('HYBRID-OSINT-IDENTIFICATION') || status.includes('IDENTITY & SIGNALS:')) {
      const parts = status.split('\n');
      const intelligence: any = { wifi: [], bt: null, tower: [], battery: null, address: null };
      parts.forEach(line => {
        if (line.startsWith('Address:')) intelligence.address = line.replace('Address:', '').trim();
        if (line.includes('WiFi:')) intelligence.wifi.push(line.replace('WiFi:', '').trim());
        if (line.includes('Tower:')) intelligence.tower.push(line.replace('Tower:', '').trim());
        if (line.includes('Battery:')) intelligence.battery = line.replace('Battery:', '').trim();
        if (line.includes('BLE Waves:')) intelligence.bt = line.replace('BLE Waves:', '').trim();
      });
      return { mainStatus: 'Emergency Tracking', intelligence };
    }
    return { mainStatus: status, intelligence: null };
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-[70] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight uppercase">Anti-Theft <span className="text-red-600">Pro</span></span>
          </div>

          <nav className="flex-1 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold">
              <LayoutDashboard className="w-5 h-5" />
              My Dashboard
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all rounded-xl font-bold">
              <Bell className="w-5 h-5" />
              Alert Logs
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all rounded-xl font-bold">
              <MapPin className="w-5 h-5" />
              Geo-Fencing
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all rounded-xl font-bold">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 truncate">Secured User</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all rounded-xl font-bold"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 relative z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-slate-50 rounded-lg lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-black tracking-tight text-slate-900 hidden sm:block">Personal Security Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-green-600">System Hardened</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Section: Devices */}
            <div className="xl:col-span-4 space-y-8">
              
              {/* Device Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Managed</p>
                  <p className="text-3xl font-black text-slate-900">{devices.length}</p>
                </div>
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Active Tracker</p>
                  <p className="text-3xl font-black text-red-600">{devices.filter(d => d.status !== 'Active').length}</p>
                </div>
              </div>

              {/* Device List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Device List</h3>
                  <div className="h-1 flex-1 bg-slate-100 mx-4 rounded-full" />
                </div>
                <div className="space-y-3">
                  {loading ? (
                    Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-white border border-slate-200 rounded-3xl animate-pulse" />)
                  ) : (
                    devices.map((device) => {
                      const { mainStatus } = parseStatus(device.status);
                      const isActive = selectedDevice?.id === device.id;
                      return (
                        <motion.button
                          key={device.id}
                          onClick={() => setSelectedDevice(device)}
                          className={`w-full p-5 rounded-[2rem] border transition-all text-left flex items-center gap-4 ${
                            isActive ? 'bg-white border-red-200 shadow-lg shadow-red-600/5 ring-2 ring-red-500/10' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-slate-100 text-slate-400'}`}>
                            <Smartphone className="w-6 h-6" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h4 className="font-black text-sm text-slate-900 truncate">{device.model || 'Device Node'}</h4>
                            <div className="flex items-center gap-1.5">
                               <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{mainStatus}</p>
                            </div>
                          </div>
                          <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? 'rotate-90 text-red-600' : 'text-slate-300'}`} />
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Section: Intelligence & Map */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* Control Panel */}
              <AnimatePresence mode="wait">
                {selectedDevice ? (
                  <motion.div 
                    key={selectedDevice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                           <h3 className="text-2xl font-black text-slate-900">{selectedDevice.model}</h3>
                           <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 border border-slate-200">
                             {selectedDevice.id.slice(0, 12)}
                           </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase tracking-tight">
                           <div className="flex items-center gap-1.5">
                             <MapPin className="w-4 h-4" />
                             {selectedDevice.current_lat?.toFixed(5)}, {selectedDevice.current_lng?.toFixed(5)}
                           </div>
                           <div className="flex items-center gap-1.5">
                             <Activity className="w-4 h-4" />
                             Last Seen: {selectedDevice.last_seen ? formatDistanceToNow(new Date(selectedDevice.last_seen)) : 'N/A'} ago
                           </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button onClick={() => sendCommand(selectedDevice.id, 'ALARM')} className="h-12 px-6 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/20 hover:scale-105 transition-all flex items-center gap-2">
                          <Volume2 className="w-4 h-4" /> Siren
                        </button>
                        <button onClick={() => sendCommand(selectedDevice.id, 'LOCK')} className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-105 transition-all flex items-center gap-2">
                          <Lock className="w-4 h-4" /> Lock
                        </button>
                        <button onClick={() => sendCommand(selectedDevice.id, 'FAKE_POWER')} className="h-12 px-6 border border-slate-200 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
                          <Power className="w-4 h-4 text-red-500" /> Fake Off
                        </button>
                        <button onClick={() => sendCommand(selectedDevice.id, 'RESET')} className="w-12 h-12 flex items-center justify-center border border-slate-200 text-slate-400 rounded-2xl hover:text-red-600 hover:border-red-100 transition-all">
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-12 bg-white rounded-[2.5rem] border border-slate-200 text-center text-slate-400 font-bold border-dashed">
                    Select a node to initialize intelligence interface
                  </div>
                )}
              </AnimatePresence>

              {/* Map & Intelligence */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 h-[400px] lg:h-[500px] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-4">
                    <DashboardMap devices={devices} />
                 </div>
                 <div className="space-y-8">
                    {/* OSINT Log */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 overflow-hidden">
                       <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                         <Database className="w-4 h-4" /> Signals Intelligence
                       </h4>
                       <div className="space-y-6">
                         {selectedDevice && parseStatus(selectedDevice.status).intelligence ? (
                           <>
                             <div className="space-y-2">
                               <p className="text-[10px] font-black uppercase text-slate-400">Triangulated Location</p>
                               <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] font-bold text-slate-600 leading-relaxed">
                                 {parseStatus(selectedDevice.status).intelligence.address || 'Resolving street-level identity...'}
                               </div>
                             </div>
                             <div className="space-y-2">
                               <p className="text-[10px] font-black uppercase text-slate-400">Environment Signatures</p>
                               <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                 {parseStatus(selectedDevice.status).intelligence.wifi.map((w: string, i: number) => (
                                   <div key={i} className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[9px] font-mono text-slate-500 flex items-center justify-between">
                                      <span className="truncate mr-2">{w}</span>
                                      <span className="text-red-500">Live</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           </>
                         ) : (
                           <div className="py-12 text-center">
                              <Activity className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter leading-tight">Waiting for device encryption keys...</p>
                           </div>
                         )}
                       </div>
                    </div>
                 </div>
              </div>

            </div>
          </div>
        </div>

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
