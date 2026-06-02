'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, Volume2, Shield, AlertTriangle, Network, TrendingUp, 
  HelpCircle, Eye, FileText, Database, Clock, RefreshCw, Key, Download
} from 'lucide-react';

export default function Home() {
  // Roles & Tab Selection
  const [activeRole, setActiveRole] = useState("Investigator");
  const [activeTab, setActiveTab] = useState("network"); // "network", "warnings", "audit"

  // Chat State
  const [queryText, setQueryText] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Welcome to the Karnataka State Crime Records Bureau (SCRB) Conversational AI Assistant. How can I assist you today? (ಸಹಾಯ ಬೇಕಾದಲ್ಲಿ ಕನ್ನಡದಲ್ಲೂ ಕೇಳಬಹುದು.)' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  
  // Analytics Data
  const [hotspots, setHotspots] = useState([]);
  const [earlyWarnings, setEarlyWarnings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Network Visualizer Ref & State
  const [networkData, setNetworkData] = useState(null);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Risk Predictions & Audits
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/predict');
      if (res.ok) {
        const data = await res.json();
        setHotspots(data.hotspots || []);
        setEarlyWarnings(data.earlyWarnings || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchChat = async (text) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, role: activeRole })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: data.response,
          sql: data.sql,
          confidence: data.confidence,
          method: data.method,
          time: data.executionTimeMs
        }]);

        if (data.network) {
          setNetworkData(data.network);
          setActiveTab("network");
        } else if (text.toLowerCase().includes('demographic') || text.toLowerCase().includes('poverty') || text.toLowerCase().includes('unemployment')) {
          setActiveTab("warnings");
        }
        
        fetchAnalytics();
      } else {
        setMessages(prev => [...prev, { role: 'bot', text: 'Error executing search. Please verify parameters.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Connection to AI server lost.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Load analytics and network on start
  useEffect(() => {
    let active = true;
    const initializeData = async () => {
      if (!active) return;
      await fetchAnalytics();
      await fetchChat("show Somesh Gowda network syndicate");
    };
    initializeData();
    return () => {
      active = false;
    };
  }, []);

  // Canvas Force-Directed Layout
  useEffect(() => {
    if (!networkData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const nodes = networkData.nodes.map((n) => ({
      ...n,
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      radius: n.id === 'CRM-001' ? 14 : 10
    }));

    const edges = networkData.edges.map(e => ({
      ...e,
      source: nodes.find(n => n.id === e.from),
      target: nodes.find(n => n.id === e.to)
    })).filter(e => e.source && e.target);

    const updatePhysics = () => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 180 / dist;
          nodes[i].vx -= (dx / dist) * force;
          nodes[i].vy -= (dy / dist) * force;
          nodes[j].vx += (dx / dist) * force;
          nodes[j].vy += (dy / dist) * force;
        }
      }

      edges.forEach(edge => {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const strength = 0.04 * (dist - 120);
        edge.source.vx += (dx / dist) * strength;
        edge.source.vy += (dy / dist) * strength;
        edge.target.vx -= (dx / dist) * strength;
        edge.target.vy -= (dy / dist) * strength;
      });

      nodes.forEach(node => {
        node.vx += (canvas.width / 2 - node.x) * 0.008;
        node.vy += (canvas.height / 2 - node.y) * 0.008;
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;
      });
    };

    const draw = () => {
      updatePhysics();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      edges.forEach(edge => {
        ctx.beginPath();
        ctx.moveTo(edge.source.x, edge.source.y);
        ctx.lineTo(edge.target.x, edge.target.y);
        ctx.strokeStyle = `rgba(0, 168, 255, ${edge.value || 0.5})`;
        ctx.lineWidth = (edge.value || 0.5) * 4;
        ctx.stroke();
      });

      nodes.forEach(node => {
        const glowGrad = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, node.radius * 2);
        glowGrad.addColorStop(0, node.status === 'Active' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(0, 168, 255, 0.4)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.status === 'Active' ? '#F43F5E' : '#00A8FF';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#F3F4F6';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - node.radius - 6);
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [networkData]);

  // Submit search query
  const handleQuerySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!queryText.trim()) return;
    const userMsg = queryText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQueryText('');
    setChatLoading(true);
    await fetchChat(userMsg);
  };

  // Voice Dictation Simulator
  const triggerVoiceInput = () => {
    if (voiceActive) {
      setVoiceActive(false);
      return;
    }
    setVoiceActive(true);
    setTimeout(() => {
      setQueryText("Show all active criminals in Bengaluru City");
      setVoiceActive(false);
    }, 2000);
  };

  // Text to Speech
  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const cleaned = text.replace(/\[.*?\]:/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = /[\u0C80-\u0CFF]/.test(text) ? 'kn-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  // PDF Report Generation
  const exportReport = () => {
    const header = `========================================================\n` +
                   `          KARNATAKA STATE CRIME RECORDS BUREAU         \n` +
                   `        CONFIDENTIAL INVESTIGATION QUERY REPORT        \n` +
                   `========================================================\n` +
                   `Generated: ${new Date().toLocaleString()} | Role: ${activeRole}\n\n`;

    const body = messages.map(m => {
      return `[${m.role.toUpperCase()}]\n${m.text}\n` + (m.sql ? `SQL: ${m.sql}\n` : '');
    }).join('\n--------------------------------------------------------\n');

    const blob = new Blob([header + body], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `KSP_Investigation_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-base)' }}>
      
      {/* Top Navbar */}
      <header className="dashboard-header" style={{ padding: '0 24px', height: '64px' }}>
        <div className="brand-section">
          <Shield size={24} style={{ color: '#00A8FF' }} />
          <h1 className="brand-title" style={{ fontSize: '1.15rem' }}>KSP Crime Database AI</h1>
          <span className="badge-official">SCRB Console</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Cleared Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Key size={14} style={{ color: 'var(--accent-blue)' }} />
            <select 
              value={activeRole} 
              onChange={(e) => setActiveRole(e.target.value)} 
              className="profile-select"
              style={{ border: 'none', background: 'transparent', color: '#F3F4F6', padding: 0, outline: 'none', cursor: 'pointer' }}
            >
              <option value="Investigator" style={{ backgroundColor: '#12121A', color: '#F3F4F6' }}>Investigator</option>
              <option value="Analyst" style={{ backgroundColor: '#12121A', color: '#F3F4F6' }}>Analyst</option>
              <option value="Administrator" style={{ backgroundColor: '#12121A', color: '#F3F4F6' }}>Administrator</option>
            </select>
          </div>
          <button onClick={exportReport} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Download size={14} /> Export Report
          </button>
        </div>
      </header>

      {/* Main Panel Layout */}
      <main style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: '450px 1fr', gap: '20px', padding: '20px', overflow: 'hidden' }}>
        
        {/* Left Console: Chat */}
        <section className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px' }}>
          <div className="card-header" style={{ marginBottom: '12px' }}>
            <h3 className="card-title" style={{ fontSize: '1rem' }}><Clock size={16} /> Investigator Chat Assistant</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>English / ಕನ್ನಡ</span>
          </div>

          {/* Chat Flow */}
          <div className="chat-messages-container" style={{ flexGrow: 1, minHeight: 0 }}>
            {messages.map((m, idx) => (
              <div key={idx} className={`chat-bubble ${m.role}`}>
                <div>{m.text}</div>

                {m.role === 'bot' && (
                  <button 
                    onClick={() => speakText(m.text)} 
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '6px' }}
                  >
                    <Volume2 size={12} /> Listen
                  </button>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Direct Actions for Police */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <button type="button" onClick={() => fetchChat("List all active criminals")} className="warning-badge low" style={{ cursor: 'pointer', padding: '6px 12px' }}>
              👤 Active Criminals
            </button>
            <button type="button" onClick={() => fetchChat("Show Somesh Gowda network syndicate")} className="warning-badge low" style={{ cursor: 'pointer', padding: '6px 12px' }}>
              🕸️ Somesh Gowda Network
            </button>
            <button type="button" onClick={() => fetchChat("Show district demographics")} className="warning-badge low" style={{ cursor: 'pointer', padding: '6px 12px' }}>
              📊 Demographics
            </button>
          </div>

          {/* Chat input */}
          <form onSubmit={handleQuerySubmit} className="chat-input-row">
            <input 
              type="text" 
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Type your crime query here..."
              className="chat-input"
              style={{ padding: '10px 14px', borderRadius: '10px' }}
            />
            <button type="button" onClick={triggerVoiceInput} className={`btn-icon ${voiceActive ? 'active' : ''}`} style={{ borderRadius: '10px' }}>
              <Mic size={16} />
            </button>
            <button type="submit" className="btn-primary" style={{ borderRadius: '10px', padding: '10px 16px' }}>
              <Send size={14} />
            </button>
          </form>
        </section>

        {/* Right Console: Context-Specific Insights */}
        <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
          
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '16px' }}>
            <button 
              onClick={() => setActiveTab("network")} 
              style={{ background: activeTab === 'network' ? 'rgba(0,168,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'network' ? 'var(--accent-blue)' : 'var(--text-secondary)', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Network size={16} /> Network Graph
            </button>
            <button 
              onClick={() => setActiveTab("warnings")} 
              style={{ background: activeTab === 'warnings' ? 'rgba(0,168,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'warnings' ? 'var(--accent-blue)' : 'var(--text-secondary)', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <AlertTriangle size={16} /> Risks & Warnings
            </button>
            {(activeRole === 'Administrator' || activeRole === 'Analyst') && (
              <button 
                onClick={() => setActiveTab("audit")} 
                style={{ background: activeTab === 'audit' ? 'rgba(0,168,255,0.1)' : 'transparent', border: 'none', color: activeTab === 'audit' ? 'var(--accent-blue)' : 'var(--text-secondary)', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Database size={16} /> Audit Trails
              </button>
            )}
          </div>

          {/* Tab Content Panels */}
          <div style={{ flexGrow: 1, minHeight: 0, overflowY: 'auto' }}>
            {activeTab === 'network' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="network-canvas-container" style={{ flexGrow: 1 }}>
                  <canvas ref={canvasRef} width={600} height={400} style={{ width: '100%', height: '100%', display: 'block' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
                  Somesh Gowda (Silent Somu) Syndicate. Nodes are draggable & spring-loaded. Active criminals highlighted in rose red.
                </p>
              </div>
            )}

            {activeTab === 'warnings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Security early warnings log</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {earlyWarnings.map((w, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${w.priority === 'Critical' ? 'var(--accent-rose)' : 'var(--accent-amber)'}`, padding: '10px', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.75rem', fontWeight: 600, color: '#FFF', marginBottom: '2px' }}>
                          <span>{w.district} - {w.indicator}</span>
                          <span className={`warning-badge ${w.priority.toLowerCase()}`} style={{ marginLeft: 'auto' }}>{w.priority}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{w.alert_msg}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>District Risk Indexing</h4>
                  <table className="risk-table">
                    <thead>
                      <tr>
                        <th>District</th>
                        <th>Crimes</th>
                        <th>Unemployment</th>
                        <th>Risk Score</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotspots.map((h, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '0.8rem' }}>{h.district}</td>
                          <td>{h.crimeCount}</td>
                          <td>{h.unemployment}%</td>
                          <td style={{ color: h.riskLevel === 'Critical' ? 'var(--accent-rose)' : 'var(--accent-amber)' }}>{h.riskScore}</td>
                          <td><span className={`warning-badge ${h.riskLevel.toLowerCase()}`}>{h.riskLevel}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Authorized Query Audit Logs</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="risk-table">
                    <thead>
                      <tr>
                        <th>Role</th>
                        <th>Query Text</th>
                        <th>Parsed SQL</th>
                        <th>Latency</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.audit_id}>
                          <td><span className="badge-official" style={{ fontSize: '0.6rem' }}>{log.user_role}</span></td>
                          <td style={{ fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.query_text}</td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{log.parsed_sql}</td>
                          <td>{log.execution_time_ms}ms</td>
                          <td style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{log.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
