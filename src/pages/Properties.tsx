import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { PropertySearch } from "@/components/property/PropertySearch";
import { Badge } from "@/components/ui/badge";
import propertiesData from "@/data/properties.json";
import { useState } from "react";

const Properties = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredProperties = propertiesData.properties.filter((property) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      property.title.toLowerCase().includes(searchLower) ||
      property.location.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto py-24">
        <h1 className="text-4xl font-bold mb-8 text-center">Available Properties</h1>
        
        <PropertySearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <ScrollArea className="h-[800px] w-full rounded-md border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden relative">
                <Badge 
                  variant="secondary" 
                  className="absolute top-4 right-4 bg-green-500 text-white hover:bg-green-600"
                >
                  For Sale
                </Badge>
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <CardHeader>
                  <CardTitle>{property.title}</CardTitle>
                  <CardDescription>{property.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(property.totalInvestment)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{property.investors}</p>
                      <p className="text-muted-foreground">Investors</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{property.roi}</p>
                      <p className="text-muted-foreground">Expected ROI</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link to={`/properties/${property.id}`} className="w-full">
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Properties;