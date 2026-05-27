import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BrainCircuit, Activity, Database, ServerCrash, RotateCcw, ShieldCheck, Zap, Server, Network } from 'lucide-react';

// Reusable Motion Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function LandingPage({ onLaunch, onReplayLaunch }) {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Micro-interaction parallax state for hero
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  };

  return (
    <div className="bg-[#020617] text-gray-200 min-h-screen overflow-x-hidden selection:bg-neon-cyan/30 font-sans" onMouseMove={handleMouseMove}>
      
      {/* --- Ambient Global Glows --- */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-neon-purple/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-neon-cyan/10 blur-[150px] rounded-full pointer-events-none" />

      {/* =========================================
          1. HERO SECTION
      ========================================= */}
      <motion.section 
        className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-6 z-10 overflow-hidden"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        {/* Animated Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30" 
          style={{
            backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px) perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)`,
            transformOrigin: 'top center'
          }}
        />

        {/* Tiny AI Status Orb (Top Right) */}
        <div className="absolute top-8 right-8 flex items-center space-x-2 bg-black/40 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-neon-green shadow-[0_0_8px_#00ff66] animate-pulse" />
          <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">AI Core Online</span>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center max-w-5xl relative z-20">
          
          <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
            <div className="px-4 py-1.5 rounded-full border border-neon-purple/30 bg-neon-purple/10 text-neon-purple text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(176,38,255,0.2)]">
              V2 Enterprise Production Ready
            </div>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white via-neon-cyan to-neon-purple pb-2 drop-shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            SRIIS — Autonomous Incident <br/> Intelligence Platform
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-gray-400 mb-6 font-light">
            AI-native observability that detects, correlates, reasons about, and <br className="hidden md:block"/> autonomously heals infrastructure failures in real time.
          </motion.p>
          
          <motion.p variants={fadeInUp} className="text-sm md:text-base text-gray-500 mb-12 max-w-2xl mx-auto">
            Powered by Autonomous AI Reasoning and Vector Memory. SRIIS doesn't just alert engineers to downtime — it actively investigates and responds before users notice.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
            <button 
              onClick={onLaunch}
              className="relative group px-8 py-4 bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg overflow-hidden transition-all hover:bg-neon-cyan/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/20 to-neon-cyan/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10 text-neon-cyan font-bold tracking-widest uppercase">Launch Dashboard</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Hero Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="relative mt-24 w-full max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 z-20"
        >
          {[
            { label: "Incident Detection Accuracy", value: "99.98%", color: "neon-cyan", rgb: "0,240,255" },
            { label: "Autonomous Recovery Time", value: "<12s", color: "neon-purple", rgb: "176,38,255" },
            { label: "AI Incident Monitoring", value: "24/7", color: "yellow-400", rgb: "250,204,21" },
            { label: "Distributed Correlation", value: "Real-Time", color: "neon-green", rgb: "0,255,102" }
          ].map((stat, i) => (
            <div key={i} className={`glass-panel border border-${stat.color}/20 rounded-xl p-4 text-center backdrop-blur-md`} style={{ boxShadow: `0 0 15px rgba(${stat.rgb}, 0.1)` }}>
              <div className={`text-2xl md:text-3xl font-mono font-bold text-${stat.color} mb-1`} style={{ filter: `drop-shadow(0 0 12px rgba(${stat.rgb}, 0.8))` }}>{stat.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* =========================================
          2. LIVE SYSTEM STATUS STRIP
      ========================================= */}
      <section className="border-y border-white/5 bg-black/40 backdrop-blur-md py-6 relative z-20 overflow-hidden">
        <div className="flex w-[200%] animate-[slide_40s_linear_infinite]">
          {/* Double up items to create seamless infinite scroll effect */}
          {[1, 2].map(group => (
            <div key={group} className="flex justify-around w-1/2 min-w-max space-x-24 md:space-x-40 px-24">
              {[
                { name: "Neural Telemetry Pipeline Online", color: "neon-cyan" },
                { name: "Semantic Vector Memory Synced", color: "neon-purple" },
                { name: "Stochastic Canary Analysis Active", color: "neon-green" },
                { name: "Autonomous Healing Subroutines Armed", color: "yellow-400" },
                { name: "Distributed Trace Correlation Linked", color: "neon-cyan" }
              ].map((item, i) => (
                <div key={`${group}-${i}`} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full bg-${item.color} shadow-[0_0_8px_currentColor] animate-pulse`} />
                  <span className={`text-xs font-mono font-bold tracking-widest uppercase text-${item.color}`}>{item.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          3. FEATURE SHOWCASE
      ========================================= */}
      <section className="py-32 px-6 relative z-20 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
          className="text-center mb-20"
        >
          <h2 className="text-4xl font-bold mb-4">Enterprise Grade Intelligence.</h2>
          <p className="text-gray-400 text-lg">Engineered for chaos. Designed for resilience.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { icon: Zap, title: "Chaos Engineering", desc: "Inject controlled infrastructure failures to test resilience and autonomous recovery workflows." },
            { icon: BrainCircuit, title: "AI Incident Reasoning", desc: "LLM-powered root cause analysis across thousands of distributed logs and telemetry events." },
            { icon: RotateCcw, title: "Incident Replay Engine", desc: "Replay historical infrastructure disasters step-by-step with cinematic timeline reconstruction." },
            { icon: Database, title: "Vector Memory System", desc: "Pinecone-powered semantic memory allowing the AI to learn from previously resolved incidents." }
          ].map((feat, idx) => (
            <motion.div 
              key={idx}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              className="glass-panel border border-white/5 rounded-2xl p-8 hover:bg-white/[0.02] transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl group-hover:bg-neon-cyan/10 transition-colors" />
              <feat.icon size={32} className="text-neon-cyan mb-6 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              <h3 className="text-2xl font-bold mb-3">{feat.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================
          4. AUTONOMOUS PIPELINE VISUALIZATION
      ========================================= */}
      <section className="py-24 border-y border-white/5 bg-black/40 relative z-20">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto pb-8 scrollbar-hide">
          <div className="flex items-center min-w-max space-x-4">
            {[
              { step: "INGEST", text: "Live telemetry & logs", icon: Network },
              { step: "DETECT", text: "ML anomaly analysis", icon: Activity },
              { step: "CORRELATE", text: "Cascading failure mapping", icon: ServerCrash },
              { step: "REASON", text: "LLM root-cause analysis", icon: BrainCircuit },
              { step: "DECIDE", text: "Safety validation engine", icon: ShieldCheck },
              { step: "HEAL", text: "Autonomous recovery", icon: Server },
              { step: "LEARN", text: "Vector memory adaptation", icon: Database }
            ].map((node, i, arr) => (
              <React.Fragment key={i}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center justify-center w-40 glass-panel border border-white/10 rounded-xl p-4 hover:border-neon-cyan/50 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition-all group cursor-default"
                >
                  <node.icon size={24} className="text-gray-500 mb-3 group-hover:text-neon-cyan transition-colors" />
                  <div className="text-xs font-bold tracking-widest text-white mb-2">{node.step}</div>
                  <div className="text-[10px] text-gray-500 text-center leading-tight">{node.text}</div>
                </motion.div>
                {i !== arr.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.1 }}
                    className="w-12 h-[2px] bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 relative overflow-hidden"
                  >
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-[50%] bg-white shadow-[0_0_8px_#fff]" 
                      animate={{ left: ['-50%', '150%'] }} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          6. WHY SRIIS EXISTS SECTION
      ========================================= */}
      <section className="py-40 px-6 relative z-20 max-w-4xl mx-auto text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <p className="text-2xl md:text-4xl font-light text-gray-300 leading-relaxed mb-10">
            "Modern infrastructure generates <span className="text-white font-bold">millions</span> of telemetry events daily.
            Human teams cannot manually trace cascading failures fast enough."
          </p>
          <p className="text-xl text-neon-cyan font-mono tracking-wide">
            SRIIS autonomously detects, correlates, reasons about, and recovers from incidents in real time.
          </p>
        </motion.div>
      </section>

      {/* =========================================
          7. TECH STACK SHOWCASE
      ========================================= */}
      <section className="py-24 px-6 relative z-20 border-t border-white/5 bg-black/60">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-12">Powered by next-generation architecture</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {["React", "TailwindCSS", "FastAPI", "MongoDB", "Pinecone", "Groq", "HuggingFace", "Socket.IO", "Framer Motion"].map((tech, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="px-6 py-3 glass-panel border border-white/10 rounded-full text-sm font-bold text-gray-300 hover:border-neon-purple/50 hover:text-white transition-colors cursor-default"
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          8. FOOTER
      ========================================= */}
      <footer className="py-12 border-t border-white/10 relative z-20 overflow-hidden">
        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="text-2xl font-extrabold tracking-widest text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] mb-4 md:mb-0">
            SRIIS
          </div>
          <div className="text-gray-500 text-sm font-mono flex items-center space-x-6">
            <span className="hover:text-white transition-colors cursor-pointer">GitHub Repository</span>
            <span className="hover:text-white transition-colors cursor-pointer">Documentation</span>
            <span>&copy; 2026 SRIIS Autonomous Systems</span>
          </div>
        </div>
      </footer>
      
      {/* Global Style for infinite horizontal scroll keyframes */}
      <style>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
