'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { PropertyCard } from '@/components/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { generateSessionId } from '@/lib/utils';

export default function AllPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  useEffect(() => {
    loadAllProperties();
    loadSavedProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, properties]);

  const loadAllProperties = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/properties');
      const data = await response.json();
      setProperties(data.properties || []);
      setFilteredProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedProperties = async () => {
    try {
      const response = await fetch(`/api/save-property?sessionId=${sessionId}`);
      const data = await response.json();
      if (data.savedProperties) {
        setSavedProperties(new Set(data.savedProperties));
      }
    } catch (error) {
      console.error('Error loading saved properties:', error);
    }
  };

  const filterProperties = () => {
    if (!searchTerm.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = properties.filter(
      (property) =>
        property.title.toLowerCase().includes(term) ||
        property.location.toLowerCase().includes(term) ||
        property.amenities.some((amenity) =>
          amenity.toLowerCase().includes(term)
        )
    );
    setFilteredProperties(filtered);
  };

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
          setSavedProperties((prev) => {
            const newSet = new Set(prev);
            newSet.delete(propertyId);
            return newSet;
          });
        }
      } else {
        const response = await fetch('/api/save-property', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId, userSessionId: sessionId }),
        });

        if (response.ok) {
          setSavedProperties((prev) => new Set(prev).add(propertyId));
        }
      }
    } catch (error) {
      console.error('Error saving property:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">All Properties</h1>
              </div>
            </div>
            <Link href="/saved">
              <Button variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Saved Properties
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by location, title, or amenities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 h-12 bg-background/50 backdrop-blur-sm"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredProperties.length} of {properties.length} properties
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading properties...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProperties.length === 0 && (
          <div className="text-center py-20">
            <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No properties available at the moment'}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')}>Clear Search</Button>
            )}
          </div>
        )}

        {/* Properties Grid */}
        {!isLoading && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
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
  );
}
