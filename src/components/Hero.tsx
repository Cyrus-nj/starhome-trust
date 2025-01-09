import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="min-h-screen pt-16 flex items-center bg-gradient-to-br from-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold text-navy leading-tight">
              Invest in Real Estate{" "}
              <span className="text-primary">Globally</span> with Crypto
            </h1>
            <p className="text-lg text-gray-600">
              Empowering individuals to invest in diverse properties worldwide using
              cryptocurrency, ensuring a seamless and innovative process.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg">
                Get Started Today
              </Button>
              <Button size="lg" variant="outline">
                Learn More <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-200 rounded-full filter blur-3xl opacity-30 animate-float"></div>
            <img
              src="/lovable-uploads/b254c8f5-c5c5-4d7d-b9b9-ff1a00699d47.png"
              alt="Real Estate Investment"
              className="relative z-10 w-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;