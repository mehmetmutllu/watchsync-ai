"use client";

import React, { useState } from "react";
import { MessageCircle, X, Gift, Clock, Tag, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Customer } from "@/lib/crm-api";
import { getWhatsAppLink, WhatsAppTemplateKey } from "@/lib/whatsapp";

interface CustomerQuickActionsProps {
  customer: Customer;
}

export function CustomerQuickActions({ customer }: CustomerQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("CRM");

  const templates: { key: WhatsAppTemplateKey; icon: React.ReactNode; label: string; text: string }[] = [
    {
      key: "birthday",
      icon: <Gift className="w-4 h-4 mr-3" />,
      label: t("wa_template_birthday"),
      text: t("wa_text_birthday", { name: customer.first_name }),
    },
    {
      key: "followUp",
      icon: <Clock className="w-4 h-4 mr-3" />,
      label: t("wa_template_followup"),
      text: t("wa_text_followup", { name: customer.first_name }),
    },
    {
      key: "offer",
      icon: <Tag className="w-4 h-4 mr-3" />,
      label: t("wa_template_offer"),
      text: t("wa_text_offer", { name: customer.first_name }),
    },
    {
      key: "custom",
      icon: <MessageSquare className="w-4 h-4 mr-3" />,
      label: t("wa_template_custom"),
      text: t("wa_text_custom", { name: customer.first_name }),
    },
  ];

  const handleSelectTemplate = (text: string) => {
    const link = getWhatsAppLink(customer.phone, text);
    window.open(link, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title={t("whatsapp_action")}
        className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#25D366]/20 text-white/50 hover:text-[#25D366] flex items-center justify-center transition-colors border border-white/5"
      >
        <MessageCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
          <div 
            className="bg-[#0f0f11] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-[#151518]">
              <div className="flex items-center text-[#25D366] font-medium">
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp an {customer.first_name}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-2 flex flex-col gap-1">
              <div className="px-3 pt-2 pb-1 text-xs font-medium text-white/40 uppercase tracking-wider">
                {t("quick_actions")}
              </div>
              {templates.map((tpl) => (
                <button
                  key={tpl.key}
                  onClick={() => handleSelectTemplate(tpl.text)}
                  className="flex items-center w-full px-3 py-3 text-sm text-left hover:bg-white/5 rounded-xl transition-colors group"
                >
                  <div className="text-white/40 group-hover:text-[#25D366] transition-colors">
                    {tpl.icon}
                  </div>
                  <div>
                    <div className="font-medium text-white/90">{tpl.label}</div>
                    <div className="text-xs text-white/40 line-clamp-1 mt-0.5">{tpl.text}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
