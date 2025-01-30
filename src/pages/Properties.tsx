import { useState, useEffect } from "react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyShimmerCard } from "@/components/ui/shimmer-cards";
import { usePropertyRead } from "@/hooks/contract_interactions/usePropertiesReads";
import { Property } from "@/types/property";
import { PropertySearch } from "@/components/property/PropertySearch";
import { PropertyFilters } from "@/components/property/PropertyFilters";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Building, AlertCircle } from "lucide-react";

const Properties = () => {
  const { 
    saleProperties: properties, 
    salePropertiesLoading: isLoading,
    salePropertiesError: error 
  } = usePropertyRead();

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    priceRange: [0, 15000000],
    bedrooms: "any",
    bathrooms: "any",
    propertyType: "any",
  });

  useEffect(() => {
    if (error) {
      console.error("[Properties] Error loading properties:", error);
      toast.error("Failed to load properties. Please try again later.");
    }
  }, [error]);

  useEffect(() => {
    console.log("[Properties] Current properties:", properties);
  }, [properties]);

  const filteredProperties = properties
    ?.filter((property: Property) => {
      // Ensure all values are strings before using toLowerCase()
      const titleMatch = property.title
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const cityMatch = property.city
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const countryMatch = property.country
        .toString()
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSearch = titleMatch || cityMatch || countryMatch;

      const matchesPriceRange =
        property.price >= filters.priceRange[0] &&
        property.price <= filters.priceRange[1];

      const matchesBedrooms =
        filters.bedrooms === "any" ||
        property.bedrooms.toString() === filters.bedrooms;

      const matchesBathrooms =
        filters.bathrooms === "any" ||
        property.bathrooms.toString() === filters.bathrooms;

      const matchesPropertyType =
        filters.propertyType === "any" ||
        property.propertyType === filters.propertyType;

      return (
        matchesSearch &&
        matchesPriceRange &&
        matchesBedrooms &&
        matchesBathrooms &&
        matchesPropertyType
      );
    }) || [];

  const EmptyState = () => (
    <Card className="p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <AlertCircle className="h-12 w-12 text-destructive" />
        ) : (
          <Building className="h-12 w-12 text-muted-foreground" />
        )}
        <div>
          <h3 className="text-lg font-semibold">
            {error ? "Failed to Load Properties" : "No Properties Found"}
          </h3>
          <p className="text-muted-foreground">
            {error 
              ? "There was an error loading the properties. Please try again later."
              : "No properties found matching your criteria"}
          </p>
        </div>
      </div>
    </Card>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <PropertyShimmerCard key={index} />
          ))}
        </div>
      );
    }

    if (error || !filteredProperties.length) {
      return <EmptyState />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property: Property) => (
          <PropertyCard
            key={property.id}
            id={property.id}
            title={property.title}
            location={{
              city: property.city,
              state: property.state,
              country: property.country,
            }}
            price={property.price}
            askingPrice={property.asking_price}
            interestedClients={property.interestedClients}
            annualGrowthRate={property.annualGrowthRate}
            imagesUrl={property.imagesId}
            propertyType={property.propertyType}
            status={property.status}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6">Properties</h1>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <PropertyFilters
                onFilterChange={(newFilters) => setFilters(newFilters)}
              />
            </div>
            <div className="lg:col-span-3">
              <PropertySearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Properties;