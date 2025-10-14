
import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const FeatureCard = ({ icon, title, description, index }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={cardRef}
      className={cn(
        "feature-card opacity-0 bg-white rounded-2xl p-8 shadow-sm border border-gray-100",
        "hover:shadow-lg transition-all duration-300"
      )}
      style={{ animationDelay: `${0.1 * index}s` }}
    >
      <div className="rounded-xl bg-black w-14 h-14 flex items-center justify-center text-white mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elements = entry.target.querySelectorAll(".fade-in-element");
            elements.forEach((el, index) => {
              setTimeout(() => {
                el.classList.add("animate-fade-in");
              }, index * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return (
    <section className="py-20 md:py-32 relative bg-white" id="features" ref={sectionRef}>
      <div className="section-container">
        <div className="text-center mb-16">
          <div className="pulse-chip mx-auto mb-4 opacity-0 fade-in-element">
            <span>Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 opacity-0 fade-in-element">
            Secure, Transparent, <br />Revolutionary
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto opacity-0 fade-in-element">
            Built on blockchain technology to provide true ownership, security, and unprecedented flexibility.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Large feature card - top left */}
          <div className="md:row-span-2">
            <div className="bg-black text-white rounded-2xl p-12 h-full flex flex-col justify-center shadow-xl">
              <h3 className="text-4xl font-bold mb-6 leading-tight">
                Meet the 'Satoshi<br />Upgrades'
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Experience the future of event ticketing with blockchain technology that ensures authenticity, transparency, and true ownership.
              </p>
            </div>
          </div>

          {/* Top right card */}
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>}
            title="Beautiful Bitcoin DeFi"
            description="More flexibility, more composability, more security: major upgrades ahead for Bitcoin DeFi on the leading Bitcoin L2."
            index={0}
          />

          {/* Bottom left card */}
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path></svg>}
            title="Self-custodial on-ramps"
            description="Take a look ahead at designs that will eliminate sBTC custody risk by enabling users further control over the underlying BTC."
            index={1}
          />

          {/* Bottom right card */}
          <FeatureCard
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
            title="Sustainable Bitcoin Yields"
            description="Dual-Stacking, Vaults, PoX power-ups and more. Learn what's ahead for those that want real Bitcoin yield."
            index={2}
          />
        </div>
      </div>
    </section>
  );
};

export default Features;
