"use client";

import React, { useMemo } from "react";
import { Customer } from "@/lib/crm-api";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  MeasuringStrategy,
  useDroppable,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, Tag, MapPin, Building, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

import { CustomerQuickActions } from "./CustomerQuickActions";

interface KanbanBoardProps {
  customers: Customer[];
  onStageChange: (customerId: number, newStage: string) => void;
  onCustomerClick: (customer: Customer) => void;
}

const STAGES = [
  { id: "lead", titleKey: "kanban_lead", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  { id: "sourcing", titleKey: "kanban_sourcing", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "negotiating", titleKey: "kanban_negotiating", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "sold", titleKey: "kanban_sold", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

function CustomerCardUI({ customer, isOverlay, listeners, attributes }: { customer: Customer, isOverlay?: boolean, listeners?: any, attributes?: any }) {
  const t = useTranslations("CRM");
  return (
    <div
      className={`bg-[#0f0f11] border rounded-xl p-4 shadow-lg group relative ${
        isOverlay ? "border-white/20 cursor-grabbing bg-[#1a1a1f] opacity-90 w-full h-full z-50 shadow-2xl" : "transition-all border-white/5 hover:border-white/20 hover:bg-[#1a1a1f] cursor-pointer"
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`absolute top-4 right-2 p-1 transition-opacity ${
          isOverlay ? "text-white/60 cursor-grabbing opacity-100" : "text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="flex justify-between items-start mb-2 pr-6 relative">
        <h4 className="font-semibold text-white/90 truncate flex items-center gap-2">
          {customer.first_name} {customer.last_name}
          {customer.needs_follow_up && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" title={t("follow_up_due")}></span>
          )}
        </h4>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {customer.vip_tier && customer.vip_tier !== 'Standard' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
            customer.vip_tier === 'Platinum' ? 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900 shadow-[0_0_8px_rgba(226,232,240,0.5)]' :
            customer.vip_tier === 'Gold' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
            'bg-gray-400/20 text-gray-300 border border-gray-400/30'
          }`}>
            {customer.vip_tier}
          </span>
        )}
        
        {customer.company && (
          <div className="flex items-center text-xs text-white/50">
            <Building className="w-3 h-3 mr-1.5" />
            <span className="truncate max-w-[120px]">{customer.company}</span>
          </div>
        )}
      </div>
      
      {customer.metadata?.desired_watch && (
        <div className="flex items-center text-xs text-amber-400/80 mb-2 bg-amber-400/10 rounded px-2 py-0.5 w-fit">
          <Clock className="w-3 h-3 mr-1.5" />
          <span className="truncate max-w-[150px]">{customer.metadata.desired_watch}</span>
        </div>
      )}

      <div className="flex justify-between items-end mt-3">
        <div className="flex gap-2 overflow-x-hidden">
          {customer.tags && customer.tags.slice(0, 2).map((tag: string) => (
            <span key={tag} className="text-[10px] bg-white/5 text-white/60 px-1.5 py-0.5 rounded flex items-center whitespace-nowrap">
              <Tag className="w-2.5 h-2.5 mr-1" />
              {tag}
            </span>
          ))}
        </div>
        <div className="shrink-0" onClick={e => e.stopPropagation()}>
          <CustomerQuickActions customer={customer} />
        </div>
      </div>
    </div>
  );
}

function SortableCustomerCard({ customer, onClick }: { customer: Customer; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: customer.id, data: { type: "Customer", customer } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-30">
        <CustomerCardUI customer={customer} listeners={listeners} attributes={attributes} />
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} onClick={onClick}>
      <CustomerCardUI customer={customer} listeners={listeners} attributes={attributes} />
    </div>
  );
}

function DroppableColumn({ stage, customers, onCustomerClick }: { stage: typeof STAGES[0]; customers: Customer[]; onCustomerClick: (c: Customer) => void }) {
  const t = useTranslations("CRM");
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  return (
    <div ref={setNodeRef} className="flex flex-col flex-1 min-w-[300px] bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
      <div className={`px-4 py-3 border-b flex justify-between items-center ${stage.color}`}>
        <h3 className="font-medium text-sm">{t(stage.titleKey)}</h3>
        <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">{customers.length}</span>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
        <SortableContext id={stage.id} items={customers.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[150px] flex flex-col gap-3">
            {customers.map((customer) => (
              <SortableCustomerCard 
                key={customer.id} 
                customer={customer} 
                onClick={() => onCustomerClick(customer)} 
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ customers, onStageChange, onCustomerClick }: KanbanBoardProps) {
  const [activeCustomer, setActiveCustomer] = React.useState<Customer | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const customer = customers.find(c => c.id === active.id);
    if (customer) {
      setActiveCustomer(customer);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCustomer(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Finde den Kunden
    const activeCustomer = customers.find(c => c.id === activeId);
    if (!activeCustomer) return;

    // Bestimme die neue Stage (entweder wurde auf eine Karte gedroppt, oder auf die leere Spalte)
    let newStage = activeCustomer.pipeline_stage || "lead";
    
    // Ist 'over' eine Spalte?
    if (STAGES.some(s => s.id === overId)) {
      newStage = overId as string;
    } else {
      // 'over' ist eine andere Karte
      const overCustomer = customers.find(c => c.id === overId);
      if (overCustomer) {
        newStage = overCustomer.pipeline_stage || "lead";
      }
    }

    if (activeCustomer.pipeline_stage !== newStage) {
      onStageChange(activeCustomer.id, newStage);
    }
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-250px)] overflow-x-auto pb-4 custom-scrollbar">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        {STAGES.map((stage) => {
          const stageCustomers = customers.filter(
            (c) => (c.pipeline_stage || "lead") === stage.id
          );
          
          return (
            <DroppableColumn 
              key={stage.id} 
              stage={stage} 
              customers={stageCustomers} 
              onCustomerClick={onCustomerClick} 
            />
          );
        })}
        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeCustomer ? (
            <CustomerCardUI customer={activeCustomer} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
