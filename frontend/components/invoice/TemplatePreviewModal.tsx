"use client";

import React, { useState } from "react";
import { X, Check, Printer, Sparkles, Sliders, Eye } from "lucide-react";
import InvoiceTemplateRenderer, {
  INVOICE_TEMPLATES,
  getSampleInvoiceData,
  InvoiceTemplateMeta
} from "./InvoiceTemplateRenderer";
import { CompanySettings } from "@/lib/companySettings";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplateId: string;
  onSelectTemplate: (templateId: string) => void;
  companySettings: CompanySettings;
}

export default function TemplatePreviewModal({
  isOpen,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  companySettings
}: TemplatePreviewModalProps) {
  const [activeId, setActiveId] = useState(selectedTemplateId || "standard");
  const [showQr, setShowQr] = useState(true);
  const [showLogo, setShowLogo] = useState(true);

  if (!isOpen) return null;

  const currentMeta = INVOICE_TEMPLATES.find((t) => t.id === activeId) || INVOICE_TEMPLATES[0];
  const sampleData = getSampleInvoiceData(companySettings);
  const isCurrentlyDefault = selectedTemplateId === activeId;

  const handlePrintTest = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-100 rounded-3xl border border-slate-300 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/30 border border-blue-500/40 rounded-lg text-blue-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide flex items-center gap-2">
                <span>Bill Template Live Preview</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${currentMeta.badgeColor}`}>
                  {currentMeta.badge}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {currentMeta.name} • {currentMeta.paper}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintTest}
              className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Test Print this Template"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Print</span>
            </button>

            {!isCurrentlyDefault ? (
              <button
                type="button"
                onClick={() => {
                  onSelectTemplate(activeId);
                  onClose();
                }}
                className="h-8 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Set as Default</span>
              </button>
            ) : (
              <span className="h-8 px-3 bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Default</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div className="bg-white px-5 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Format:</span>
            {INVOICE_TEMPLATES.map((tmpl) => {
              const isSelected = tmpl.id === activeId;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setActiveId(tmpl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-2xs font-black"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>{tmpl.name.split(" ")[0]} {tmpl.name.split(" ")[1]}</span>
                  {selectedTemplateId === tmpl.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 shrink-0">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showQr}
                onChange={(e) => setShowQr(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              <span className="text-[11px]">UPI QR</span>
            </label>
          </div>
        </div>

        {/* Preview Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/80 flex justify-center">
          <div className="w-full max-w-3xl shadow-xl bg-white rounded-lg overflow-hidden">
            <InvoiceTemplateRenderer
              templateId={activeId}
              data={sampleData}
              settings={companySettings}
              showLogo={showLogo}
              showQr={showQr}
            />
          </div>
        </div>

        {/* Bottom Recommendation Bar */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-medium text-[11px]">
              <strong className="text-slate-900 font-bold">Recommended for: </strong>
              {currentMeta.recommendedFor}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Print size: <strong>{currentMeta.paper}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

