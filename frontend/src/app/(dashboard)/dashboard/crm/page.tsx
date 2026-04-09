"use client";

import { Users, Clock } from "lucide-react";

export default function CrmPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-heading text-primary-text font-bold">CRM</h1>
        <p className="text-sm text-secondary-text mt-1">
          Customer relationship management — coming soon.
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="flex flex-col items-center justify-center py-20 bg-surface/50 border border-border-subtle rounded-xl">
        <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-6">
          <Users className="w-8 h-8 text-accent-blue" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold text-primary-text mb-2">
          CRM Module
        </h2>
        <p className="text-sm text-secondary-text max-w-md text-center mb-4">
          Manage your customer relationships, track communications, and automate
          follow-ups. This feature is currently under development.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-gold/10 border border-accent-gold/20">
          <Clock className="w-4 h-4 text-accent-gold" strokeWidth={2} />
          <span className="text-xs font-medium text-accent-gold">
            Planned for Week 9
          </span>
        </div>
      </div>
    </div>
  );
}
