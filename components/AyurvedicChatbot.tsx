'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

// ============ CURATED AYURVEDIC HERB DATA ============
const AYURVEDIC_HERBS: Record<
  string,
  {
    name: string;
    benefits: string[];
    uses: string[];
    precautions: string;
    category: string;
  }
> = {
  ashwagandha: {
    name: 'Ashwagandha (Withania somnifera)',
    benefits: [
      'Reduces stress and anxiety',
      'Improves stamina and energy',
      'Supports immune function',
    ],
    uses: ['Adaptogen for stress relief', 'Sleep improvement', 'Strength and vitality'],
    precautions:
      'Avoid during pregnancy. May interact with thyroid medications and sedatives.',
    category: 'Rasayana (Rejuvenative)',
  },
  turmeric: {
    name: 'Turmeric (Curcuma longa)',
    benefits: [
      'Anti-inflammatory',
      'Antioxidant properties',
      'Supports joint health',
    ],
    uses: ['Arthritis and joint pain', 'Digestive support', 'Skin health'],
    precautions:
      'High doses may cause stomach upset. Avoid with blood thinners.',
    category: 'Anti-inflammatory',
  },
  triphala: {
    name: 'Triphala',
    benefits: ['Detoxifies the body', 'Supports digestion', 'Mild laxative effect'],
    uses: ['Constipation relief', 'Eye health', 'General detoxification'],
    precautions: 'Avoid during pregnancy. May cause loose stools initially.',
    category: 'Digestive',
  },
  brahmi: {
    name: 'Brahmi (Bacopa monnieri)',
    benefits: [
      'Enhances memory and cognition',
      'Reduces anxiety',
      'Supports nervous system',
    ],
    uses: ['Memory improvement', 'Concentration', 'Stress relief'],
    precautions:
      'May cause fatigue or dry mouth. Consult doctor if on thyroid meds.',
    category: 'Medhya (Brain tonic)',
  },
  guduchi: {
    name: 'Guduchi (Tinospora cordifolia)',
    benefits: ['Immune support', 'Anti-inflammatory', 'Rejuvenative'],
    uses: ['Fever management', 'Immunity boost', 'Chronic infections'],
    precautions:
      'Generally safe. May lower blood sugar — monitor if diabetic.',
    category: 'Rasayana (Rejuvenative)',
  },
  neem: {
    name: 'Neem (Azadirachta indica)',
    benefits: ['Antimicrobial', 'Blood purifier', 'Skin health'],
    uses: ['Skin conditions', 'Dental care', 'Detoxification'],
    precautions:
      'Avoid during pregnancy. May affect fertility in high doses.',
    category: 'Antimicrobial',
  },
  shatavari: {
    name: 'Shatavari (Asparagus racemosus)',
    benefits: [
      'Supports female reproductive health',
      'Hormone balance',
      'Immune support',
    ],
    uses: ['Menstrual issues', 'Lactation support', 'General vitality'],
    precautions:
      'Avoid if allergic to asparagus. Consult doctor if on HRT.',
    category: 'Female tonic',
  },
  gokshura: {
    name: 'Gokshura (Tribulus terrestris)',
    benefits: ['Kidney and urinary support', 'Stamina', 'Mental clarity'],
    uses: ['Urinary tract health', 'Kidney stones', 'Vitality'],
    precautions:
      'May affect blood sugar. Avoid with diabetes medication without consultation.',
    category: 'Urinary health',
  },
};

