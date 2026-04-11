import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import { MessageCircle, Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversations();
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (appId) => {
    try {
      setMessagesLoading(true);
      const response = await messagesAPI.getConversation(appId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Load messages error:', error);
      toast.error("Xabarlarni yuklashda xatolik");
    } finally {
      setMessagesLoading(false);
    }
  };

  const selectConversation = (conv) => {
    setSelectedConversation(conv);
    loadMessages(conv.application_id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await messagesAPI.sendMessage(selectedConversation.application_id, newMessage);
      setNewMessage('');
      loadMessages(selectedConversation.application_id);
      loadConversations();
    } catch (error) {
      console.error('Send message error:', error);
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Conversations List */}
      <div className={`w-full ${selectedConversation ? 'hidden lg:block lg:w-1/3' : 'w-full'} bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)] overflow-hidden`}>
        <div className="p-4 border-b border-[var(--border-main)] bg-[var(--bg-card)]">
          <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
            <MessageCircle size={24} />
            Suhbatlar
          </h2>
        </div>

        <div className="overflow-y-auto h-[calc(100%-70px)]">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Suhbatlar yo'q</p>
              <p className="text-sm mt-2">Ishga ariza berish orqali suhbat boshlang</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.application_id}
                onClick={() => selectConversation(conv)}
                className={`p-4 border-b border-[var(--border-main)] cursor-pointer hover:bg-[var(--bg-card)] transition-colors ${
                  selectedConversation?.application_id === conv.application_id ? 'bg-[var(--bg-card)] border-l-4 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-[var(--text-main)] truncate">{conv.job_title}</h3>
                    <p className="text-sm text-[var(--text-muted)] truncate">{conv.other_user_name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 truncate">{conv.last_message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {conv.unread_count > 0 && (
                      <span className="bg-indigo-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {formatTime(conv.last_message_time)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[var(--border-main)] bg-[var(--bg-card)] flex items-center justify-between">
            <div>
              <h3 className="font-black text-[var(--text-main)]">{selectedConversation.job_title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{selectedConversation.other_user_name}</p>
            </div>
            <button
              onClick={() => setSelectedConversation(null)}
              className="lg:hidden p-2 hover:bg-[var(--bg-main)] rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] py-8">
                <p>Xabar yo'q. Suhbatni boshlang!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender_id === user?.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-main)]'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? 'text-indigo-200' : 'text-[var(--text-muted)]'}`}>
                      {msg.sender_name} • {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-card)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Xabar yozing..."
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-xl px-4 py-3 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-main)]">
          <div className="text-center text-[var(--text-muted)]">
            <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-black">Suhbatni tanlang</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;