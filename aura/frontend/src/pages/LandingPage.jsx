import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Activity, Database, ServerCrash, RotateCcw, ShieldCheck, Zap, Server, Network, Terminal, Lock, PlayCircle, GitBranch, ArrowRight, ShieldAlert, Cpu, Globe, CreditCard } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

// Animated Number Counter Component
const AnimatedCounter = ({ value, label, color, isDynamic = true }) => {
  const [displayValue, setDisplayValue] = useState("0");
  
  useEffect(() => {
    let initialTimer;
    let dynamicTimer;

    // Special format handling for 24/7
    if (value.includes('/')) {
      setDisplayValue(value);
      return;
    }
    
    const prefixMatch = value.match(/^[^0-9.]+/);
    const prefix = prefixMatch ? prefixMatch[0] : '';
    
    const suffixMatch = value.match(/[^0-9.]+$/);
    const suffix = suffixMatch ? suffixMatch[0] : '';
    
    const baseNum = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(baseNum)) {
      setDisplayValue(value);
      return;
    }

    const isDecimal = value.includes('.');
    const decimalPlaces = isDecimal ? value.split('.')[1].replace(/[^0-9]/g, '').length : 0;

    let current = 0;
    const duration = 2000;
    const increment = baseNum / (duration / 16);
    
    initialTimer = setInterval(() => {
      current += increment;
      if (current >= baseNum) {
        clearInterval(initialTimer);
        current = baseNum;
        setDisplayValue(prefix + (isDecimal ? current.toFixed(decimalPlaces) : Math.round(current)) + suffix);
        
        // Start continuous dynamic jitter
        if (isDynamic) {
          dynamicTimer = setInterval(() => {
            if (suffix === '%') {
              // Fluctuate accuracy slightly (e.g., 99.96% - 99.99%)
              const jitter = baseNum - (Math.random() * 0.04);
              setDisplayValue(prefix + jitter.toFixed(2) + suffix);
            } else if (suffix === 'M') {
              // Continually tick telemetry slightly upwards simulating thousands of events
              current += (Math.random() * 0.005); 
              setDisplayValue(prefix + current.toFixed(2) + suffix);
            } else {
              // Integer jitter for time/incidents
              const offset = Math.floor(Math.random() * 3) - 1; 
              setDisplayValue(prefix + Math.max(0, baseNum + offset) + suffix);
            }
          }, 2000);
        }
      } else {
        setDisplayValue(prefix + (isDecimal ? current.toFixed(decimalPlaces) : Math.round(current)) + suffix);
      }
    }, 16);
    
    return () => {
      clearInterval(initialTimer);
      if (dynamicTimer) clearInterval(dynamicTimer);
    };
  }, [value, isDynamic]);

  return (
    <div className={`glass-panel border border-${color}/20 rounded-xl p-6 text-center backdrop-blur-md`}>
      <div className={`text-4xl md:text-5xl font-mono font-bold text-${color} mb-2`} style={{ filter: `drop-shadow(0 0 12px currentColor)` }}>{displayValue}</div>
      <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">{label}</div>
    </div>
  );
};