// ============ WIKIPEDIA API HELPER ============
async function fetchWikipediaSummary(medicine: string): Promise<string | null> {
  try {
    const cleanName = medicine.trim().replace(/\s+/g, '_');
    const encodedName = encodeURIComponent(cleanName);

    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedName}`,
      {
        headers: {
          Accept: 'application/json',
          'Api-User-Agent': 'CareFlow-AyurvedicBot/1.0',
        },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.extract || null;
  } catch {
    return null;
  }
}

// ============ MAIN COMPONENT ============
export default function AyurvedicChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([
    {
      role: 'assistant',
      content:
        'Namaste! 🙏 I am your Ayurvedic health assistant. Ask me about any medicine (e.g., "Tell me about Ashwagandha") or general wellness questions. I can also fetch details from Wikipedia.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const formatHerbResponse = (herb: (typeof AYURVEDIC_HERBS)[string]) => {
    return `**${herb.name}**\n\n**Category:** ${herb.category}\n\n**Key Benefits:**\n${herb.benefits
      .map((b) => `• ${b}`)
      .join('\n')}\n\n**Common Uses:**\n${herb.uses
      .map((u) => `• ${u}`)
      .join('\n')}\n\n⚠️ **Precautions:** ${herb.precautions}\n\n---\n*This is for informational purposes only. Always consult your doctor.*`;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const key = text
        .toLowerCase()
        .replace(
          /tell me about|what is|information on|details about|benefits of|uses of/g,
          ''
        )
        .trim();

      // 1. Curated Ayurvedic DB
      const herbData =
        AYURVEDIC_HERBS[key] ||
        Object.values(AYURVEDIC_HERBS).find(
          (h) =>
            h.name.toLowerCase().includes(key) ||
            key.includes(h.name.toLowerCase().split(' ')[0])
        );

      if (herbData) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: formatHerbResponse(herbData) },
        ]);
        setLoading(false);
        return;
      }

      // 2. Wikipedia
      const wikiData = await fetchWikipediaSummary(text);
      if (wikiData && wikiData.length > 50) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**From Wikipedia:**\n\n${wikiData}\n\n---\n*Always consult your doctor before changing medication.*`,
          },
        ]);
        setLoading(false);
        return;
      }

      // 3. OpenAI fallback
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.slice(-6), { role: 'user', content: text }],
        }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            data.content ||
            'Sorry, I could not find information. Please try another medicine name or consult your doctor.',
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    setInput('');
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAsk = (herb: string) => {
    sendMessage(herb);
  };

  // ============ INBUILT CSS ============
  const styles: Record<string, React.CSSProperties> = {
    fab: {
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      width: '3.5rem',
      height: '3.5rem',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.5)',
      zIndex: 1000,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    window: {
      position: 'fixed',
      bottom: '5.5rem',
      right: '1.5rem',
      width: '22rem',
      height: '30rem',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100vh - 7rem)',
      borderRadius: '1rem',
      background: 'white',
      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 1000,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.25rem',
      background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
      color: 'white',
    },
    headerTitle: {
      fontSize: '0.95rem',
      fontWeight: 700,
      margin: 0,
    },
    headerSub: {
      fontSize: '0.7rem',
      opacity: 0.85,
      margin: 0,
    },
    closeBtn: {
      background: 'rgba(255,255,255,0.2)',
      border: 'none',
      color: 'white',
      width: '1.75rem',
      height: '1.75rem',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      background: '#f8fafc',
    },
    inputArea: {
      padding: '0.75rem',
      borderTop: '1px solid #e2e8f0',
      background: 'white',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      height: '2.5rem',
      padding: '0 0.875rem',
      borderRadius: '0.625rem',
      border: '1px solid #e2e8f0',
      fontSize: '0.8rem',
      outline: 'none',
      background: '#f8fafc',
    },
    sendBtn: {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '0.625rem',
      border: 'none',
      background: 'linear-gradient(135deg, #0284c7, #4f46e5)',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'opacity 0.2s',
    },
    suggestionChips: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.375rem',
      padding: '0.75rem',
      background: 'white',
      borderTop: '1px solid #e2e8f0',
    },
    chip: {
      padding: '0.35rem 0.75rem',
      borderRadius: '999px',
      background: '#f0f9ff',
      border: '1px solid #e0f2fe',
      color: '#0369a1',
      fontSize: '0.7rem',
      fontWeight: 600,
      cursor: 'pointer',
    },
  };

  const bubbleStyle = (role: string): React.CSSProperties => ({
    maxWidth: '85%',
    padding: '0.75rem 1rem',
    borderRadius: '0.875rem',
    fontSize: '0.8rem',
    lineHeight: 1.6,
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background:
      role === 'user'
        ? 'linear-gradient(135deg, #0284c7, #4f46e5)'
        : 'white',
    color: role === 'user' ? 'white' : '#1e293b',
    boxShadow:
      role === 'user'
        ? '0 4px 12px -2px rgba(2, 132, 199, 0.3)'
        : '0 2px 6px rgba(15, 23, 42, 0.06)',
    border: role === 'user' ? 'none' : '1px solid #e2e8f0',
    whiteSpace: 'pre-wrap',
  });

  return (
    <>
      {/* FAB */}
      {!isOpen && (
        <button
          style={styles.fab}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow =
              '0 12px 32px -4px rgba(2, 132, 199, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow =
              '0 8px 24px -4px rgba(2, 132, 199, 0.5)';
          }}
          onClick={() => setIsOpen(true)}
          aria-label="Open Ayurvedic Chatbot"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Window */}
      {isOpen && (
        <div style={styles.window}>
          <div style={styles.header}>
            <div>
              <h3 style={styles.headerTitle}>Ayurvedic Assistant</h3>
              <p style={styles.headerSub}>Ask about medicines & wellness</p>
            </div>
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={14} />
            </button>
          </div>

          <div style={styles.messagesArea}>
            {messages.map((msg, i) => (
              <div key={i} style={bubbleStyle(msg.role)}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  ...bubbleStyle('assistant'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Thinking...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div style={styles.suggestionChips}>
              {['Ashwagandha', 'Turmeric', 'Triphala', 'Brahmi'].map((herb) => (
                <button
                  key={herb}
                  style={styles.chip}
                  onClick={() => handleQuickAsk(herb)}
                >
                  {herb}
                </button>
              ))}
            </div>
          )}

          <div style={styles.inputArea}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a medicine..."
              disabled={loading}
            />
            <button
              style={{
                ...styles.sendBtn,
                ...(loading || !input.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}