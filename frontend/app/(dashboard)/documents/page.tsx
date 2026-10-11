"use client";

import { useState } from "react";
import { Upload, Search, Filter, FileText, Image as ImageIcon, Shield, Download, Trash2, Calendar, FileCheck } from "lucide-react";

const initialDocuments = [
  {
    id: "doc-101",
    title: "GST Registration Certificate",
    category: "Legal & GST",
    file_type: "PDF Document",
    file_size: "1.4 MB",
    upload_date: "2026-01-15",
    uploaded_by: "Owner (Antigravity)",
    ref_code: "GST-24AAAFA1234A1Z5"
  },
  {
    id: "doc-102",
    title: "DSG-9021 Punching Artwork (.DST / .EMB)",
    category: "Design Files",
    file_type: "Embroidery Design File",
    file_size: "4.8 MB",
    upload_date: "2026-09-18",
    uploaded_by: "Punching Master (Ketan)",
    ref_code: "DSG-9021"
  },
  {
    id: "doc-103",
    title: "ABC Tex Job Work Agreement & Rate Contract",
    category: "Party Contracts",
    file_type: "PDF Document",
    file_size: "2.1 MB",
    upload_date: "2026-08-01",
    uploaded_by: "Owner",
    ref_code: "CON-2026-01"
  },
  {
    id: "doc-104",
    title: "DGVCL Power Tariff Sanction Copy",
    category: "Factory Utility",
    file_type: "PDF Document",
    file_size: "850 KB",
    upload_date: "2026-03-10",
    uploaded_by: "Supervisor",
    ref_code: "UTIL-DGVCL"
  }
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "Sample Design Card",
    category: "Design Files",
    ref_code: "DSG-NEW"
  });

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.ref_code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: `doc-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      file_type: "PDF Document",
      file_size: "1.2 MB",
      upload_date: new Date().toISOString().split("T")[0],
      uploaded_by: "Owner",
      ref_code: formData.ref_code
    };
    setDocuments([newEntry, ...documents]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-end w-full">
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" /> Upload Document / File
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Document Title or Ref Code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Categories</option>
            <option value="Legal & GST">Legal & GST</option>
            <option value="Design Files">Design Files (.DST)</option>
            <option value="Party Contracts">Party Contracts</option>
            <option value="Factory Utility">Factory Utility</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {doc.ref_code}
                </span>
                <span>{doc.file_size}</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg shrink-0">
                  {doc.category === "Design Files" ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{doc.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.category}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">{doc.upload_date}</span>
              <button className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Upload Digital Document</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                ×
              </button>
            </div>
            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Legal & GST">Legal & GST</option>
                  <option value="Design Files">Design Files (.DST)</option>
                  <option value="Party Contracts">Party Contracts</option>
                  <option value="Factory Utility">Factory Utility</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reference Code / Job No</label>
                <input
                  type="text"
                  required
                  value={formData.ref_code}
                  onChange={(e) => setFormData({ ...formData, ref_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-500 hover:border-blue-600 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Click to select file or drag & drop</p>
                <p className="text-[11px] text-slate-400 mt-1">PDF, DST, EMB, PNG, JPG (Max 25MB)</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
