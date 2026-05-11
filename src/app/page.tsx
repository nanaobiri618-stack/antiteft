'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  MapPin, 
  AlertTriangle, 
  Smartphone, 
  Download, 
  ChevronRight,
  Zap,
  Activity,
  Cpu
} from 'lucide-react';

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#020202] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-red-900/5 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600/20 rounded-lg border border-red-500/30">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <span className="font-bold text-xl tracking-tighter uppercase">Anti-Theft <span className="text-red-500">Guard</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Hardened Security</a>
            <a href="/dashboard" className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all">Dashboard Access</a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="pt-40 pb-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Zap className="w-3 h-3 fill-current" />
              v2.0 Hardened Recovery Engine Now Live
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8"
            >
              UNHACKABLE. <br/>
              <span className="bg-gradient-to-r from-red-600 via-red-400 to-zinc-400 bg-clip-text text-transparent italic">UNSTOPPABLE.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-zinc-400 max-w-3xl leading-relaxed mb-12"
            >
              The world's most aggressive anti-theft system. Hardened with OS-level MDM policies, 
              SIM hijack detection, and SMS blackout recovery. If it's lost, it's found.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6"
            >
              <a
                href="/app-debug.apk"
                className="group relative flex h-16 items-center justify-center gap-3 rounded-2xl bg-white px-10 text-black font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                download
              >
                <Download className="w-5 h-5 transition-transform group-hover:translate-y-1" />
                Deploy to Device
              </a>
              
              <a 
                href="/dashboard"
                className="group h-16 px-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md text-white font-bold transition-all hover:bg-white/10 flex items-center justify-center gap-2"
              >
                Launch Command Center
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* Intelligence Grid */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div variants={item} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-red-500/50 transition-colors group">
                <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center mb-6 border border-red-500/30 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">Total MDM Lockdown</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  OS-level policies prevent factory resets, airplane mode, or hardware tampering. The thief is locked out instantly.
                </p>
              </motion.div>

              <motion.div variants={item} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-blue-500/50 transition-colors group">
                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">OSINT Intelligence</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Aggregates WiFi triangulation, Bluetooth signatures, and IP geolocation to track location even if GPS is disabled.
                </p>
              </motion.div>

              <motion.div variants={item} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-green-500/50 transition-colors group">
                <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center mb-6 border border-green-500/30 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-4">SIM Hijack Defense</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Instant detection of SIM card changes triggers aggressive tracking and sends a raw SMS ping to your owner phone.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Security Hardening Section */}
        <section id="security" className="py-20 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-8">Persistence is Key. <br/><span className="text-zinc-500 text-2xl">Hardened for the Extreme.</span></h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Cpu className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Boot Persistence</h4>
                    <p className="text-sm text-zinc-500 italic">Tracking starts automatically before the user can even unlock the screen.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Fake Power Off Trap</h4>
                    <p className="text-sm text-zinc-500 italic">Tricks thieves into thinking the phone is dead, keeping radios active for tracking.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Blackout Recovery SMS</h4>
                    <p className="text-sm text-zinc-500 italic">No Data? No GPS? The device uses cellular signaling to send raw tower pings via SMS.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-full border border-red-500/20 flex items-center justify-center"
            >
              <div className="absolute inset-0 animate-spin-slow">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
              </div>
              <div className="w-[80%] h-[80%] rounded-full border border-red-500/10 flex items-center justify-center bg-red-500/[0.02]">
                <div className="p-10 bg-gradient-to-b from-zinc-800 to-black rounded-3xl border border-white/10 shadow-2xl">
                   <Shield className="w-32 h-32 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 text-center">
        <div className="flex justify-center mb-8">
           <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <Shield className="w-6 h-6 text-zinc-600" />
            </div>
        </div>
        <p className="text-zinc-600 text-sm font-medium uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Anti-Theft Guard Premium. Military Grade Protection.
        </p>
      </footer>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
}
