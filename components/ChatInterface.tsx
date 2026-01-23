'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { PropertyCard } from './PropertyCard';
import { TypingIndicator } from './TypingIndicator';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, Sparkles, Home, TrendingUp, MessageSquare, Heart, Zap } from 'lucide-react';
import { generateSessionId } from '@/lib/utils';
import Link from 'next/link';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "👋 Hi! I'm **Agent Mira**, your AI real estate assistant. I'll help you find your dream property.\n\nTell me what you're looking for - budget, location, bedrooms, amenities, or any preferences!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userSessionId');
      if (stored) return stored;
      const newId = generateSessionId();
      localStorage.setItem('userSessionId', newId);
      return newId;
    }
    return generateSessionId();
  });
  const [savedProperties, setSavedProperties] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetch(`/api/save-property?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.savedProperties) {
          setSavedProperties(new Set(data.savedProperties));
        }
      })
      .catch(console.error);
  }, [sessionId]);

  const handleSaveProperty = async (propertyId: number) => {
    const isSaved = savedProperties.has(propertyId);
    
    try {
      if (isSaved) {
        const response = await fetch('/api/save-property', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId, userSessionId: sessionId }),
        });
        
        if (response.ok) {
          setSavedProperties(prev => {
            const next = new Set(prev);
            next.delete(propertyId);
            return next;
          });
        }
      } else {
        const response = await fetch('/api/save-property', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId, userSessionId: sessionId }),
        });
        
        if (response.ok) {
          setSavedProperties(prev => new Set(prev).add(propertyId));
        }
      }
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        properties: data.properties,
        suggestions: data.suggestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    '2 BHK under $500K in New York',
    'Luxury properties with pool',
    '3 bedroom house in California',
    'Studio apartment under $300K',
    'Properties with parking and gym',
    '4 bedroom villa in Miami',
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    // Send the message directly
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: prompt,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      }),
    })
      .then(response => response.json())
      .then(data => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          properties: data.properties,
          suggestions: data.suggestions,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      })
      .catch(error => {
        console.error('Error:', error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsTyping(false);
      });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="relative bg-gradient-to-br from-primary to-purple-600 p-2 rounded-xl">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  Agent Mira
                </h1>
                <p className="text-sm text-muted-foreground">AI Real Estate Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm">
                <Link href="/properties">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Home className="h-4 w-4" />
                    <span>10+ Properties</span>
                  </Button>
                </Link>
              </div>
              <Link href="/saved">
                <Button variant="outline" className="gap-2 relative">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Saved</span>
                  {savedProperties.size > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {savedProperties.size}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 h-full flex flex-col">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`max-w-4xl w-full ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-none p-4 shadow-sm">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content.split('\n').map((line, i) => {
                              const boldRegex = /\*\*(.*?)\*\*/g;
                              const parts = line.split(boldRegex);
                              return (
                                <p key={i} className="mb-2 last:mb-0">
                                  {parts.map((part, j) => 
                                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                                  )}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                        
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickPrompt(suggestion)}
                                className="text-xs bg-background/50 hover:bg-background border-primary/20 hover:border-primary/40 transition-all"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        {message.properties && message.properties.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {message.properties.map((property) => (
                              <PropertyCard
                                key={property.id}
                                property={property}
                                onSave={handleSaveProperty}
                                isSaved={savedProperties.has(property.id)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {message.role === 'user' && (
                    <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 shadow-sm max-w-md">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-none p-4 shadow-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="pb-6 pt-4">
            {showQuickPrompts && (
              <div className="mb-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Quick Searches</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuickPrompts(false)}
                    className="text-xs h-7"
                  >
                    Hide
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="text-xs"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg p-2">
              <div className="flex gap-2">
                {!showQuickPrompts && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowQuickPrompts(true)}
                    className="rounded-xl flex-shrink-0"
                    title="Quick Searches"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                )}
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your preferences... (e.g., '2 BHK under $500K in Miami with parking')"
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  size="icon"
                  className="rounded-xl flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-center text-xs text-muted-foreground mt-3">
              Powered by AI • Agent Mira v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
