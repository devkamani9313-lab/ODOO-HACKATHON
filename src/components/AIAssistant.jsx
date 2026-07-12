import React, { useState, useRef, useEffect } from 'react';
import { Sparkle, X, PaperPlaneRight, Robot, User, Prohibit } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { askGroq, getFleetContext } from '../services/aiService';

export default function AIAssistant() {
  const { isDemoMode } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am TransitOps AI, your intelligent fleet analyst. How can I help you optimize your fleet operations today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const quickPrompts = [
    "Generate Fleet Performance Summary",
    "Are there any safety compliance issues?",
    "Where are we spending the most money?",
    "Recommend maintenance schedules"
  ];

  const handleSend = async (textToSend) => {
    const prompt = textToSend || inputValue;
    if (!prompt.trim()) return;

    // Clear input
    if (!textToSend) setInputValue('');

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: prompt,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError('');

    try {
      // Get current fleet state
      const fleetContext = await getFleetContext(isDemoMode);
      
      // Query Groq
      const response = await askGroq(prompt, fleetContext);

      // Add AI response
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: response,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to communicate with AI model.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Format response helper to support simple markdown list items, linebreaks and bold words
  const formatResponse = (text) => {
    return text.split('\n').map((line, idx) => {
      // Bold text formatting (e.g. **bold**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      
      // Parse bold elements
      const elements = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }
        elements.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      
      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      // Check if it is a bullet item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc pl-1 text-slate-700 leading-relaxed mb-1">
            {elements.length > 0 ? elements : content}
          </li>
        );
      }

      return (
        <p key={idx} className="text-slate-700 leading-relaxed mb-2 min-h-[1em]">
          {elements.length > 0 ? elements : line}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Sparkle Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-650 text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-white/10 ${
          isOpen ? 'rotate-90' : ''
        }`}
        title="Fleet AI Assistant"
      >
        {isOpen ? <X size={24} /> : <Sparkle size={24} weight="fill" className="animate-pulse" />}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] md:w-[480px] h-[75vh] md:h-[650px] bg-white border border-slate-200/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-650 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkle size={18} weight="fill" className="text-violet-200" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm leading-none tracking-wide">TransitOps AI</h3>
                <span className="text-[10px] text-violet-200 font-medium">Smart Fleet Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-violet-100"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow p-4 overflow-y-auto bg-slate-50/50 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  msg.sender === 'user' 
                    ? 'bg-violet-100 text-violet-600 border-violet-200' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-150'
                }`}>
                  {msg.sender === 'user' ? <User size={14} weight="bold" /> : <Robot size={14} weight="bold" />}
                </div>

                {/* Text Bubble */}
                <div className="space-y-1">
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.sender === 'user' ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-0.5">{formatResponse(msg.text)}</div>
                    )}
                  </div>
                  <span className={`text-[9px] text-slate-400 block ${
                    msg.sender === 'user' ? 'text-right' : ''
                  }`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Loading / Typing Dots */}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-150 flex items-center justify-center flex-shrink-0">
                  <Robot size={14} weight="bold" />
                </div>
                <div className="p-3 bg-white border border-slate-200/80 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce duration-300" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce duration-300" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce duration-300" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 flex items-start gap-2">
                <Prohibit size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">Execution Error</h4>
                  <p className="mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts Panel */}
          {messages.length === 1 && !loading && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/20">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Suggested Fleet Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="p-2 text-left bg-white hover:bg-violet-50 text-slate-655 hover:text-violet-750 text-xs font-semibold border border-slate-200/80 hover:border-violet-200 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 border-t border-slate-200/60 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={loading}
              placeholder="Ask anything about vehicles, drivers, trips..."
              className="flex-grow bg-slate-55 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputValue.trim()}
              className="p-2 rounded-xl bg-violet-600 hover:bg-violet-550 disabled:bg-slate-100 text-white disabled:text-slate-400 transition-all cursor-pointer flex-shrink-0"
            >
              <PaperPlaneRight size={16} weight="fill" />
            </button>
          </div>

        </div>
      )}
    </>
  );
}
