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
    <div className="relative h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Background Map */}
      <div className="absolute inset-0 z-0">
        <DashboardMap devices={devices} />
      </div>

      {/* Top Status Card */}
      <div className="absolute top-0 left-0 w-full p-4 z-20 pointer-events-none">
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 pointer-events-auto flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${selectedDevice?.status === 'Active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                {selectedDevice?.status === 'Active' ? 'System Protected' : 'System Vulnerable'}
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                {selectedDevice?.model || 'Scanning for devices...'} • {selectedDevice?.status === 'Active' ? 'Real-time Tracking' : 'Attention Required'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setSidebarOpen(!sidebarOpen)}
               className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors"
             >
               <User className="w-6 h-6" />
             </button>
          </div>
        </motion.div>
      </div>

      {/* Floating Sidebar (Profile/Logout) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[70] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-xl font-black uppercase tracking-tight">Profile</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 space-y-8">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/20">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-black text-slate-900 truncate">{user.email?.split('@')[0]}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">Active User</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-2">Devices In Fleet</h3>
                  <div className="space-y-3">
                    {devices.map(device => (
                      <button 
                        key={device.id}
                        onClick={() => {
                          setSelectedDevice(device);
                          setSidebarOpen(false);
                        }}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 ${selectedDevice?.id === device.id ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'}`}
                      >
                        <Smartphone className="w-5 h-5" />
                        <span className="text-xs font-black truncate">{device.model}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="mt-auto w-full h-14 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 hover:scale-105 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout Account
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Action Grid (Mimicking Android Sheet) */}
      <div className="absolute bottom-0 left-0 w-full p-4 z-20 pointer-events-none">
        <motion.div 
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/50 p-6 pointer-events-auto"
        >
          {/* Sheet Handle */}
          <div className="w-12 h-1.5 bg-slate-200 mx-auto rounded-full mb-6" />

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <ActionButton icon={<Volume2 />} label="Siren" onClick={() => sendCommand(selectedDevice.id, 'ALARM')} color="bg-blue-50 text-blue-600 border-blue-100" />
            <ActionButton icon={<Lock />} label="Lockdown" onClick={() => sendCommand(selectedDevice.id, 'LOCK')} color="bg-orange-50 text-orange-600 border-orange-100" />
            <ActionButton icon={<MapPin />} label="Locate" onClick={() => sendCommand(selectedDevice.id, 'LOCATE')} color="bg-green-50 text-green-600 border-green-100" />
            <ActionButton icon={<Activity />} label="Track" onClick={() => sendCommand(selectedDevice.id, 'TRACK')} color="bg-purple-50 text-purple-600 border-purple-100" />
            <ActionButton icon={<X />} label="Wipe" onClick={() => sendCommand(selectedDevice.id, 'WIPE')} color="bg-red-50 text-red-600 border-red-100" />
            <ActionButton icon={<Power />} label="Fake Off" onClick={() => sendCommand(selectedDevice.id, 'FAKE_POWER')} color="bg-slate-100 text-slate-900 border-slate-200" />
            <ActionButton icon={<Volume2 />} label="Speak" onClick={() => sendCommand(selectedDevice.id, 'SPEAK')} color="bg-indigo-50 text-indigo-600 border-indigo-100" />
            <ActionButton icon={<Shield />} label="Found" onClick={() => sendCommand(selectedDevice.id, 'FOUND')} color="bg-emerald-50 text-emerald-600 border-emerald-100" />
            <ActionButton icon={<Smartphone />} label="Nearby" onClick={() => sendCommand(selectedDevice.id, 'SCAN_NEARBY')} color="bg-black text-red-600 border-red-900/30" />
            <ActionButton icon={<Database />} label="Network" onClick={() => sendCommand(selectedDevice.id, 'SCAN_NETWORK')} color="bg-amber-50 text-amber-600 border-amber-100" />
            <ActionButton icon={<AlertTriangle />} label="Call Signal" onClick={() => sendCommand(selectedDevice.id, 'CALL_SIGNAL')} color="bg-pink-50 text-pink-600 border-pink-100" />
            <ActionButton icon={<RotateCcw />} label="Reset" onClick={() => sendCommand(selectedDevice.id, 'RESET')} color="bg-slate-50 text-slate-400 border-slate-100" />
          </div>
        </motion.div>
      </div>

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

function ActionButton({ icon, label, onClick, color }: { icon: any, label: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${color} shadow-sm group`}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">{label}</span>
    </button>
  );
}
