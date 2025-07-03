import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot, User } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from './ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatConfig {
  ai_chat_enabled: boolean;
  api_provider: string;
  welcome_message: string;
  system_instruction?: string;
  custom_responses: any;
}

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [step, setStep] = useState<'contact' | 'chat'>('contact');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const { t } = useLanguage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChatConfig();
  }, []);

  const fetchChatConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_configurations')
        .select('ai_chat_enabled, api_provider, welcome_message, system_instruction, custom_responses')
        .maybeSingle();

      if (error) {
        console.error('Error fetching chat config:', error);
        return;
      }

      if (data) {
        setIsEnabled(data.ai_chat_enabled || false);
        setChatConfig(data as ChatConfig);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração do chat:', error);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Chat form submitted:', formData);
    
    // Send initial lead data to webhook
    fetch('/api/webhook/chat-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chat_lead',
        contact: formData,
        timestamp: new Date().toISOString()
      })
    }).catch(console.error);

    setStep('chat');
    
    // Add welcome message from bot
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: chatConfig?.welcome_message || `Olá ${formData.name}! Sou seu assistente virtual. Como posso ajudá-lo com imóveis hoje?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  const sendMessageToAI = async (message: string) => {
    try {
      let response;
      
      if (chatConfig?.api_provider === 'google') {
        // Call Gemini API
        response = await fetch('/api/gemini-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            systemInstruction: chatConfig.system_instruction,
            context: {
              name: formData.name,
              previousMessages: messages.slice(-5),
              customResponses: chatConfig.custom_responses
            }
          })
        });
      } else {
        // Call OpenAI API (default)
        response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            systemInstruction: chatConfig?.system_instruction,
            context: {
              name: formData.name,
              previousMessages: messages.slice(-5),
              customResponses: chatConfig?.custom_responses
            }
          })
        });
      }

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('AI Chat Error:', error);
      return 'Desculpe, não consegui processar sua mensagem no momento. Pode tentar novamente?';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Get AI response
    const aiResponse = await sendMessageToAI(currentMessage);
    
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: aiResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const resetChat = () => {
    setStep('contact');
    setMessages([]);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  // Don't render if chat is disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-80 h-96'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Chat IA - Imóveis</h3>
              {!isMinimized && (
                <p className="text-sm text-blue-100">
                  {step === 'contact' ? 'Como podemos ajudar?' : 'Assistente Virtual'}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-blue-800 p-1"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              {step === 'chat' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetChat}
                  className="text-white hover:bg-blue-800 p-1 text-xs"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="p-4 h-full">
              {step === 'contact' ? (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Input
                      placeholder={t('contact.name')}
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder={t('contact.email')}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      placeholder="WhatsApp (DDD) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder={t('contact.message')}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="resize-none h-20"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                    Iniciar Chat IA
                  </Button>
                </form>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-64">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white'
                        }`}>
                          <div className="flex items-start space-x-2">
                            {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            {message.type === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <Input 
                      placeholder="Digite sua mensagem..." 
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit" 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading || !currentMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AIChat;
