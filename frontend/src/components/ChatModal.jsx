import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI, applicationsAPI } from '../services/api';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';

const ChatModal = ({ applicationId, jobTitle, candidateName, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [applicationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversation(applicationId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await messagesAPI.sendMessage(applicationId, newMessage);
      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)] shadow-2xl overflow-hidden flex flex-col" style={{ height: '500px' }}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
          <div>
            <h3 className="font-black text-[var(--text-main)]">Chat</h3>
            <p className="text-xs text-[var(--text-muted)]">{jobTitle} - {candidateName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-main)] rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-[var(--text-muted)] py-8">
              Xabar yo'q. Suhbatni boshlang!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl ${
                  msg.sender_id === user?.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-[var(--bg-card)] text-[var(--text-main)]'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-[var(--text-muted)]'}`}>
                    {msg.sender_name} • {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-card)]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Xabar yozing..."
              className="flex-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;