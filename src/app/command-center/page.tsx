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
  Power,
  Mic,
  Wifi,
  Radio,
  Trash2,
  RefreshCw,
  PhoneCall,
  Zap,
  Info,
  ExternalLink,
  History,
  Terminal,
  FileText,
  Server,
  Cloud
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { LocalizationEngine, SensorData } from '@/lib/localization-engine';

const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-3xl border border-slate-200 flex items-center justify-center text-slate-400">Initializing OSINT Map...</div>
});

export default function CommandCenter() {
  const [devices, setDevices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [locationLogs, setLocationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'fleet' | 'profiles' | 'logs' | 'audit'>('fleet');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const isAdmin = ['admin233@gmail.com', 'adminat233@gmail.com'].includes(session.user.email || '');
      if (!isAdmin) {
        router.push('/dashboard');
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

    const logsSubscription = supabase
      .channel('public:location_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_logs' }, (payload) => {
        addAuditLog('DATABASE_INSERT', `New telemetry received for node ${payload.new.device_id.slice(0,8)}`, 'success');
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(devicesSubscription);
      supabase.removeChannel(logsSubscription);
    };
  }, []);

  function addAuditLog(action: string, detail: string, type: 'info' | 'success' | 'warning' | 'danger') {
    setAuditLogs(prev => [{
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      detail,
      type
    }, ...prev].slice(0, 50));
  }

  async function fetchData() {
    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false });

      if (devicesError) throw devicesError;
      setDevices(devicesData || []);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      const { data: logsData, error: logsError } = await supabase
        .from('location_logs')
        .select(`
          *,
          devices (
            model
          )
        `)
        .order('recorded_at', { ascending: false })
        .limit(100);
      
      if (logsError) throw logsError;
      setLocationLogs(logsData || []);

      if (devicesData && devicesData.length > 0) {
        if (!selectedDevice) {
          setSelectedDevice(devicesData[0]);
        } else {
          const updated = devicesData.find(d => d.id === selectedDevice.id);
          if (updated) setSelectedDevice(updated);
        }
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
      addAuditLog('COMMAND_INITIATED', `Deploying ${command} to node ${deviceId.slice(0,8)}...`, 'info');
      
      const updates: any = { pending_command: command };
      if (['ALARM', 'LOCK', 'FAKE_POWER', 'SPEAK', 'LOCATE', 'WIPE', 'SCAN_NEARBY', 'SCAN_NETWORK', 'CALL_SIGNAL'].includes(command)) {
        updates.status = `[SYSTEM] Manual Override: ${command} deployed by Admin`;
      }

      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId);

      if (error) throw error;
      
      addAuditLog('DATABASE_UPDATE', `Device ${deviceId.slice(0,8)} pending_command set to ${command}`, 'success');
    } catch (error) {
      console.error('Error sending command:', error);
      addAuditLog('COMMAND_FAILED', `Failed to deploy ${command}: ${error.message}`, 'danger');
    }
  }

  const parseStatus = (status: string) => {
    if (!status) return { mainStatus: 'Secure', intelligence: null };
    if (status.includes('HYBRID-OSINT-IDENTIFICATION') || status.includes('IDENTITY & SIGNALS:')) {
      const parts = status.split('\n');
      const intelligence: any = { wifi: [], bt: [], tower: [], battery: null, address: null, signals: [] };
      parts.forEach(line => {
        if (line.startsWith('Address:')) intelligence.address = line.replace('Address:', '').trim();
        if (line.includes('WiFi:')) intelligence.wifi.push(line.replace('WiFi:', '').trim());
        if (line.includes('Tower:')) intelligence.tower.push(line.replace('Tower:', '').trim());
        if (line.includes('Battery:')) intelligence.battery = line.replace('Battery:', '').trim();
        if (line.includes('BLE Waves:')) intelligence.bt.push(line.replace('BLE Waves:', '').trim());
        if (line.includes('RSSI=') || line.includes('dBm]')) intelligence.signals.push(line.trim());
      });
      return { mainStatus: 'Emergency Tracking', intelligence };
    }
    return { mainStatus: status, intelligence: null };
  };

  const computeHybridLocation = (device: any) => {
    const { intelligence } = parseStatus(device.status);
    if (!intelligence || intelligence.signals.length === 0) return null;

    const engine = new LocalizationEngine();
    const sensorPoints: SensorData[] = [];

    // Use current lat/lng as anchor if available
    const anchorLat = device.current_lat || 0;
    const anchorLng = device.current_lng || 0;

    intelligence.signals.forEach((s: string) => {
      if (s.includes('dBm]')) {
        try {
          const rssiPart = s.substring(s.lastIndexOf("[") + 1, s.lastIndexOf("dBm"));
          const rssi = parseFloat(rssiPart.trim());
          
          // Spread points based on signal type
          const angle = Math.random() * 2 * Math.PI;
          const distanceOffset = engine.rssiToMeters(rssi) / 111320.0;
          
          sensorPoints.push({
            lat: anchorLat + Math.sin(angle) * distanceOffset,
            lng: anchorLng + Math.cos(angle) * distanceOffset,
            rssi
          });
        } catch (e) {}
      }
    });

    if (sensorPoints.length >= 2) {
      return engine.findPreciseLocation(sensorPoints);
    }
    return null;
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
            <span className="font-black text-xl tracking-tight uppercase text-slate-900">Anti-Theft <span className="text-red-600">Pro</span></span>
          </div>

          <nav className="flex-1 space-y-2">
            <button 
              onClick={() => setActiveTab('fleet')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'fleet' ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              Fleet Overview
            </button>
            <button 
              onClick={() => setActiveTab('profiles')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profiles' ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <User className="w-5 h-5" />
              User Profiles
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'logs' ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <Database className="w-5 h-5" />
              Intelligence Logs
            </button>
            <button 
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'audit' ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              <Terminal className="w-5 h-5" />
              System Audit
            </button>
          </nav>

          <div className="mt-auto pt-8 border-t border-slate-100">
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl mb-4">
              <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-black truncate">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase font-black">Super Admin</p>
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
            <h2 className="text-lg font-black tracking-tight text-slate-900 hidden sm:block">Command & Control Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-green-600">Live Backend Stream</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'fleet' && (
              <motion.div 
                key="fleet"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8"
              >
                {/* Left Section: Devices */}
                <div className="xl:col-span-4 space-y-8">
                  {/* Device Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Total Managed</p>
                      <p className="text-3xl font-black text-slate-900">{devices.length}</p>
                    </div>
                    <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Emergency Track</p>
                      <p className="text-3xl font-black text-red-600">{devices.filter(d => d.status !== 'Active' && d.status !== 'Secure').length}</p>
                    </div>
                  </div>

                  {/* Device List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Node Fleet</h3>
                      <div className="h-px flex-1 bg-slate-100 mx-4" />
                    </div>
                    <div className="space-y-3">
                      {loading ? (
                        Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-white border border-slate-200 rounded-3xl animate-pulse" />)
                      ) : (
                        devices.map((device) => {
                          const { mainStatus } = parseStatus(device.status);
                          const isActive = selectedDevice?.id === device.id;
                          const isPending = !!device.pending_command;
                          
                          return (
                            <motion.button
                              key={device.id}
                              onClick={() => setSelectedDevice(device)}
                              className={`w-full p-5 rounded-[2rem] border transition-all text-left flex items-center gap-4 relative overflow-hidden ${
                                isActive ? 'bg-white border-red-200 shadow-xl shadow-red-600/5 ring-1 ring-red-500/20' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                              }`}
                            >
                              {isPending && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-red-600/20">
                                  <motion.div 
                                    className="h-full bg-red-600"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                  />
                                </div>
                              )}
                              
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-slate-100 text-slate-400'}`}>
                                <Smartphone className="w-6 h-6" />
                                {isPending && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                                    <RefreshCw className="w-2 h-2 text-white animate-spin" />
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <h4 className="font-black text-sm text-slate-900 truncate uppercase tracking-tight">{device.model || 'Unknown Model'}</h4>
                                <div className="flex items-center gap-1.5">
                                   <div className={`w-1.5 h-1.5 rounded-full ${device.status?.includes('Active') || device.status?.includes('Secure') ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                                   <p className={`text-[10px] font-black uppercase tracking-tight ${isPending ? 'text-red-600' : 'text-slate-400'}`}>
                                     {isPending ? `Pending: ${device.pending_command}` : mainStatus}
                                   </p>
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

                {/* Right Section: Intelligence & Control */}
                <div className="xl:col-span-8 space-y-8">
                  {/* Control Panel Overhaul */}
                  <AnimatePresence mode="wait">
                    {selectedDevice ? (
                      <motion.div 
                        key={selectedDevice.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8"
                      >
                        <div className="flex flex-col gap-8">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-2">
                                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{selectedDevice.model}</h3>
                                 <div className="flex gap-2">
                                   <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase border border-slate-800">
                                     v3.0.0
                                   </span>
                                   <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase border border-red-100">
                                     {selectedDevice.id.slice(0, 8)}
                                   </span>
                                 </div>
                              </div>
                              <div className="flex flex-wrap gap-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                 <div className="flex items-center gap-1.5">
                                   <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                   {selectedDevice.current_lat?.toFixed(6)}, {selectedDevice.current_lng?.toFixed(6)}
                                 </div>
                                 <div className="flex items-center gap-1.5">
                                   <Activity className="w-3.5 h-3.5 text-slate-300" />
                                   Telemetry: {selectedDevice.last_seen ? formatDistanceToNow(new Date(selectedDevice.last_seen)) : 'N/A'} ago
                                 </div>
                                 {selectedDevice.pending_command && (
                                   <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 animate-pulse">
                                     <Zap className="w-3.5 h-3.5" />
                                     Syncing: {selectedDevice.pending_command}
                                   </div>
                                 )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                               <button 
                                 onClick={() => sendCommand(selectedDevice.id, 'LOCATE')}
                                 className="h-14 px-8 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-3 active:scale-95"
                               >
                                 <MapPin className="w-5 h-5" /> Force Locate
                               </button>
                            </div>
                          </div>

                          {/* Command Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'ALARM')}
                              icon={<Volume2 className="w-5 h-5" />}
                              label="Panic Siren"
                              desc="Max volume alert"
                              variant="danger"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'LOCK')}
                              icon={<Lock className="w-5 h-5" />}
                              label="Hard Lock"
                              desc="Bypass security"
                              variant="dark"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'FAKE_POWER')}
                              icon={<Power className="w-5 h-5" />}
                              label="Fake Power"
                              desc="Simulation mode"
                              variant="warning"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'SPEAK')}
                              icon={<Mic className="w-5 h-5" />}
                              label="Voice Alert"
                              desc="Text-to-speech"
                              variant="info"
                            />
                             <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'CALL_SIGNAL')}
                              icon={<PhoneCall className="w-5 h-5" />}
                              label="Call Handshake"
                              desc="Direct line sync"
                              variant="info"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'SCAN_NEARBY')}
                              icon={<Wifi className="w-5 h-5" />}
                              label="Nearby Scan"
                              desc="WiFi/BT signals"
                              variant="outline"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'SCAN_NETWORK')}
                              icon={<Radio className="w-5 h-5" />}
                              label="Net Intelligence"
                              desc="Port discovery"
                              variant="outline"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'SELF_UPDATE')}
                              icon={<Zap className="w-5 h-5" />}
                              label="Self Update"
                              desc="Force patch deploy"
                              variant="outline"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'RESET')}
                              icon={<RotateCcw className="w-5 h-5" />}
                              label="Reset System"
                              desc="Clear theft state"
                              variant="outline"
                            />
                            <CommandButton 
                              onClick={() => sendCommand(selectedDevice.id, 'WIPE')}
                              icon={<Trash2 className="w-5 h-5" />}
                              label="Factory Wipe"
                              desc="IRREVERSIBLE"
                              variant="ghost-danger"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="p-12 bg-white rounded-[2.5rem] border border-slate-200 text-center text-slate-400 font-bold border-dashed flex flex-col items-center gap-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center">
                          <Smartphone className="w-10 h-10 text-slate-200" />
                        </div>
                        <div>
                          <p className="text-slate-900 font-black uppercase tracking-tight">Intelligence Node Not Selected</p>
                          <p className="text-xs text-slate-400">Select a device from the fleet to establish an encrypted control session.</p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* Map & Intelligence */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 h-[500px] lg:h-[600px] bg-white rounded-[3rem] border border-slate-200 shadow-sm p-4 relative overflow-hidden group">
                        <div className="absolute top-8 left-8 z-10 flex gap-2">
                           <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl text-[10px] font-black uppercase flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                              OSINT Tracking Mode
                           </div>
                        </div>
                        <DashboardMap devices={devices} selectedDeviceId={selectedDevice?.id} />
                     </div>
                     
                     <div className="space-y-6">
                        {/* Audit Feed */}
                        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-6 overflow-hidden h-[600px] flex flex-col">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                             <Terminal className="w-4 h-4 text-green-500" /> System Forensic Audit
                           </h4>
                           
                           <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar font-mono text-[10px]">
                             {auditLogs.length > 0 ? (
                               auditLogs.map((log) => (
                                 <div key={log.id} className="border-l-2 border-slate-700 pl-3 py-1 space-y-1">
                                   <div className="flex items-center justify-between">
                                      <span className={`font-black ${
                                        log.type === 'success' ? 'text-green-500' : 
                                        log.type === 'warning' ? 'text-amber-500' : 
                                        log.type === 'danger' ? 'text-red-500' : 'text-blue-500'
                                      }`}>
                                        [{log.action}]
                                      </span>
                                      <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                   </div>
                                   <p className="text-slate-400 break-words">{log.detail}</p>
                                 </div>
                               ))
                             ) : (
                               <div className="h-full flex items-center justify-center text-slate-600 italic">
                                 Awaiting system activity...
                               </div>
                             )}
                           </div>
                           
                           <div className="mt-4 pt-4 border-t border-slate-800">
                              <div className="flex items-center justify-between text-[8px] font-black uppercase text-slate-500">
                                 <span>Database Socket</span>
                                 <span className="text-green-500 flex items-center gap-1">
                                    <Cloud className="w-3 h-3" /> Connected
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profiles' && (
              <motion.div 
                key="profiles"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-[1600px] mx-auto"
              >
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Authorized User Database</h3>
                      <p className="text-sm text-slate-400 font-medium">Global list of all authenticated mobile node owners.</p>
                    </div>
                    <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-black text-slate-500 uppercase tracking-widest">
                      Total Nodes: {profiles.length}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Identification</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Full Name</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Communication</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Enrollment</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Protection</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profiles.map((profile) => (
                          <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-10 py-6 text-xs font-mono text-slate-400">{profile.id.slice(0, 12)}...</td>
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">
                                  {profile.name?.charAt(0) || 'U'}
                                </div>
                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{profile.name}</span>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-sm font-bold text-slate-500">{profile.email}</td>
                            <td className="px-10 py-6 text-xs font-black text-slate-400 uppercase">
                              {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-10 py-6 text-right">
                              <button className="p-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-slate-300 transition-all active:scale-90">
                                <Shield className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-[1600px] mx-auto"
              >
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Intelligence Stream</h3>
                      <p className="text-sm text-slate-400 font-medium">Full database dump of location telemetry and signal intelligence reports.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timeline</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Node</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Grid</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status & Raw Signals</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {locationLogs.map((log) => (
                          <tr 
                            key={log.id} 
                            onClick={() => {
                              const device = devices.find(d => d.id === log.device_id);
                              if (device) {
                                setSelectedDevice(device);
                                setActiveTab('fleet');
                              }
                            }}
                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          >
                            <td className="px-10 py-6 text-xs font-black text-slate-500 uppercase whitespace-nowrap">
                              {formatDistanceToNow(new Date(log.recorded_at))} ago
                            </td>
                            <td className="px-10 py-6">
                              <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.devices?.model || 'Unknown Node'}</span>
                            </td>
                            <td className="px-10 py-6 text-xs font-mono text-slate-400 whitespace-nowrap">
                              {log.lat.toFixed(6)}, {log.lng.toFixed(6)}
                            </td>
                            <td className="px-10 py-6">
                              <div className="max-w-md overflow-hidden">
                                <p className="text-[10px] font-medium text-slate-600 line-clamp-2 leading-relaxed">
                                  {log.status || 'No status reported'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div 
                key="audit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-[1200px] mx-auto"
              >
                <div className="bg-slate-950 rounded-[3rem] border border-slate-800 shadow-2xl p-10 font-mono">
                   <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-8">
                      <div className="p-3 bg-slate-900 rounded-2xl">
                         <Terminal className="w-8 h-8 text-green-500" />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white uppercase tracking-widest">Real-time Backend Audit Log</h3>
                         <p className="text-xs text-slate-500">Monitoring all Supabase activities, API calls, and node handshakes.</p>
                      </div>
                   </div>
                   
                   <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-4">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex gap-4 p-3 hover:bg-slate-900/50 rounded-xl transition-colors border-l-2 border-slate-800 hover:border-green-500 group">
                           <span className="text-slate-600 text-[10px] whitespace-nowrap pt-1">
                              {new Date(log.timestamp).toLocaleTimeString()}
                           </span>
                           <div className="flex-1">
                              <span className={`text-[10px] font-black uppercase ${
                                log.type === 'success' ? 'text-green-500' : 
                                log.type === 'warning' ? 'text-amber-500' : 
                                log.type === 'danger' ? 'text-red-500' : 'text-blue-500'
                              }`}>
                                {log.action}
                              </span>
                              <p className="text-slate-300 text-xs mt-1 leading-relaxed">{log.detail}</p>
                           </div>
                           <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-1 rounded">REST_API</span>
                           </div>
                        </div>
                      ))}
                      {auditLogs.length === 0 && (
                        <div className="py-20 text-center text-slate-700">
                           <Activity className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                           <p>Establishing secure audit stream...</p>
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Global Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}

function CommandButton({ onClick, icon, label, desc, variant }: { 
  onClick: () => void, 
  icon: React.ReactNode, 
  label: string, 
  desc: string,
  variant: 'danger' | 'dark' | 'warning' | 'info' | 'outline' | 'ghost-danger'
}) {
  const variants = {
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20',
    info: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20',
    outline: 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
    'ghost-danger': 'bg-white border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200'
  };

  return (
    <button 
      onClick={onClick}
      className={`p-5 rounded-[2rem] border transition-all flex flex-col gap-3 group relative overflow-hidden active:scale-95 ${variants[variant] || variants.outline} shadow-lg`}
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
        variant === 'outline' ? 'bg-slate-50 text-slate-400 group-hover:text-slate-600' : 'bg-white/20 text-white'
      }`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className={`text-[9px] font-medium leading-tight ${
          variant === 'outline' ? 'text-slate-400' : 'text-white/60'
        }`}>{desc}</p>
      </div>
    </button>
  );
}
