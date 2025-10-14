import React, { useState } from "react";
import { Calendar, ChevronDown, CheckCircle2 } from "lucide-react";
import { addToGoogleCalendar, addToAppleCalendar, addToOutlookCalendar } from "@/lib/calendar";

interface AddToCalendarProps {
  eventName: string;
  eventDate: string;
  eventTime: string;
  location: string;
  description?: string;
  ticketId?: string;
  variant?: "button" | "icon";
  className?: string;
}

const AddToCalendar: React.FC<AddToCalendarProps> = ({
  eventName,
  eventDate,
  eventTime,
  location,
  description,
  ticketId,
  variant = "button",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const eventData = {
    eventName,
    eventDate,
    eventTime,
    location,
    description,
    ticketId
  };

  const handleAddToCalendar = (provider: "google" | "apple" | "outlook") => {
    switch (provider) {
      case "google":
        addToGoogleCalendar(eventData);
        break;
      case "apple":
        addToAppleCalendar(eventData);
        break;
      case "outlook":
        addToOutlookCalendar(eventData);
        break;
    }
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsOpen(false);
    }, 2000);
  };

  const calendarOptions = [
    {
      id: "google",
      name: "Google Calendar",
      icon: "📅",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "apple",
      name: "Apple Calendar",
      icon: "🍎",
      color: "from-gray-600 to-gray-700"
    },
    {
      id: "outlook",
      name: "Outlook Calendar",
      icon: "📧",
      color: "from-blue-600 to-indigo-600"
    }
  ];

  if (variant === "icon") {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2 bg-[#0A0A0A] border border-gray-800 rounded-lg hover:border-[#FE5C02] transition-colors ${className}`}
          title="Add to Calendar"
        >
          <Calendar className="w-5 h-5 text-gray-400" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-64 bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-800">
                <p className="text-sm font-semibold text-white">Add to Calendar</p>
                <p className="text-xs text-gray-400 mt-0.5">Never miss your event</p>
              </div>
              
              {showSuccess ? (
                <div className="p-4 flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-green-500">Added to Calendar!</p>
                </div>
              ) : (
                <div className="p-2">
                  {calendarOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAddToCalendar(option.id as any)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#0A0A0A] transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center text-xl`}>
                        {option.icon}
                      </div>
                      <span className="text-sm font-medium text-white group-hover:text-[#FE5C02] transition-colors">
                        {option.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Button variant
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0A] border border-gray-800 hover:border-[#FE5C02] text-white rounded-lg transition-colors ${className}`}
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Add to Calendar</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-2 w-64 bg-[#1A1A1A] border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-800">
              <p className="text-sm font-semibold text-white">Choose Calendar</p>
              <p className="text-xs text-gray-400 mt-0.5">Get reminder before event</p>
            </div>
            
            {showSuccess ? (
              <div className="p-4 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                <p className="text-sm font-medium text-green-500">Added to Calendar!</p>
              </div>
            ) : (
              <div className="p-2">
                {calendarOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAddToCalendar(option.id as any)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#0A0A0A] transition-colors group"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center text-xl`}>
                      {option.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white group-hover:text-[#FE5C02] transition-colors">
                        {option.name}
                      </p>
                      <p className="text-xs text-gray-500">1 day reminder</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="p-3 bg-[#0A0A0A] border-t border-gray-800">
              <p className="text-xs text-gray-500 text-center">
                📱 Sync across all your devices
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddToCalendar;
