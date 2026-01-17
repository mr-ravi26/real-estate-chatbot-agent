'use client';

import React from 'react';
import { Property } from '@/lib/types';
import { formatPrice } from '@/lib/propertyUtils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, Bed, Bath, Ruler, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PropertyCardProps {
  property: Property;
  onSave?: (propertyId: number) => void;
  isSaved?: boolean;
}

export function PropertyCard({ property, onSave, isSaved = false }: PropertyCardProps) {
  const handleSave = () => {
    if (onSave) {
      onSave(property.id);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        <Image
          src={property.image_url}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-3 right-3">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all',
              isSaved && 'text-red-500'
            )}
            onClick={handleSave}
          >
            <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
          </Button>
        </div>
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-semibold">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span>Featured</span>
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">{property.title}</h3>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">{property.location}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-3">
        <div className="text-2xl font-bold text-primary">{formatPrice(property.price)}</div>
        
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/50">
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-semibold">{property.bedrooms}</div>
              <div className="text-xs text-muted-foreground">Beds</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-semibold">{property.bathrooms}</div>
              <div className="text-xs text-muted-foreground">Baths</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-semibold">{property.size_sqft}</div>
              <div className="text-xs text-muted-foreground">sqft</div>
            </div>
          </div>
        </div>

        {property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {property.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-medium">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/property/${property.id}`} className="w-full">
          <Button className="w-full" size="sm">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
