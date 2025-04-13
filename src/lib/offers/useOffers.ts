import { useState, useCallback, useMemo, useEffect } from 'react';
import { mockOffers } from '@/data/mockOffers';
import { TransportOffer } from '@/types/offers';

export interface OfferFilters {
  searchTerm?: string;
  origin?: string;
  destination?: string;
  platform?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  loadType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

interface UseOffersReturn {
  offers: TransportOffer[];
  isLoading: boolean;
  error: Error | null;
  filters: OfferFilters;
  setFilters: (filters: OfferFilters) => void;
  totalCount: number;
  pageCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  resetFilters: () => void;
}

// Mock API function that will be replaced with real API call
const fetchOffers = async (filters: OfferFilters): Promise<{ data: TransportOffer[]; totalCount: number }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filteredOffers = [...mockOffers];
  
  // Apply filters
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filteredOffers = filteredOffers.filter(offer => 
      offer.id.toLowerCase().includes(term) || 
      offer.origin.toLowerCase().includes(term) || 
      offer.destination.toLowerCase().includes(term) || 
      offer.carrier.toLowerCase().includes(term)
    );
  }
  
  if (filters.origin) {
    filteredOffers = filteredOffers.filter(offer => 
      offer.origin.toLowerCase().includes(filters.origin!.toLowerCase())
    );
  }
  
  if (filters.destination) {
    filteredOffers = filteredOffers.filter(offer => 
      offer.destination.toLowerCase().includes(filters.destination!.toLowerCase())
    );
  }
  
  if (filters.platform && filters.platform !== 'all') {
    filteredOffers = filteredOffers.filter(offer => offer.platform === filters.platform);
  }
  
  if (filters.status && filters.status !== 'all') {
    filteredOffers = filteredOffers.filter(offer => offer.status === filters.status);
  }
  
  if (filters.minPrice) {
    filteredOffers = filteredOffers.filter(offer => {
      const price = parseInt(offer.price.replace(/[^0-9]/g, ''));
      return !isNaN(price) && price >= filters.minPrice!;
    });
  }
  
  if (filters.maxPrice) {
    filteredOffers = filteredOffers.filter(offer => {
      const price = parseInt(offer.price.replace(/[^0-9]/g, ''));
      return !isNaN(price) && price <= filters.maxPrice!;
    });
  }
  
  if (filters.loadType && filters.loadType !== 'all') {
    filteredOffers = filteredOffers.filter(offer => offer.loadType === filters.loadType);
  }
  
  // Apply sorting
  if (filters.sortBy) {
    filteredOffers.sort((a, b) => {
      const direction = filters.sortDirection === 'desc' ? -1 : 1;
      // Add sorting logic based on sortBy field
      return 0; // Placeholder for sorting logic
    });
  }
  
  const totalCount = filteredOffers.length;
  
  // Apply pagination
  const startIndex = ((filters.page || 1) - 1) * (filters.pageSize || 10);
  const endIndex = startIndex + (filters.pageSize || 10);
  filteredOffers = filteredOffers.slice(startIndex, endIndex);
  
  return {
    data: filteredOffers,
    totalCount
  };
};

export const useOffers = (initialFilters: OfferFilters = {}): UseOffersReturn => {
  const [filters, setFilters] = useState<OfferFilters>(initialFilters);
  const [offers, setOffers] = useState<TransportOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Fetch offers when filters change
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, totalCount } = await fetchOffers({
        ...filters,
        page: currentPage,
        pageSize
      });
      
      setOffers(data);
      setTotalCount(totalCount);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch offers'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, pageSize]);
  
  // Update filters
  const updateFilters = useCallback((newFilters: OfferFilters) => {
    setFilters(prev => {
      // Create a new filters object
      const updatedFilters: OfferFilters = { ...prev };
      
      // Go through each key in newFilters
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined) {
          // If value is undefined, remove this key from the filters
          delete updatedFilters[key as keyof OfferFilters];
        } else {
          // Otherwise update with the new value
          updatedFilters[key as keyof OfferFilters] = value;
        }
      });
      
      return updatedFilters;
    });
    setCurrentPage(1); // Reset to first page when filters change
  }, []);
  
  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);
  
  // Calculate page count
  const pageCount = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);
  
  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    offers,
    isLoading,
    error,
    filters,
    setFilters: updateFilters,
    totalCount,
    pageCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    resetFilters
  };
}; 