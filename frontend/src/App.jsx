import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

const BACKEND_URL = 'http://localhost:4000';

const EXAMPLE_QUESTIONS = [
  "Which country has the lowest base price?",
  "Compare base prices across all 5 countries",
  "What battery options are available?",
  "Cheapest configuration in Germany?",
  "What's the VAT rate for each country?",
  "Which packages are free (standard) in Germany?",
  "What roof types are available and where?",
  "How many total combinations exist across all countries?",
  "What colors are available at no extra cost?",
  "Is the high roof available in Spain?",
];

export default function App() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your Mercedes eSprinter configurator analyst. I have data on all valid combinations across France, Italy, Spain, Germany, and the UK — covering batteries, motors, lines, colors, packages, and pricing. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chips, setChips] = useState(EXAMPLE_QUESTIONS.slice(0, 4));
  const [showChips, setShowChips] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const rotateChips = () => {
    const shuffled = [...EXAMPLE_QUESTIONS].sort(() => Math.random() - 0.5);
    setChips(shuffled.slice(0, 4));
  };

  const sendMessage = async (text) => {
    const query = (text || input).trim();
    if (!query || isLoading) return;

    setInput('');
    setShowChips(false);
    setIsLoading(true);

    const userMsg = { role: 'user', content: query };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      const answer = data.answer || 'Sorry, I could not generate a response.';

      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      rotateChips();
      setShowChips(true);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Could not connect to the server. Make sure the backend is running on port 4000.',
          error: true
        }
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EEEDFE',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '760px',
        height: '88vh',
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 8px 40px rgba(83,74,183,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          background: '#534AB7',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.2)',
            lineHeight: 1,
            userSelect: 'none'
          }}>#</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff', letterSpacing: '0.03em' }}>
              INSTADATA.WORKS
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.65)' }}>
              Mercedes eSprinter — Configurator Intelligence
            </p>
          </div>
          <div style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: 'rgba(255,255,255,0.12)',
            border: '0.5px solid rgba(255,255,255,0.25)',
            borderRadius: '20px',
            padding: '5px 13px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.85)'
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5DCAA5' }} />
            AI ready
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: '#F7F6FF'
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: '10px'
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#534AB7', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, flexShrink: 0
                }}>AI</div>
              )}

              <div style={{
                maxWidth: '75%',
                padding: '11px 15px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user'
                  ? '#534AB7'
                  : msg.error ? '#FCEBEB' : '#fff',
                color: msg.role === 'user'
                  ? '#fff'
                  : msg.error ? '#A32D2D' : '#1a1a2e',
                fontSize: '14px',
                lineHeight: '1.65',
                border: msg.role === 'assistant' && !msg.error
                  ? '0.5px solid #CECBF6'
                  : msg.error ? '0.5px solid #F09595' : 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: '#AFA9EC', color: '#26215C',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 600, flexShrink: 0
                }}>You</div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: '#534AB7', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 600, flexShrink: 0
              }}>AI</div>
              <div style={{
                padding: '12px 16px',
                background: '#fff',
                border: '0.5px solid #CECBF6',
                borderRadius: '16px 16px 16px 4px',
                display: 'flex', gap: '5px', alignItems: 'center'
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#7F77DD',
                    animation: 'blink 1.2s ease-in-out infinite',
                    animationDelay: `${delay}s`
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        {showChips && (
          <div style={{
            padding: '10px 20px 6px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            background: '#F7F6FF',
            borderTop: '0.5px solid #CECBF6'
          }}>
            {chips.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} style={{
                background: '#fff',
                border: '0.5px solid #AFA9EC',
                color: '#534AB7',
                borderRadius: '20px',
                padding: '5px 13px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s'
              }}
                onMouseEnter={e => {
                  e.target.style.background = '#EEEDFE';
                  e.target.style.borderColor = '#534AB7';
                }}
                onMouseLeave={e => {
                  e.target.style.background = '#fff';
                  e.target.style.borderColor = '#AFA9EC';
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{
          padding: '14px 20px',
          background: '#fff',
          borderTop: '0.5px solid #CECBF6',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end'
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the eSprinter configurator data…"
            disabled={isLoading}
            rows={1}
            style={{
              flex: 1,
              border: '0.5px solid #CECBF6',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'none',
              minHeight: '42px',
              maxHeight: '120px',
              background: '#F7F6FF',
              color: '#1a1a2e',
              outline: 'none',
              transition: 'border-color 0.15s',
              lineHeight: '1.5'
            }}
            onFocus={e => e.target.style.borderColor = '#534AB7'}
            onBlur={e => e.target.style.borderColor = '#CECBF6'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            style={{
              width: 42, height: 42,
              borderRadius: '10px',
              background: input.trim() && !isLoading ? '#534AB7' : '#AFA9EC',
              border: 'none',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.15s, transform 0.1s'
            }}
            onMouseEnter={e => { if (input.trim() && !isLoading) e.target.style.background = '#3C3489'; }}
            onMouseLeave={e => { if (input.trim() && !isLoading) e.target.style.background = '#534AB7'; }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isLoading
              ? <Loader2 size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={18} color="#fff" />
            }
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,80%,100% { opacity: 0.2; } 40% { opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #CECBF6; border-radius: 2px; }
      `}</style>
    </div>
  );
}