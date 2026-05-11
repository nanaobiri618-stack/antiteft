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
  Trash2,
  ChevronRight
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';

const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-zinc-900 animate-pulse rounded-2xl border border-white/10 flex items-center justify-center">Loading Map...</div>
});

export default function Dashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const targetPhones = ["0540720479", "0505940530", "0505489304"];

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const devicesSubscription = supabase
      .channel('public:devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload) => {
        console.log('Device change detected:', payload);
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(devicesSubscription);
    };
  }, []);

  async function fetchData() {
    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (devicesError) throw devicesError;
      if (profilesError) throw profilesError;

      setDevices(devicesData || []);
      setProfiles(profilesData || []);
      
      if (devicesData && devicesData.length > 0 && !selectedDevice) {
        setSelectedDevice(devicesData[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendCommand(deviceId: string, command: string) {
    try {
      const updates: any = { pending_command: command };
      if (command === 'ALARM' || command === 'LOCK' || command === 'FAKE_POWER' || command === 'SPEAK') {
        updates.status = 'Lost';
      }

      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId);

      if (error) throw error;
      alert(`Command ${command} sent to device!`);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  }

  // OSINT Parser for technical intelligence
  const parseStatus = (status: string) => {
    if (!status) return { mainStatus: 'Unknown', intelligence: null };
    
    if (status.includes('HYBRID-OSINT-IDENTIFICATION') || status.includes('IDENTITY & SIGNALS:')) {
      const parts = status.split('\n');
      const intelligence: any = {
        wifi: [],
        bt: null,
        tower: [],
        battery: null,
        address: null
      };

      parts.forEach(line => {
        if (line.startsWith('Address:')) intelligence.address = line.replace('Address:', '').trim();
        if (line.includes('WiFi:')) intelligence.wifi.push(line.replace('WiFi:', '').trim());
        if (line.includes('Tower:')) intelligence.tower.push(line.replace('Tower:', '').trim());
        if (line.includes('Battery:')) intelligence.battery = line.replace('Battery:', '').trim();
        if (line.includes('BLE Waves:')) intelligence.bt = line.replace('BLE Waves:', '').trim();
      });

      return { mainStatus: 'Lost Mode Active', intelligence };
    }

    return { mainStatus: status, intelligence: null };
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white font-sans">
      {/* Header */}
      <nav className="p-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 rounded-lg border border-red-500/30">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Anti-Theft Live</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Hardened Recovery Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-zinc-400">Security Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-green-500">System Hardened</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Device List & Target Phones */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">Total</span>
              </div>
              <p className="text-2xl font-bold">{devices.length}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Managed Devices</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Secure</span>
              </div>
              <p className="text-2xl font-bold">{devices.filter(d => d.status === 'Active').length}</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Active Protection</p>
            </div>
          </div>

          {/* Intelligence Log (NEW) */}
          <AnimatePresence>
            {selectedDevice && parseStatus(selectedDevice.status).intelligence && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 bg-red-600/5 rounded-3xl border border-red-500/20 overflow-hidden"
              >
                <h3 className="text-xs font-bold text-red-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Security Intelligence
                </h3>
                <div className="space-y-4">
                   {parseStatus(selectedDevice.status).intelligence?.address && (
                     <div className="space-y-1">
                       <p className="text-[10px] text-zinc-500 uppercase font-bold">Estimated Address</p>
                       <p className="text-xs text-white bg-white/5 p-2 rounded-lg border border-white/5">{parseStatus(selectedDevice.status).intelligence.address}</p>
                     </div>
                   )}
                   {parseStatus(selectedDevice.status).intelligence?.battery && (
                     <div className="flex justify-between items-center text-xs">
                       <span className="text-zinc-500">Device Battery</span>
                       <span className="font-mono text-green-400">{parseStatus(selectedDevice.status).intelligence.battery}</span>
                     </div>
                   )}
                   <div className="space-y-2">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Nearby Signals (Triangulation)</p>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {parseStatus(selectedDevice.status).intelligence.wifi.map((sig: string, i: number) => (
                          <div key={i} className="text-[10px] font-mono text-zinc-400 bg-black/40 p-1.5 rounded border border-white/5">
                            {sig}
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Device List */}
          <div className="flex-1 space-y-3">
            <h3 className="text-sm font-bold text-zinc-400 px-2 uppercase tracking-widest flex items-center justify-between">
              Device Fleet
              <span className="text-[10px] font-normal lowercase bg-white/5 px-2 py-0.5 rounded-full">real-time sync</span>
            </h3>
            <div className="space-y-2">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                ))
              ) : (
                devices.map((device) => {
                  const { mainStatus } = parseStatus(device.status);
                  const isLost = device.status === 'Lost' || mainStatus === 'Lost Mode Active';
                  
                  return (
                    <motion.button
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                        selectedDevice?.id === device.id 
                          ? 'bg-red-600/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`p-3 rounded-xl ${selectedDevice?.id === device.id ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-400'}`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold truncate text-sm">{device.model || 'Unknown Device'}</h4>
                          {isLost && (
                            <AlertTriangle className="w-3 h-3 text-red-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">{mainStatus}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedDevice?.id === device.id ? 'rotate-90 text-red-500' : 'text-zinc-600'}`} />
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Map & Controls */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Map Viewer */}
          <div className="h-[400px] lg:h-[500px] relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
             <DashboardMap devices={devices} />
             
             {/* Map Overlays */}
             <div className="absolute top-4 left-4 z-[1000]">
               <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Live tracking active</span>
               </div>
             </div>

             <AnimatePresence>
               {selectedDevice && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                   className="absolute bottom-6 left-6 right-6 z-[1000] bg-black/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl"
                 >
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">{selectedDevice.model}</h2>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            selectedDevice.status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                          }`}>
                            {parseStatus(selectedDevice.status).mainStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {selectedDevice.current_lat?.toFixed(4)}, {selectedDevice.current_lng?.toFixed(4)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Last Seen: {selectedDevice.last_seen ? formatDistanceToNow(new Date(selectedDevice.last_seen)) : 'never'} ago
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendCommand(selectedDevice.id, 'ALARM')}
                          className="p-4 bg-red-600 rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-red-600/20"
                          title="Trigger Loud Alarm"
                        >
                          <Volume2 className="w-4 h-4" />
                          Siren
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendCommand(selectedDevice.id, 'SPEAK')}
                          className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center gap-2 font-bold text-sm border border-white/10"
                          title="Remote Voice Alert"
                        >
                          <Activity className="w-4 h-4 text-blue-400" />
                          Speak
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendCommand(selectedDevice.id, 'LOCK')}
                          className="p-4 bg-white text-black rounded-2xl flex items-center gap-2 font-bold text-sm shadow-lg shadow-white/20"
                          title="Lock Device Hardware"
                        >
                          <Lock className="w-4 h-4" />
                          Lock
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendCommand(selectedDevice.id, 'FAKE_POWER')}
                          className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl flex items-center gap-2 font-bold text-sm border border-white/5"
                          title="Simulate Power Off to Trap Thief"
                        >
                          <Smartphone className="w-4 h-4 text-red-500" />
                          Fake Off
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => sendCommand(selectedDevice.id, 'RESET')}
                          className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors"
                          title="Restore Secure Status"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Live Status Log */}
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Shield className="w-20 h-20" />
            </div>
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Live Security Feed
            </h4>
            <div className="space-y-3 font-mono text-[11px] relative z-10">
               {devices.slice(0, 5).map((d, i) => {
                 const isLost = d.status?.includes('HYBRID') || d.status === 'Lost';
                 return (
                   <div key={i} className="flex gap-4 text-zinc-400 border-l border-white/10 pl-4 py-1">
                      <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span>
                      <span>
                        Device <span className="text-white font-bold">{d.model || d.id.slice(0, 8)}</span>: 
                        <span className={`ml-2 ${isLost ? 'text-red-500 font-bold' : 'text-green-500'}`}>
                          {isLost ? 'EMERGENCY_TRACKING' : 'SECURE_IDLE'}
                        </span>
                      </span>
                   </div>
                 );
               })}
            </div>
          </div>

        </div>
      </main>

      <footer className="p-8 text-center text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
        Hardened Encryption Layer &copy; {new Date().getFullYear()} Anti-Theft Guard Premium
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.4);
        }
      `}</style>
    </div>
  );
}
