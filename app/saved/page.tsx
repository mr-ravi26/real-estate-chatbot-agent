'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { generateSessionId } from '@/lib/utils';

export default function SavedPropertiesPage() {
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => {
    // Get session ID from localStorage or generate new one
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userSessionId');
      if (stored) return stored;
      const newId = generateSessionId();
      localStorage.setItem('userSessionId', newId);
      return newId;
    }
    return generateSessionId();
  });

  useEffect(() => {
    loadSavedProperties();
  }, [sessionId]);

  const loadSavedProperties = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/saved-properties-details?sessionId=${sessionId}`);
      const data = await response.json();
      setSavedProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading saved properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (propertyId: number) => {
    try {
      const response = await fetch('/api/save-property', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, userSessionId: sessionId }),
      });

      if (response.ok) {
        setSavedProperties(prev => prev.filter(p => p.id !== propertyId));
      }
    } catch (error) {
      console.error('Error removing property:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                  <div className="relative bg-gradient-to-br from-red-500 to-pink-600 p-2 rounded-xl">
                    <Heart className="h-6 w-6 text-white fill-current" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Saved Properties</h1>
                  <p className="text-sm text-muted-foreground">
                    {savedProperties.length} propert{savedProperties.length === 1 ? 'y' : 'ies'} saved
                  </p>
                </div>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Back to Search
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your saved properties...</p>
          </div>
        ) : savedProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-muted/20 blur-3xl rounded-full" />
              <div className="relative bg-muted/10 p-8 rounded-full">
                <Heart className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold mt-4">No saved properties yet</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Start exploring properties and save your favorites by clicking the heart icon on any property card.
            </p>
            <Link href="/">
              <Button className="mt-4 gap-2">
                <Home className="h-4 w-4" />
                Start Searching
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg text-muted-foreground">
                Your favorite properties are saved here. You can review and compare them anytime.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSave={handleUnsave}
                  isSaved={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
