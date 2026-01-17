'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, MapPin, Bed, Bath, Ruler, Share2, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/propertyUtils';
import { generateSessionId } from '@/lib/utils';

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
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

  useEffect(() => {
    loadPropertyDetails();
    checkIfSaved();
  }, [params.id]);

  const loadPropertyDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/property/${params.id}`);
      const data = await response.json();
      setProperty(data.property);
    } catch (error) {
      console.error('Error loading property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await fetch(`/api/save-property?sessionId=${sessionId}`);
      const data = await response.json();
      if (data.savedProperties) {
        setIsSaved(data.savedProperties.includes(parseInt(params.id)));
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async () => {
    try {
      if (isSaved) {
        const response = await fetch('/api/save-property', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: parseInt(params.id), userSessionId: sessionId }),
        });
        if (response.ok) {
          setIsSaved(false);
        }
      } else {
        const response = await fetch('/api/save-property', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: parseInt(params.id), userSessionId: sessionId }),
        });
        if (response.ok) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-4">The property you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant={isSaved ? "default" : "outline"}
                className="gap-2"
                onClick={handleToggleSave}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Image Section */}
        <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8 bg-muted">
          <Image
            src={property.image_url}
            alt={property.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="h-5 w-5" />
                <span className="text-lg">{property.location}</span>
              </div>
              <div className="text-4xl font-bold text-primary">{formatPrice(property.price)}</div>
            </div>

            {/* Key Features */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">Property Features</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-accent/50 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Bed className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{property.bedrooms}</div>
                  <div className="text-sm text-muted-foreground">Bedrooms</div>
                </div>
                <div className="text-center">
                  <div className="bg-accent/50 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Bath className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{property.bathrooms}</div>
                  <div className="text-sm text-muted-foreground">Bathrooms</div>
                </div>
                <div className="text-center">
                  <div className="bg-accent/50 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <Ruler className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{property.size_sqft}</div>
                  <div className="text-sm text-muted-foreground">Sq Ft</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">About This Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                This beautiful {property.bedrooms} bedroom, {property.bathrooms} bathroom property is located in the heart of {property.location}. 
                With {property.size_sqft} square feet of living space, this home offers the perfect blend of comfort and style. 
                The property features modern amenities and is situated in a prime location with easy access to local attractions, 
                shopping centers, and transportation.
              </p>
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-accent/30 rounded-lg px-4 py-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Contact Agent</h3>
              <div className="space-y-3">
                <Button className="w-full gap-2" size="lg">
                  <Phone className="h-4 w-4" />
                  Call Now
                </Button>
                <Button variant="outline" className="w-full gap-2" size="lg">
                  <Mail className="h-4 w-4" />
                  Send Message
                </Button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-border/50">
                <h4 className="font-semibold mb-3">Schedule a Tour</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Visit this property and see it for yourself. Book a tour today!
                </p>
                <Button variant="outline" className="w-full">
                  Book Tour
                </Button>
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Property Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property ID</span>
                  <span className="font-medium">#{property.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Type</span>
                  <span className="font-medium">Residential</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year Built</span>
                  <span className="font-medium">2020</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-green-500">Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
