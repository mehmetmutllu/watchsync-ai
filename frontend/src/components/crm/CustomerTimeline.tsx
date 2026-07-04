"use client";

import React, { useEffect, useState } from "react";
import { getCustomerTimeline, TimelineEvent } from "@/lib/crm-api";
import { FileText, Receipt, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useTranslations } from "next-intl";

interface CustomerTimelineProps {
  customerId: number;
}

export function CustomerTimeline({ customerId }: CustomerTimelineProps) {
  const t = useTranslations("CRM");
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await getCustomerTimeline(customerId);
        setEvents(data);
      } catch (error) {
        console.error("Error fetching timeline", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
        <Clock className="w-12 h-12 text-white/20 mb-4" />
        <h3 className="text-lg font-medium text-white/80 mb-2">{t("timeline_empty_title")}</h3>
        <p className="text-sm text-white/50">{t("timeline_empty_desc")}</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-8 my-4">
      {/* Timeline spine */}
      <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-border-strong to-transparent rounded-full" />
      
      {events.map((event, index) => {
        const isNote = event.type === "note";
        const isInvoice = event.type === "invoice";
        const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
        
        return (
          <div key={event.id} className={`relative group animate-slide-up ${staggerClass} opacity-0 [animation-fill-mode:forwards]`}>
            {/* Glowing Timeline Dot */}
            <div
              className={`absolute -left-[35.5px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-midnight transition-transform duration-300 group-hover:scale-110 ${
                isNote
                  ? "bg-accent-blue"
                  : isInvoice
                    ? "bg-semantic-success"
                    : "bg-accent-gold"
              }`}
            >
              {isNote && <FileText className="w-3 h-3 text-white" />}
              {isInvoice && <Receipt className="w-3 h-3 text-white" />}
            </div>

            {/* Premium Glass Event Card */}
            <div className="glass-strong glass-hover rounded-2xl p-5 ml-2 relative overflow-hidden">
              {/* Subtle background glow depending on type */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-20 ${
                isNote ? "bg-accent-blue" : isInvoice ? "bg-semantic-success" : "bg-accent-gold"
              }`} />
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                <h4 className="text-base font-semibold text-primary-text group-hover:text-white transition-colors">
                  {event.title}
                </h4>
                <span className="text-xs text-secondary-text font-mono bg-background/50 px-2 py-1 rounded-md border border-border-subtle/50">
                  {format(new Date(event.date), "dd. MMM yyyy, HH:mm", { locale: de })}
                </span>
              </div>
              <p className="text-sm text-secondary-text whitespace-pre-wrap leading-relaxed relative z-10">
                {event.description}
              </p>
              <div className="mt-4 flex items-center text-xs text-disabled-text relative z-10">
                <div className="flex items-center gap-1.5 bg-background/40 px-2.5 py-1.5 rounded-lg border border-white/5">
                  <div className="w-4 h-4 rounded-full bg-accent-blue/15 flex items-center justify-center text-[8px] text-accent-blue font-bold">
                    {event.user_name.charAt(0).toUpperCase()}
                  </div>
                  <span>{event.user_name}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
