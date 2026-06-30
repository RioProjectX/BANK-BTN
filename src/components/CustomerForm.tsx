import React, { useState, useEffect } from 'react';
import { Customer, BankType, StatusType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Phone, Landmark, Calendar, FileText, Check, 
  RotateCcw, X, Sparkles, Loader2, Camera, UploadCloud, Trash2 
} from 'lucide-react';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSave: (data: Omit<Customer, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onCancel?: () => void;
  isDarkMode: boolean;
}

export default function CustomerForm({ initialData, onSave, onCancel, isDarkMode }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState<BankType>('BTN');
  const [registrationDate, setRegistrationDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<StatusType>('Berhasil');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<string[]>(['', '', '']);
  const [dragActiveIndex, setDragActiveIndex] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync state if initialData is provided (for editing)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setPhone(initialData.phone);
      setBank(initialData.bank);
      setRegistrationDate(initialData.registrationDate);
      setStatus(initialData.status);
      setNotes(initialData.notes || '');
      
      const initialDocs = initialData.documents || [];
      const docArray = ['', '', ''];
      for (let i = 0; i < 3; i++) {
        docArray[i] = initialDocs[i] || (i === 0 && initialData.photoUrl ? initialData.photoUrl : '');
      }
      setDocuments(docArray);
    } else {
      handleReset();
    }
  }, [initialData]);

  const handleReset = () => {
    setName('');
    setPhone('');
    setBank('BTN');
    setRegistrationDate(new Date().toISOString().split('T')[0]);
    setStatus('Berhasil');
    setNotes('');
    setDocuments(['', '', '']);
  };

  const handleFileChangeAtIndex = (file: File, index: number) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan!');
      return;
    }
    // Limit to 5MB since we will downsize it anyway
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB!');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        // Limit max width/height to 800px to drastically reduce base64 size
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.7 quality (takes very few KB compared to original uncompressed PNG/JPEG)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          const newDocs = [...documents];
          newDocs[index] = compressedDataUrl;
          setDocuments(newDocs);
        } else {
          const newDocs = [...documents];
          newDocs[index] = reader.result as string;
          setDocuments(newDocs);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveIndex(index);
    } else if (e.type === "dragleave") {
      setDragActiveIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChangeAtIndex(e.dataTransfer.files[0], index);
    }
  };

  const removeDocumentAtIndex = (index: number) => {
    const newDocs = [...documents];
    newDocs[index] = '';
    setDocuments(newDocs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !registrationDate) return;

    setLoading(true);
    try {
      // Filter out empty document strings for saving
      const activeDocuments = documents.filter(doc => doc !== '');
      
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        bank,
        registrationDate,
        status,
        notes: notes.trim(),
        photoUrl: activeDocuments[0] || undefined, // Keep fallback for existing code
        documents: activeDocuments
      });

      setShowSuccess(true);
      if (!initialData) {
        handleReset();
      }
      
      // Auto-hide success alert
      setTimeout(() => {
        setShowSuccess(false);
      }, 3500);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all ${
      isDarkMode 
        ? 'bg-zinc-900 border-zinc-800 shadow-md' 
        : 'bg-white border-blue-50 shadow-sm'
    }`}>
      {/* Decorative header glow */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-orange-500`} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-blue-500" />
            <span>{initialData ? 'Ubah Data Nasabah' : 'Input Pembukaan Rekening'}</span>
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Masukkan info formulir secara singkat dan tepat
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`p-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 rounded-lg transition-colors cursor-pointer`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-medium">
              <div className="p-1 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </div>
              <span>Data Nasabah berhasil disimpan dengan sukses!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Nama Nasabah */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Nama Lengkap Nasabah
          </label>
          <div className="relative">
            <User className={`absolute left-3 top-3 w-4.5 h-4.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <input
              id="form-name"
              type="text"
              required
              placeholder="Budi Santoso"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full pl-9.5 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                isDarkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-blue-600'
              }`}
            />
          </div>
        </div>

        {/* 2. Nomor HP */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Nomor HP Nasabah
          </label>
          <div className="relative">
            <Phone className={`absolute left-3 top-3 w-4.5 h-4.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <input
              id="form-phone"
              type="tel"
              required
              placeholder="081234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full pl-9.5 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                isDarkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-blue-600'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 3. Bank Selection */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Bank Penerbit
            </label>
            <div className="flex gap-2">
              <button
                id="bank-btn"
                type="button"
                onClick={() => setBank('BTN')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                  bank === 'BTN'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                BTN
              </button>
              <button
                id="bank-seabank"
                type="button"
                onClick={() => setBank('SeaBank')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                  bank === 'SeaBank'
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : isDarkMode
                      ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
              >
                SeaBank
              </button>
            </div>
          </div>

          {/* 4. Registration Date */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Tanggal Pembukaan
            </label>
            <div className="relative">
              <Calendar className={`absolute left-3 top-3 w-4.5 h-4.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
              <input
                id="form-date"
                type="date"
                required
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
                className={`w-full pl-9.5 pr-3 py-2 text-sm rounded-xl border outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-blue-600'
                }`}
              />
            </div>
          </div>
        </div>

        {/* 5. Status */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Status Verifikasi Rekening
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Berhasil', 'Pending', 'Ditolak'] as StatusType[]).map((st) => {
              let activeColor = '';
              if (st === 'Berhasil') activeColor = 'bg-emerald-500 border-emerald-500 text-white';
              if (st === 'Pending') activeColor = 'bg-amber-500 border-amber-500 text-white';
              if (st === 'Ditolak') activeColor = 'bg-red-500 border-red-500 text-white';

              return (
                <button
                  id={`status-btn-${st}`}
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    status === st
                      ? activeColor
                      : isDarkMode
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fitur Upload Dokumen Nasabah */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Upload Dokumen Nasabah
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[0, 1, 2].map((index) => {
              const currentDoc = documents[index];
              const isDragActive = dragActiveIndex === index;
              return (
                <div 
                  key={index}
                  onDragEnter={(e) => handleDrag(e, index)}
                  onDragOver={(e) => handleDrag(e, index)}
                  onDragLeave={(e) => handleDrag(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center transition-all min-h-[140px] text-center ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : isDarkMode 
                        ? 'border-zinc-800 bg-zinc-950 hover:border-zinc-700' 
                        : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300'
                  }`}
                >
                  {currentDoc ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-between">
                      <img 
                        src={currentDoc} 
                        alt={`Dokumen ${index + 1}`} 
                        className="h-20 w-full rounded-lg object-contain border mb-2 shadow-sm bg-black/5 dark:bg-white/5" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          removeDocumentAtIndex(index);
                        }}
                        className="absolute z-20 top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className={`text-[10px] font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        Dokumen {index + 1} Berhasil
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 h-full">
                      <Camera className={`w-6 h-6 mb-1.5 ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`} />
                      <p className={`text-xs font-bold mb-0.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        Dokumen {index + 1}
                      </p>
                      <p className={`text-[9px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'} px-2`}>
                        Tarik gambar / <span className="text-blue-500 underline font-semibold cursor-pointer">pilih</span>
                      </p>
                    </div>
                  )}
                  
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChangeAtIndex(e.target.files[0], index);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title=""
                  />
                </div>
              );
            })}
          </div>
          <p className={`text-[10px] mt-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
            * Anda dapat mengunggah hingga 3 dokumen gambar fiktif atau dokumen nasabah (KTP, slip gaji, atau KK) maks. 2MB per berkas.
          </p>
        </div>

        {/* 6. Catatan Tambahan */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Catatan Tambahan
          </label>
          <div className="relative">
            <FileText className={`absolute left-3 top-3 w-4.5 h-4.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`} />
            <textarea
              id="form-notes"
              rows={2}
              placeholder="Ex: Masalah KTP, berkas sudah diupload, dsb."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full pl-9.5 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all resize-none ${
                isDarkMode 
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-blue-600'
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-3">
          <button
            id="form-reset-btn"
            type="button"
            onClick={handleReset}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              isDarkMode 
                ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' 
                : 'border-zinc-250 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Form</span>
          </button>

          <button
            id="form-submit-btn"
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer text-white transition-all ${
              loading 
                ? 'bg-zinc-700 cursor-not-allowed text-zinc-400' 
                : isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/10' 
                  : 'bg-blue-700 hover:bg-blue-600 shadow-md shadow-blue-700/15'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialData ? 'Simpan Perubahan' : 'Simpan Rekening'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
