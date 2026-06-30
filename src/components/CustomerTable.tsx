import React, { useState } from 'react';
import { Customer, BankType, StatusType } from '../types';
import { 
  Search, Eye, Edit2, Trash2, SlidersHorizontal, 
  X, HelpCircle, Phone, Calendar, Bookmark, FileText, CheckCircle2, AlertCircle, XCircle, Image 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => Promise<void>;
  isDarkMode: boolean;
}

export default function CustomerTable({ customers, onEdit, onDelete, isDarkMode }: CustomerTableProps) {
  // Filter States
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [filterBank, setFilterBank] = useState<'Semua' | BankType>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | StatusType>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI Detail Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter application
  const filteredCustomers = customers.filter(c => {
    const matchesName = c.name.toLowerCase().includes(searchName.toLowerCase());
    const matchesPhone = c.phone.replace(/[\s-]/g, '').includes(searchPhone.replace(/[\s-]/g, ''));
    const matchesBank = filterBank === 'Semua' || c.bank === filterBank;
    const matchesStatus = filterStatus === 'Semua' || c.status === filterStatus;
    
    // Dates filtering
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && c.registrationDate >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && c.registrationDate <= endDate;
    }

    return matchesName && matchesPhone && matchesBank && matchesStatus && matchesDate;
  });

  const handleResetFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setFilterBank('Semua');
    setFilterStatus('Semua');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDarkMode 
        ? 'bg-zinc-900 border-zinc-800 shadow-md' 
        : 'bg-white border-blue-50 shadow-sm'
    }`}>
      {/* Search & Filter Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-bold text-sm tracking-tight">Database Registrasi Nasabah</h3>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Ditemukan {filteredCustomers.length} dari {customers.length} total registrasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main search bar */}
          <div className="relative flex-1 md:w-60 min-w-[200px]">
            <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <input
              id="search-name-input"
              type="text"
              placeholder="Cari nama nasabah..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all ${
                isDarkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-650 focus:border-blue-500' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-blue-600'
              }`}
            />
          </div>

          {/* Direct filter panel toggle button */}
          <button
            id="toggle-filters-btn"
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              showFilters
                ? 'bg-blue-600 border-blue-600 text-white'
                : isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Expandable Advanced Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden mb-5 rounded-xl border transition-all ${
              isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-50 border-zinc-200'
            }`}
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Phone search */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Cari No. HP
                </label>
                <input
                  id="search-phone-input"
                  type="text"
                  placeholder="0812..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-250 text-zinc-900'
                  }`}
                />
              </div>

              {/* Bank Selector */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Bank
                </label>
                <select
                  id="filter-bank-select"
                  value={filterBank}
                  onChange={(e) => setFilterBank(e.target.value as any)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-250 text-zinc-900'
                  }`}
                >
                  <option value="Semua">Semua Bank</option>
                  <option value="BTN">BTN</option>
                  <option value="SeaBank">SeaBank</option>
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Status
                </label>
                <select
                  id="filter-status-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none transition-all ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-250 text-zinc-900'
                  }`}
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Berhasil">Berhasil</option>
                  <option value="Pending">Pending</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              {/* Date Filters */}
              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Tanggal Mulai
                </label>
                <input
                  id="start-date-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-2 py-1 text-xs rounded-lg border outline-none transition-all ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-250 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Tanggal Selesai
                </label>
                <input
                  id="end-date-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-2 py-1 text-xs rounded-lg border outline-none transition-all ${
                    isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-250 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div className={`p-2.5 px-4 flex justify-end gap-2 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <button
                id="reset-filters-btn"
                type="button"
                onClick={handleResetFilters}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all uppercase ${
                  isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-600'
                }`}
              >
                Reset Filter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Desktop Table View VS Mobile Card stack */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Bookmark className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
          <h4 className="font-bold text-sm">Tidak Ada Data Nasabah</h4>
          <p className={`text-xs max-w-sm mt-1 mb-4 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Pencarian Anda tidak membuahkan hasil, atau Anda belum menambahkan pendaftaran rekening hari ini.
          </p>
          {(searchName || searchPhone || filterBank !== 'Semua' || filterStatus !== 'Semua' || startDate || endDate) && (
            <button
              id="clear-all-filters-btn"
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-500"
            >
              Hapus Semua Filter pencarian
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Layout: Responsive Stack of Elegant Cards */}
          <div className="block md:hidden space-y-3">
            {filteredCustomers.map((customer) => (
              <motion.div
                key={customer.id}
                layout
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDarkMode 
                    ? 'bg-zinc-950/40 border-zinc-800 text-zinc-100' 
                    : 'bg-zinc-50/50 border-zinc-200 text-zinc-900'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2.5">
                    {customer.photoUrl ? (
                      <img 
                        src={customer.photoUrl} 
                        alt={customer.name} 
                        className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm tracking-tight">{customer.name}</h4>
                      <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">{customer.phone}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider font-mono uppercase ${
                    customer.bank === 'BTN' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                  }`}>
                    {customer.bank}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs mt-2 border-t pt-2 border-zinc-100 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-400">
                    {customer.registrationDate}
                  </div>
                  
                  {/* Status Indicator pill */}
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      customer.status === 'Berhasil' 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800 dark:bg-emerald-950/30 dark:border-transparent dark:text-emerald-400' 
                        : customer.status === 'Pending' 
                          ? 'bg-amber-50 border-amber-250 text-amber-800 dark:bg-amber-950/30 dark:border-transparent dark:text-amber-400' 
                          : 'bg-red-50 border-red-250 text-red-800 dark:bg-red-950/30 dark:border-transparent dark:text-red-400'
                    }`}>
                      {customer.status}
                    </span>
                  </div>
                </div>

                {customer.notes && (
                  <p className={`line-clamp-1 mt-2 text-[11px] italic p-1.5 px-2.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-l-2 ${
                    customer.status === 'Berhasil' ? 'border-emerald-500' : customer.status === 'Pending' ? 'border-amber-500' : 'border-red-500'
                  }`}>
                    {customer.notes}
                  </p>
                )}

                {/* Mobile actions row */}
                <div className="flex gap-2 justify-end mt-3 mb-0.5">
                  <button
                    id={`mobile-detail-btn-${customer.id}`}
                    type="button"
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-2 rounded-lg ${isDarkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'} cursor-pointer`}
                    title="Lihat Detail"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`mobile-edit-btn-${customer.id}`}
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 cursor-pointer"
                    title="Edit Nasabah"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`mobile-delete-btn-${customer.id}`}
                    type="button"
                    onClick={() => setConfirmDeleteId(customer.id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-300 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Desktop Layout: HTML Table with CSS rules */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse" id="desktop-customer-table">
              <thead>
                <tr className={`border-b text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? 'border-zinc-850 text-zinc-500' : 'border-zinc-150 text-zinc-400'}`}>
                  <th className="pb-3 pt-1">Nama Nasabah</th>
                  <th className="pb-3 pt-1">Nomor HP</th>
                  <th className="pb-3 pt-1 text-center">Bank</th>
                  <th className="pb-3 pt-1">Tanggal</th>
                  <th className="pb-3 pt-1 text-center">Status</th>
                  <th className="pb-3 pt-1">Catatan</th>
                  <th className="pb-3 pt-1 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    className={`border-b group text-xs transition-colors hover:bg-zinc-500/5 ${
                      isDarkMode ? 'border-zinc-855/40' : 'border-zinc-100'
                    }`}
                  >
                    <td className="py-3 font-semibold text-zinc-800 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        {customer.photoUrl ? (
                          <img 
                            src={customer.photoUrl} 
                            alt={customer.name} 
                            className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 bg-zinc-100" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-zinc-500">{customer.phone}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider font-mono inline-block uppercase ${
                        customer.bank === 'BTN' ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300'
                      }`}>
                        {customer.bank}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500 dark:text-zinc-400">{customer.registrationDate}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block min-w-[70px] border ${
                        customer.status === 'Berhasil' 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-800 dark:bg-emerald-950/20 dark:border-transparent dark:text-emerald-400' 
                          : customer.status === 'Pending' 
                            ? 'bg-amber-50 border-amber-250 text-amber-800 dark:bg-amber-950/20 dark:border-transparent dark:text-amber-400' 
                            : 'bg-red-50 border-red-250 text-red-800 dark:bg-red-950/20 dark:border-transparent dark:text-red-400'
                      }`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500 dark:text-zinc-400 max-w-[150px] truncate" title={customer.notes}>
                      {customer.notes || '-'}
                    </td>
                    <td className="py-3 text-right">
                      {/* Flex desktop actions */}
                      <div className="flex gap-1.5 justify-end">
                        <button
                          id={`desktop-detail-btn-${customer.id}`}
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className={`p-1.5 rounded-lg border cursor-pointer hover:scale-105 transition-transform ${
                            isDarkMode ? 'border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'border-zinc-200 text-zinc-500 hover:text-zinc-700'
                          }`}
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`desktop-edit-btn-${customer.id}`}
                          type="button"
                          onClick={() => onEdit(customer)}
                          className="p-1.5 rounded-lg border border-blue-150 text-blue-600 dark:border-blue-900/30 dark:text-blue-400 cursor-pointer hover:scale-105 transition-transform"
                          title="Ubah Data"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`desktop-delete-btn-${customer.id}`}
                          type="button"
                          onClick={() => setConfirmDeleteId(customer.id)}
                          className="p-1.5 rounded-lg border border-red-150 text-red-500 dark:border-red-900/30 dark:text-red-400 cursor-pointer hover:scale-105 transition-transform"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-2xl relative border shadow-2xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-805 text-zinc-100' : 'bg-white border-zinc-100 text-zinc-900'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-850 cursor-pointer text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                <span>Profil Detail Nasabah</span>
              </h3>

              <div className="space-y-4">
                {/* 1. Name */}
                <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150'}`}>
                  <span className={`text-[9px] uppercase font-bold block mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Nama Nasabah</span>
                  <div className="font-bold text-sm">{selectedCustomer.name}</div>
                </div>

                {/* Dokumen Nasabah (Up to 3) */}
                {((selectedCustomer.documents && selectedCustomer.documents.length > 0) || selectedCustomer.photoUrl) && (
                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150'}`}>
                    <span className={`text-[9px] uppercase font-bold block mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      <Image className="w-3.5 h-3.5 inline mr-1" />Dokumen Nasabah ({
                        selectedCustomer.documents ? selectedCustomer.documents.length : 1
                      } Berkas)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCustomer.documents && selectedCustomer.documents.length > 0 ? (
                        selectedCustomer.documents.map((doc, idx) => (
                          <div key={idx} className="relative border rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 p-1 flex items-center justify-center">
                            <img 
                              src={doc} 
                              alt={`Dokumen ${idx + 1}`} 
                              className="h-20 w-full object-contain cursor-zoom-in hover:scale-105 transition-all"
                              onClick={() => {
                                const newTab = window.open();
                                if (newTab) {
                                  newTab.document.write(`<img src="${doc}" style="max-width:100%; max-height:100%;" />`);
                                }
                              }}
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/60 text-[8px] text-white font-bold rounded">
                              Doc {idx + 1}
                            </span>
                          </div>
                        ))
                      ) : (
                        selectedCustomer.photoUrl && (
                          <div className="relative border rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 p-1 flex items-center justify-center">
                            <img 
                              src={selectedCustomer.photoUrl} 
                              alt="Dokumen" 
                              className="h-20 w-full object-contain cursor-zoom-in hover:scale-105 transition-all"
                              onClick={() => {
                                const newTab = window.open();
                                if (newTab) {
                                  newTab.document.write(`<img src="${selectedCustomer.photoUrl}" style="max-width:100%; max-height:100%;" />`);
                                }
                              }}
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute bottom-0.5 left-0.5 px-1 py-0.5 bg-black/60 text-[8px] text-white font-bold rounded">
                              Doc 1
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* 2. HP & Bank */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150'}`}>
                    <span className={`text-[9px] uppercase font-bold block mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><Phone className="w-3.5 h-3.5 inline mr-1" />Nomor HP</span>
                    <div className="font-semibold text-xs font-mono">{selectedCustomer.phone}</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150'}`}>
                    <span className={`text-[9px] uppercase font-bold block mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><Bookmark className="w-3.5 h-3.5 inline mr-1" />Bank</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase inline-block mt-0.5 ${
                      selectedCustomer.bank === 'BTN' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300'
                    }`}>
                      {selectedCustomer.bank}
                    </span>
                  </div>
                </div>

                {/* 3. Tanggal & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150'}`}>
                    <span className={`text-[9px] uppercase font-bold block mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><Calendar className="w-3.5 h-3.5 inline mr-1" />Tanggal Daftar</span>
                    <div className="text-xs">{selectedCustomer.registrationDate}</div>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150'}`}>
                    <span className={`text-[9px] uppercase font-bold block mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Status Verifikasi</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block mt-1 border ${
                      selectedCustomer.status === 'Berhasil' 
                        ? 'bg-emerald-50 border-emerald-250 text-emerald-800 dark:bg-emerald-950/30 dark:border-transparent dark:text-emerald-400' 
                        : selectedCustomer.status === 'Pending' 
                          ? 'bg-amber-50 border-amber-250 text-amber-800 dark:bg-amber-950/30 dark:border-transparent dark:text-amber-400' 
                          : 'bg-red-50 border-red-250 text-red-800 dark:bg-red-950/30 dark:border-transparent dark:text-red-400'
                    }`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>

                {/* 4. Notes */}
                <div className={`p-3 rounded-xl border  ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-150'}`}>
                  <span className={`text-[9px] uppercase font-bold block mb-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}><FileText className="w-3.5 h-3.5 inline mr-1" />Catatan Lengkap</span>
                  <div className={`text-xs whitespace-pre-wrap ${selectedCustomer.notes ? '' : 'italic text-zinc-400'}`}>
                    {selectedCustomer.notes || 'Tidak ada catatan tambahan.'}
                  </div>
                </div>

                {/* 5. Date Created */}
                <div className="text-right text-[9px] text-zinc-400">
                  Didaftarkan pada: {new Date(selectedCustomer.createdAt).toLocaleString('id-ID')}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Selesai & Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Dialog */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
            >
              <h3 className="font-bold text-sm mb-2">Hapus Berkas Nasabah?</h3>
              <p className={`text-xs mb-5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Tindakan ini tidak bisa dibatalkan. Berkas pendaftaran nasabah yang bersangkutan akan dihapus selamanya dari database Anda.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className={`px-4 py-2 font-medium text-xs rounded-xl border transition-all cursor-pointer ${
                    isDarkMode ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-500'
                  }`}
                >
                  Kembali
                </button>
                <button
                  id="confirm-delete-button"
                  type="button"
                  onClick={async () => {
                    await onDelete(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Ya, Hapus Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