export default function LandingPage({ onLaunch, onReplayLaunch }) {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  
  // Simulated Demo State for Section 2
  const [demoState, setDemoState] = useState(0);
  const [typingText, setTypingText] = useState("");
  
  const fullText = "> anomaly cluster detected\n> distributed correlation activated\n> querying semantic memory...\n> generating recovery strategy...\n> validating safety guardrails...\n> execution approved";
  
  useEffect(() => {
    const sequence = async () => {
      // 0: Healthy, 1: Anomaly, 2: RCA, 3: Guardrail, 4: Healing
      while (true) {
        setDemoState(0);
        setTypingText("");
        await new Promise(r => setTimeout(r, 3000));
        
        setDemoState(1); // Incident occurs
        await new Promise(r => setTimeout(r, 2000));
        
        setDemoState(2); // RCA / Typing starts
        for(let i=1; i<=fullText.length; i++) {
          setTypingText(fullText.substring(0, i));
          await new Promise(r => setTimeout(r, 30));
        }
        await new Promise(r => setTimeout(r, 1000));
        
        setDemoState(3); // Approved
        await new Promise(r => setTimeout(r, 1500));
        
        setDemoState(4); // Healing
        await new Promise(r => setTimeout(r, 3000));
      }
    };
    sequence();
  }, []);

  return (
    <div className="bg-[#020617] text-gray-200 min-h-screen overflow-x-hidden selection:bg-neon-cyan/30 font-sans">
      
      {/* Ambient Global Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[800px] h-[800px] bg-neon-purple/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-neon-cyan/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-50 mix-blend-overlay" />

      {/* =========================================
          0. TOP NAVIGATION BAR
      ========================================= */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/50 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <BrainCircuit className="text-neon-cyan" size={24} />
          <span className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-neon-cyan">AURA</span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-sm font-mono text-gray-400">
          <button onClick={() => document.getElementById('demo').scrollIntoView({ behavior: 'smooth' })} className="hover:text-neon-cyan transition-colors uppercase tracking-widest">Demo</button>
          <button onClick={() => document.getElementById('guardrails').scrollIntoView({ behavior: 'smooth' })} className="hover:text-neon-purple transition-colors uppercase tracking-widest">Governance</button>
          <button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} className="hover:text-neon-pink transition-colors uppercase tracking-widest">Pipeline</button>
          <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-yellow-400 transition-colors uppercase tracking-widest">Features</button>
          <button onClick={() => document.getElementById('replay').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors uppercase tracking-widest">Replay</button>
          <button onClick={() => document.getElementById('tech-stack').scrollIntoView({ behavior: 'smooth' })} className="hover:text-neon-green transition-colors uppercase tracking-widest">Stack</button>
          <button onClick={onLaunch} className="border border-neon-cyan/50 text-neon-cyan px-4 py-1.5 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors uppercase tracking-widest font-bold">Launch</button>
        </div>
      </nav>

      {/* =========================================
          1. HERO SECTION
      ========================================= */}
      <motion.section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-6 z-10" style={{ y: heroY }}>
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-cyan/20 via-[#020617] to-[#020617]" />
        
        {/* Animated AI Status Strip */}
        <div className="absolute top-16 w-full overflow-hidden border-b border-white/5 bg-black/40 backdrop-blur-md py-6 z-20">
          <div className="flex w-[200%] animate-[slide_40s_linear_infinite]">
            {[1, 2].map(group => (
              <div key={group} className="flex justify-around w-1/2 min-w-max space-x-24 px-24">
                {[
                  { name: "Neural Telemetry Pipeline Online", color: "neon-cyan" },
                  { name: "Semantic Vector Memory Synced", color: "neon-purple" },
                  { name: "Distributed Correlation Active", color: "neon-green" },
                  { name: "Canary Analysis Armed", color: "yellow-400" },
                  { name: "Autonomous Healing Ready", color: "neon-pink" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className={`w-2.5 h-2.5 rounded-full bg-${item.color} shadow-[0_0_8px_currentColor] animate-pulse`} />
                    <span className={`text-xs font-mono font-bold tracking-widest uppercase text-${item.color}`}>{item.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center max-w-5xl relative z-20 mt-12">
          <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-neon-cyan to-neon-purple pb-4 drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]">
            AURA
          </motion.h1>
          <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-light tracking-widest text-gray-300 uppercase mb-8">
            Autonomous Recovery Agent
          </motion.h2>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed border-l-4 border-neon-cyan pl-6 text-left bg-gradient-to-r from-neon-cyan/5 to-transparent py-4">
            AI-native observability that <span className="text-white font-bold">detects, correlates, reasons about, and autonomously heals</span> distributed infrastructure failures in real time.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-6">
            <button onClick={onLaunch} className="relative group px-10 py-5 bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg overflow-hidden transition-all hover:bg-neon-cyan/20 hover:scale-105 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/20 to-neon-cyan/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10 text-neon-cyan font-bold tracking-widest uppercase flex items-center">
                Initialize Aura Core <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <button onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})} className="px-10 py-5 border border-white/10 rounded-lg hover:bg-white/5 transition-all text-gray-300 font-bold tracking-widest uppercase flex items-center">
              <PlayCircle size={18} className="mr-2" /> Watch Autonomous Recovery
            </button>
          </motion.div>
        </motion.div>

        {/* Hero KPI Metrics */}
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="w-full max-w-6xl mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 z-20 px-6">
          <AnimatedCounter value="99.98%" label="Detection Accuracy" color="neon-cyan" />
          <AnimatedCounter value="<12s" label="Recovery Time" color="neon-purple" />
          <AnimatedCounter value="24/7" label="Autonomous Monitoring" color="yellow-400" />
          <AnimatedCounter value="2.3M" label="Telemetry Events" color="neon-green" />
        </motion.div>
      </motion.section>

      {/* =========================================
          2. LIVE AUTONOMOUS DEMO SECTION (MOST IMPORTANT)
      ========================================= */}
      <section id="demo" className="py-32 px-6 relative z-20 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center"><Activity className="text-neon-cyan mr-4" size={40}/> Watch Autonomous Recovery in Real Time</h2>
          <p className="text-gray-400 text-lg">No humans required. Watch the AI detect, diagnose, and heal a database deadlock.</p>
        </div>

        <div className="glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[600px]">
            
            {/* Left: Blast Radius Graph Mock */}
            <div className="bg-black/80 relative border-r border-white/5 p-8 flex items-center justify-center overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center space-x-2 text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Network size={12}/> <span>Live Topology</span>
              </div>
              
              {/* Fake Graph Nodes */}
              <div className="relative w-full h-full max-w-[500px] max-h-[500px]">
                {/* Edges */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line x1="20%" y1="50%" x2="50%" y2="50%" stroke={demoState > 0 ? "rgba(255,0,85,0.4)" : "rgba(0,240,255,0.2)"} strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="rgba(0,240,255,0.2)" strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="80%" y2="50%" stroke={demoState > 0 ? "rgba(255,0,85,0.8)" : "rgba(0,240,255,0.2)"} strokeWidth="2" />
                  <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="rgba(0,240,255,0.2)" strokeWidth="2" />
                  
                  {demoState > 0 && demoState < 4 && (
                    <circle r="4" fill="#ff0055">
                      <animateMotion dur="1s" repeatCount="indefinite" path="M 160 200 L 320 200" />
                    </circle>
                  )}
                </svg>

                {/* Nodes */}
                <div className={`absolute top-[50%] left-[20%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 flex items-center justify-center bg-black transition-colors duration-500 ${demoState > 0 && demoState < 4 ? 'border-yellow-400 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-pulse' : 'border-neon-cyan text-neon-cyan'}`}>
                  <Globe size={24} />
                  <span className="absolute -bottom-6 text-[10px] font-mono whitespace-nowrap">frontend</span>
                </div>
                
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-neon-cyan text-neon-cyan flex items-center justify-center bg-black">
                  <Server size={24} />
                  <span className="absolute -bottom-6 text-[10px] font-mono whitespace-nowrap">api-gateway</span>
                </div>

                <div className="absolute top-[20%] left-[80%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-neon-cyan text-neon-cyan flex items-center justify-center bg-black">
                  <Lock size={24} />
                  <span className="absolute -bottom-6 text-[10px] font-mono whitespace-nowrap">auth-service</span>
                </div>

                <div className={`absolute top-[50%] left-[80%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 flex items-center justify-center bg-black transition-colors duration-500 ${demoState > 0 && demoState < 4 ? 'border-neon-pink text-neon-pink shadow-[0_0_30px_rgba(255,0,85,0.8)] animate-bounce' : demoState === 4 ? 'border-neon-green text-neon-green shadow-[0_0_20px_rgba(0,255,102,0.5)]' : 'border-neon-cyan text-neon-cyan'}`}>
                  <Database size={24} />
                  <span className="absolute -bottom-6 text-[10px] font-mono whitespace-nowrap">db-service</span>
                </div>

                <div className="absolute top-[80%] left-[80%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-neon-cyan text-neon-cyan flex items-center justify-center bg-black">
                  <CreditCard size={24} />
                  <span className="absolute -bottom-6 text-[10px] font-mono whitespace-nowrap">payment-service</span>
                </div>
              </div>
            </div>

            {/* Right: AI Decision Trace */}
            <div className="bg-[#050510] relative p-8 flex flex-col">
              <div className="absolute top-4 right-4 flex items-center space-x-2 text-[10px] font-mono font-bold tracking-widest text-gray-500 uppercase bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <BrainCircuit size={12}/> <span>AI Decision Trace</span>
              </div>
              
              <div className="mt-8 space-y-6">
                {/* Confidence Meter */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">AI Confidence</span>
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-32 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ${demoState >= 2 ? 'w-[93%] bg-neon-green shadow-[0_0_10px_#00ff66]' : 'w-0 bg-gray-500'}`} />
                    </div>
                    <span className="text-sm font-mono font-bold text-white">{demoState >= 2 ? '93%' : '0%'}</span>
                  </div>
                </div>

                {/* Pinecone Matches */}
                <div className={`transition-opacity duration-500 ${demoState >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-3">Semantic Memory (Pinecone)</span>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono bg-white/5 p-2 rounded border border-neon-green/30 text-neon-green"><span className="flex items-center"><Database size={12} className="mr-2"/> 93% Similar</span><span>RESTART_SERVICE</span></div>
                    <div className="flex justify-between text-xs font-mono bg-white/5 p-2 rounded text-gray-400"><span className="flex items-center"><Database size={12} className="mr-2"/> 91% Similar</span><span>ROLLBACK_CANARY</span></div>
                  </div>
                </div>

                {/* LLM Cognitive Analysis */}
                <div className={`transition-opacity duration-500 bg-neon-purple/5 border border-neon-purple/20 p-4 rounded-lg ${demoState >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                  <h4 className="text-[10px] font-bold tracking-widest text-neon-purple uppercase mb-2">Cognitive Analysis</h4>
                  <p className="text-sm text-gray-300 font-light leading-relaxed mb-3">
                    <strong className="text-white">Root Cause:</strong> Database deadlock causing authentication cascade and API gateway timeout.
                  </p>
                  <p className="text-sm text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Recommended Action:</strong> RESTART_SERVICE on <code className="text-neon-pink bg-black px-1 rounded">db-service</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Live Terminal */}
          <div className="min-h-[450px] bg-black border-t border-white/10 p-5 font-mono text-[11px] overflow-hidden relative">
            {/* CRT Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10" style={{backgroundSize: '100% 2px, 3px 100%'}} />
            
            <div className="flex items-center text-gray-500 mb-4 border-b border-white/10 pb-2"><Terminal size={14} className="mr-2"/> SYSTEM_STDOUT_STREAM</div>
            <div className="space-y-2 text-gray-400 opacity-50 mb-2">
              <div><span className="text-neon-cyan">[INFO]</span> 10:24:01 Telemetry stream online</div>
              <div><span className="text-neon-cyan">[INFO]</span> 10:24:05 Normal traffic routing applied</div>
            </div>
            
            {demoState >= 1 && <div className="text-neon-pink font-bold mt-2 mb-2"><span className="bg-neon-pink text-black px-1 mr-2">[CRITICAL]</span> 10:24:12 db-service latency exceeded 5000ms. Deadlock detected.</div>}
            {demoState >= 2 && <div className="text-yellow-400 mt-2 mb-4"><span className="bg-yellow-400 text-black px-1 mr-2">[WARN]</span> 10:24:13 API Gateway timeout threshold breached.</div>}
            
            {/* Typing Effect */}
            {demoState >= 2 && (
              <div className="text-neon-green mt-4 whitespace-pre-line leading-loose bg-neon-green/5 p-2 rounded border-l-2 border-neon-green">
                {typingText}
                <span className="animate-pulse">_</span>
              </div>
            )}
            
            {demoState === 4 && <div className="text-neon-cyan font-bold mt-4"><span className="bg-neon-cyan text-black px-1 mr-2">[RECOVERY]</span> 10:24:18 Executing RESTART_SERVICE on db-service. Validating...</div>}
          </div>
        </div>
      </section>

      {/* =========================================
          3. AUTONOMOUS GOVERNANCE ENGINE
      ========================================= */}
      <section id="guardrails" className="py-24 px-6 relative z-20 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center"><ShieldCheck className="text-neon-green mr-4" size={36}/> Autonomous Governance Engine</h2>
            <p className="text-gray-400 text-lg">The AI is powerful, but heavily governed. Deterministic rules protect production.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="glass-panel border border-neon-cyan/20 p-6 rounded-xl text-center hover:bg-neon-cyan/5 transition-colors">
              <div className="text-3xl font-mono font-bold text-neon-cyan mb-2">&gt; 70%</div>
              <h4 className="text-white font-bold mb-2">Confidence Thresholds</h4>
              <p className="text-sm text-gray-400">AI must be highly confident based on vector matches to execute autonomously.</p>
            </div>
            <div className="glass-panel border border-neon-purple/20 p-6 rounded-xl text-center hover:bg-neon-purple/5 transition-colors">
              <RotateCcw size={32} className="text-neon-purple mx-auto mb-3"/>
              <h4 className="text-white font-bold mb-2">Cooldown Protection</h4>
              <p className="text-sm text-gray-400">Prevents infinite restart loops. A service cannot be restarted twice in 5 minutes.</p>
            </div>
            <div className="glass-panel border border-yellow-400/20 p-6 rounded-xl text-center hover:bg-yellow-400/5 transition-colors">
              <ShieldAlert size={32} className="text-yellow-400 mx-auto mb-3"/>
              <h4 className="text-white font-bold mb-2">Human-in-the-Loop</h4>
              <p className="text-sm text-gray-400">Critical actions (like dropping DB connections) halt and require manual `Approve Fix` click.</p>
            </div>
          </div>

          {/* Visual Flow */}
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between glass-panel p-8 rounded-2xl border border-white/10 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className="text-center w-full md:w-1/3 mb-4 md:mb-0">
              <div className="bg-neon-cyan/20 border border-neon-cyan text-neon-cyan px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-sm inline-block">AI Decision Made</div>
            </div>
            <ArrowRight size={24} className="text-gray-500 hidden md:block" />
            <div className="text-center w-full md:w-1/3 mb-4 md:mb-0">
              <div className="bg-black border border-gray-500 text-white px-4 py-3 rounded-lg font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] inline-block flex items-center justify-center"><ShieldCheck size={16} className="mr-2"/> Safety Validation</div>
            </div>
            <ArrowRight size={24} className="text-gray-500 hidden md:block" />
            <div className="flex flex-col space-y-2 w-full md:w-1/3">
              <div className="bg-neon-green/20 border border-neon-green text-neon-green px-4 py-2 rounded-lg text-xs font-bold text-center">Auto-Approved</div>
              <div className="bg-yellow-400/20 border border-yellow-400 text-yellow-400 px-4 py-2 rounded-lg text-xs font-bold text-center">Requires Human Approval</div>
              <div className="bg-neon-pink/20 border border-neon-pink text-neon-pink px-4 py-2 rounded-lg text-xs font-bold text-center">Escalated (Blocked)</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          4. AUTONOMOUS PIPELINE VISUALIZATION
      ========================================= */}
      <section id="how-it-works" className="py-24 relative z-20 overflow-hidden">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl font-bold mb-4 flex items-center justify-center"><GitBranch className="text-neon-purple mr-4"/> How It Works</h2>
        </div>
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto pb-8 scrollbar-hide">
          <div className="flex items-center min-w-max space-x-4">
            {[
              { step: "INGEST", text: "Streams high-volume telemetry & logs", icon: Network },
              { step: "DETECT", text: "ML (IsolationForest) flags anomalies", icon: Activity },
              { step: "CORRELATE", text: "Maps cascading microservice failures", icon: ServerCrash },
              { step: "REASON", text: "LLM diagnoses root cause", icon: BrainCircuit },
              { step: "DECIDE", text: "Safety engine checks guardrails", icon: ShieldCheck },
              { step: "HEAL", text: "Executes 15s validation recovery loop", icon: Server },
              { step: "LEARN", text: "Embeds solution to Pinecone", icon: Database }
            ].map((node, i, arr) => (
              <React.Fragment key={i}>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                  className="flex flex-col items-center justify-center w-48 h-32 glass-panel border border-white/10 rounded-xl p-4 hover:border-neon-purple/50 hover:shadow-[0_0_20px_rgba(176,38,255,0.2)] transition-all group"
                >
                  <node.icon size={24} className="text-gray-500 mb-3 group-hover:text-neon-purple transition-colors" />
                  <div className="text-xs font-bold tracking-widest text-white mb-2">{node.step}</div>
                  <div className="text-[10px] text-gray-400 text-center leading-tight">{node.text}</div>
                </motion.div>
                {i !== arr.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.15 + 0.1 }}
                    className="w-12 h-[2px] bg-white/10 relative overflow-hidden"
                  >
                    <motion.div 
                      className="absolute top-0 left-0 h-full w-[50%] bg-neon-purple shadow-[0_0_8px_#b026ff]" 
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
          5. FEATURE SHOWCASE GRID
      ========================================= */}
      <section id="features" className="py-24 px-6 relative z-20 max-w-7xl mx-auto bg-black/20 rounded-3xl border border-white/5 shadow-2xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-md">Core Platform Capabilities</h2>
          <p className="text-gray-400 text-lg">Everything you need to automate your incident response lifecycle.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Disaster Simulation Engine", desc: "Inject controlled failures (timeouts, crashes, spikes) and test resilience directly from the dashboard." },
            { icon: BrainCircuit, title: "AI Root Cause Analysis", desc: "LLM-powered distributed reasoning that writes a human-readable RCA in seconds." },
            { icon: Database, title: "Vector Memory System", desc: "Pinecone semantic memory allows the AI to learn adaptive recovery strategies from past incidents." },
            { icon: RotateCcw, title: "Forensic Replay Engine", desc: "Replay historical disasters step-by-step with a cinematic flight-recorder timeline." },
            { icon: ShieldAlert, title: "Canary Monitoring", desc: "Autonomous rollback protection for deployments if error rates spike on new versions." },
            { icon: ServerCrash, title: "Distributed Correlation", desc: "Trace cascading failures across services to identify the true root node, not just the symptom." }
          ].map((feat, idx) => (
            <motion.div 
              key={idx}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              className="glass-panel border border-white/5 rounded-2xl p-6 hover:bg-white/[0.02] transition-colors group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl group-hover:bg-neon-cyan/10 transition-colors" />
              <feat.icon size={28} className="text-neon-cyan mb-4 group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* =========================================
          6. FORENSIC REPLAY SECTION
      ========================================= */}
      <section id="replay" className="pt-32 pb-12 px-6 relative z-20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-white drop-shadow-md">
            Replay Infrastructure Failures <br/> Like a Flight Recorder
          </h2>
          <p className="text-gray-400 text-lg mb-12">Post-mortems are no longer guesswork. Watch the exact timeline of a crash, the AI's thought process, and the recovery action in a cinematic playback environment.</p>
          
          <div className="glass-panel border border-white/10 rounded-2xl p-8 bg-black/60 relative overflow-hidden text-left shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            {/* Blurred Overlay Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/80 pointer-events-none z-10" />
            
            <h4 className="text-xs uppercase tracking-widest text-neon-cyan font-bold mb-6 border-b border-white/10 pb-2 inline-block">Historical Replay: INC-9042</h4>
            
            <div className="space-y-4 relative z-0">
              <div className="flex items-center text-sm font-mono"><span className="text-gray-500 w-24">10:24:00</span> <span className="w-3 h-3 rounded-full bg-neon-pink mr-3 shadow-[0_0_8px_#ff0055]"></span> <span className="text-white">DB Timeout Detected</span></div>
              <div className="flex items-center text-sm font-mono"><span className="text-gray-500 w-24">10:24:02</span> <span className="w-3 h-3 rounded-full bg-neon-cyan mr-3"></span> <span className="text-gray-300">Correlation Engine Triggered</span></div>
              <div className="flex items-center text-sm font-mono"><span className="text-gray-500 w-24">10:24:05</span> <span className="w-3 h-3 rounded-full bg-neon-purple mr-3"></span> <span className="text-gray-300">Pinecone Memory Queried</span></div>
              <div className="flex items-center text-sm font-mono"><span className="text-gray-500 w-24">10:24:08</span> <span className="w-3 h-3 rounded-full bg-yellow-400 mr-3"></span> <span className="text-gray-300">Recovery Executed</span></div>
              <div className="flex items-center text-sm font-mono"><span className="text-gray-500 w-24">10:24:23</span> <span className="w-3 h-3 rounded-full bg-neon-green mr-3 shadow-[0_0_8px_#00ff66]"></span> <span className="text-white font-bold">System Stabilized</span></div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              <button onClick={onReplayLaunch} className="flex items-center space-x-2 bg-white text-black px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <PlayCircle size={16}/> <span>Initialize Replay Module</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Duplicate metrics section removed as per user request */}
      {/* =========================================
          8. TECH STACK SECTION
      ========================================= */}
      <section id="tech-stack" className="pt-12 pb-24 px-6 relative z-20">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-12 flex items-center justify-center"><Cpu size={16} className="mr-2"/> Enterprise Tech Stack</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {["React", "TailwindCSS", "FastAPI", "MongoDB", "Pinecone", "Groq (Llama-3)", "LangGraph", "LangChain", "HuggingFace", "Socket.IO", "IsolationForest", "Framer Motion", "Recharts", "Vite", "Uvicorn", "Python", "Node.js"].map((tech, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-gray-300 hover:border-neon-cyan/50 hover:bg-neon-cyan/10 hover:text-white hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all cursor-default shadow-lg backdrop-blur-sm"
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          9. FINAL CALL TO ACTION
      ========================================= */}
      <section className="py-32 px-6 relative z-20 border-t border-white/5 bg-gradient-to-b from-black/0 to-neon-cyan/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white drop-shadow-md">Ready to Automate Your Incident Response?</h2>
          <p className="text-gray-400 text-lg mb-12">Join the future of resilient, AI-driven infrastructure today. Stop waking up at 3 AM for issues the machine can fix itself.</p>
          <button onClick={onLaunch} className="relative group px-12 py-6 bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg overflow-hidden transition-all hover:bg-neon-cyan/20 hover:scale-105 shadow-[0_0_30px_rgba(0,240,255,0.3)] inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/20 to-neon-cyan/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 text-neon-cyan font-bold tracking-widest text-lg uppercase flex items-center">
              Initialize Aura Core <ArrowRight size={20} className="ml-3 group-hover:translate-x-2 transition-transform" />
            </span>
          </button>
        </div>
      </section>

      {/* =========================================
          10. FOOTER
      ========================================= */}
      <footer className="py-12 border-t border-white/10 relative z-20 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center">
          <div className="text-gray-500 text-sm font-mono flex items-center space-x-6">
            <span className="hover:text-white transition-colors cursor-pointer">GitHub</span>
            <span className="hover:text-white transition-colors cursor-pointer">Documentation</span>
            <a href="#tech-stack" onClick={(e) => { e.preventDefault(); document.getElementById('tech-stack').scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-white transition-colors cursor-pointer">Tech Stack</a>
            <span>&copy; 2026 Aura Autonomous Systems</span>
          </div>
        </div>
      </footer>
      
      <style>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
