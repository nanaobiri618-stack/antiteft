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
  Cpu,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, []);
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
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-red-100 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200 glass">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight uppercase">Anti-Theft <span className="text-red-600">Pro</span></span>
          </Link>
          <div className="flex items-center gap-4 md:gap-8 text-sm font-bold">
            <Link href="/login" className="text-slate-600 hover:text-red-600 transition-colors hidden sm:block">Log In</Link>
            <Link href="/signup" className="px-6 py-2.5 bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all flex items-center gap-2">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-20">
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          {/* Subtle Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.03)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-black uppercase tracking-widest mb-8"
            >
              <Zap className="w-3 h-3 fill-current" />
              v3.0 Military-Grade Recovery Engine
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-8xl font-black tracking-tight leading-[1] mb-8 text-slate-900"
            >
              UNHACKABLE. <br/>
              <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent italic">UNSTOPPABLE.</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-slate-500 max-w-3xl leading-relaxed mb-12 font-medium"
            >
              Protect your mobile assets with the world's most aggressive anti-theft system. 
              Hardened with OS-level MDM policies and real-time OSINT tracking.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
            >
              <a
                href="/app-debug.apk"
                className="group relative flex h-16 items-center justify-center gap-3 rounded-2xl bg-slate-900 px-10 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20"
                download
              >
                <Download className="w-5 h-5 transition-transform group-hover:translate-y-1" />
                Download APK
              </a>
              
              <Link 
                href="/login"
                className="group h-16 px-10 rounded-2xl border border-slate-200 bg-white text-slate-900 font-bold transition-all hover:bg-slate-50 flex items-center justify-center gap-2 shadow-sm"
              >
                Access Dashboard
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Intelligence Grid */}
        <section id="features" className="py-24 px-6 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-4 uppercase">Advanced Defense</h2>
              <div className="w-20 h-1.5 bg-red-600 mx-auto rounded-full" />
            </div>

            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div variants={item} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 card-hover group">
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-red-600/20">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4">MDM Lockdown</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  OS-level policies prevent factory resets, airplane mode, or hardware tampering. The device remains yours.
                </p>
              </motion.div>

              <motion.div variants={item} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 card-hover group">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-slate-900/20">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4">OSINT Tracking</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  WiFi triangulation, Bluetooth signatures, and IP geolocation track location even if GPS is disabled.
                </p>
              </motion.div>

              <motion.div variants={item} className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 card-hover group">
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-red-600/20">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4">SIM Shield</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Instant detection of SIM changes triggers aggressive tracking and emergency pings to your owner number.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Persistence Section */}
        <section id="security" className="py-24 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-black mb-8 leading-tight">Hardened for the <br/><span className="text-red-600 uppercase">Extreme.</span></h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="mt-1 w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Cpu className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg mb-1">Boot Persistence</h4>
                    <p className="text-slate-500 font-medium">Tracking starts automatically before the OS even fully initializes.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="mt-1 w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Smartphone className="w-6 h-6 text-slate-900" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg mb-1">Stealth Radios</h4>
                    <p className="text-slate-500 font-medium">Radios remain active even when the device appears powered down.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="mt-1 w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg mb-1">Blackout Recovery</h4>
                    <p className="text-slate-500 font-medium">Uses low-level cellular signaling to send tower pings when data is offline.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-red-600 to-red-400 p-1 flex items-center justify-center shadow-2xl shadow-red-600/30"
            >
              <div className="w-full h-full bg-white rounded-[2.8rem] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)]" />
                <Shield className="w-40 h-40 text-red-600 relative z-10 drop-shadow-xl" />
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 bg-slate-900 text-white text-center">
        <div className="flex justify-center mb-6">
           <div className="p-2 bg-white/10 rounded-lg">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
        </div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Anti-Theft Pro Premium. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
