import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, onSnapshot, query, where, doc, 
  addDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Customer } from './types';
import { printLaporan } from './lib/data-utils';

// Subcomponents
import Login from './components/Login';
import StatsGrid from './components/StatsGrid';
import TargetTracker from './components/TargetTracker';
import Charts from './components/Charts';
import CustomerForm from './components/CustomerForm';
import CustomerTable from './components/CustomerTable';

// Icons
import { 
  Sun, Moon, LogOut, 
  Printer, Database, Sparkles, RefreshCw, LayoutDashboard, UserX, Loader2, Bookmark,
  Settings, X, User as UserIcon, Camera, Building, Phone, Award,
  Download, Smartphone, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Elegant seed data to help users test instantly
const DUMMY_SEED_DATA = [
  {
    name: 'Ahmad Faisal',
    phone: '081284902113',
    bank: 'BTN' as const,
    registrationDate: new Date().toISOString().split('T')[0], // Today
    status: 'Berhasil' as const,
    notes: 'Syarat berkas sudah lengkap, pembukaan rekening di kantor cabang utama.',
    createdAt: new Date().toISOString()
  },
  {
    name: 'Siti Rahmawati',
    phone: '085711204958',
    bank: 'SeaBank' as const,
    registrationDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })(), // Yesterday
    status: 'Pending' as const,
    notes: 'KTP buram, staf sedang meminta upload ulang lewat WA.',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    name: 'Bambang Triyono',
    phone: '081385901124',
    bank: 'BTN' as const,
    registrationDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 3);
      return d.toISOString().split('T')[0];
    })(), // 3 days ago
    status: 'Berhasil' as const,
    notes: 'Nasabah sangat puas dengan proses pembukaan instan BTN online.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    name: 'Diana Putri',
    phone: '081195804215',
    bank: 'SeaBank' as const,
    registrationDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() - 5);
      return d.toISOString().split('T')[0];
    })(), // 5 days ago
    status: 'Ditolak' as const,
    notes: 'NIP tidak lolos screening Sistem OJK perbankan.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // PWA states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPwaInstallModal, setShowPwaInstallModal] = useState(false);
  
  // Custom 0-100% Animated Loading Screen states
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  const [authChecking, setAuthChecking] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Edit states
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Settings and Custom Sales Profile states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [customSalesName, setCustomSalesName] = useState(() => {
    return localStorage.getItem('custom_sales_name') || '';
  });
  const [salesPhoto, setSalesPhoto] = useState<string>(() => {
    return localStorage.getItem('sales_photo') || '';
  });
  const [salesNip, setSalesNip] = useState<string>(() => {
    return localStorage.getItem('sales_nip') || '';
  });
  const [salesDivision, setSalesDivision] = useState<string>(() => {
    return localStorage.getItem('sales_division') || '';
  });
  const [salesPhone, setSalesPhone] = useState<string>(() => {
    return localStorage.getItem('sales_phone') || '';
  });

  const [tempSalesName, setTempSalesName] = useState(customSalesName);
  const [tempSalesPhoto, setTempSalesPhoto] = useState(salesPhoto);
  const [tempSalesNip, setTempSalesNip] = useState(salesNip);
  const [tempSalesDivision, setTempSalesDivision] = useState(salesDivision);
  const [tempSalesPhone, setTempSalesPhone] = useState(salesPhone);

  // Keep temp states in sync with actual custom states
  useEffect(() => {
    setTempSalesName(customSalesName);
    setTempSalesPhoto(salesPhoto);
    setTempSalesNip(salesNip);
    setTempSalesDivision(salesDivision);
    setTempSalesPhone(salesPhone);
  }, [customSalesName, salesPhoto, salesNip, salesDivision, salesPhone]);

  // Trigger Theme updates
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Read User authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Only set if we are not already in offline demo mode
      setCurrentUser((prev: any) => {
        if (prev?.uid === 'demo_user_local_offline') return prev;
        return user;
      });
      setAuthChecking(false);
    });
    return unsubscribe;
  }, []);

  // Listen for custom fallback demo authentication events from Login
  useEffect(() => {
    const handleLocalDemo = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setCurrentUser({
          uid: customEvent.detail.uid,
          email: customEvent.detail.email,
          isAnonymous: true
        });
        setAuthChecking(false);
      }
    };
    window.addEventListener('auth-fallback-local-demo', handleLocalDemo);
    return () => window.removeEventListener('auth-fallback-local-demo', handleLocalDemo);
  }, []);

  // Listen for PWA Install prompt and status
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('App was successfully installed on the home screen');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check if already running in standalone PWA app mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstallable(false);
    } else {
      // Keep it active so any browser can trigger the helpful download helper card/modal
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
      }
    } else {
      // Show the beautiful modal with instruction slides/steps for iOS & Desktop browsers
      setShowPwaInstallModal(true);
    }
  };

  // Organic 0% - 100% Loading Progress Simulation
  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      // Small random increments for a natural, organic feel
      const increment = Math.floor(Math.random() * 5) + 3;
      currentProgress = Math.min(currentProgress + increment, 100);
      setLoadingProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        // Retain 100% for a slight moment for maximum aesthetic satisfaction
        setTimeout(() => {
          setIsAppLoading(false);
        }, 550);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Sync / Stream data from Firestore real-time for Current User
  useEffect(() => {
    if (!currentUser) {
      setCustomers([]);
      return;
    }

    // Capture Local Demo Mode data streaming
    if (currentUser.uid === 'demo_user_local_offline') {
      setLoadingData(true);
      const stored = localStorage.getItem('local_backup_customers_demo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCustomers(parsed);
        } catch (e) {
          console.error('Error reading local backup: ', e);
          setCustomers([]);
        }
      } else {
        setCustomers([]);
      }
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const q = query(
      collection(db, 'customers'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Customer[] = [];
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data()
        } as Customer);
      });

      // Sort by Registration Date descending or Created Date descending
      data.sort((a, b) => b.registrationDate.localeCompare(a.registrationDate) || b.createdAt.localeCompare(a.createdAt));
      setCustomers(data);
      setLoadingData(false);
    }, (err) => {
      console.error("Firestore listening error: ", err);
      // Fallback inside active session if permission/indexing error
      setLoadingData(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Auth logout
  const handleLogout = async () => {
    try {
      if (currentUser?.uid === 'demo_user_local_offline' || currentUser?.uid === 'admin_btn_shared_public') {
        setCurrentUser(null);
        return;
      }
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  // Safe helper to save local backup without exceeding storage quota
  const saveLocalBackup = (updatedCustomers: Customer[]) => {
    try {
      localStorage.setItem('local_backup_customers_demo', JSON.stringify(updatedCustomers));
    } catch (err: any) {
      console.warn('LocalStorage quota exceeded! Attempting to save backup without heavy document images...', err);
      try {
        const stripped = updatedCustomers.map(c => ({
          ...c,
          documents: c.documents ? c.documents.map(() => '') : []
        }));
        localStorage.setItem('local_backup_customers_demo', JSON.stringify(stripped));
        console.info('Backup saved successfully without attachments.');
      } catch (fallbackErr: any) {
        console.error('Even stripped backup failed to save to LocalStorage:', fallbackErr);
      }
    }
  };

  // Add / Edit Operation Handler
  const handleSaveCustomer = async (formData: Omit<Customer, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser) return;

    if (currentUser.uid === 'demo_user_local_offline') {
      let updatedCustomers: Customer[] = [];
      if (editingCustomer) {
        updatedCustomers = customers.map(c => c.id === editingCustomer.id ? { ...c, ...formData } : c);
        setEditingCustomer(null);
        setShowEditForm(false);
      } else {
        const newDoc: Customer = {
          ...formData,
          id: 'local_' + Math.random().toString(36).substr(2, 9),
          userId: currentUser.uid,
          createdAt: new Date().toISOString()
        };
        updatedCustomers = [newDoc, ...customers];
      }
      setCustomers(updatedCustomers);
      saveLocalBackup(updatedCustomers);
      return;
    }

    if (editingCustomer) {
      // Perform Update in Firestore
      const docRef = doc(db, 'customers', editingCustomer.id);
      await updateDoc(docRef, {
        ...formData
      });
      setEditingCustomer(null);
      setShowEditForm(false);
    } else {
      // Perform Create in Firestore
      await addDoc(collection(db, 'customers'), {
        ...formData,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
    }
  };

  // Delete Operation Handler
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      if (currentUser?.uid === 'demo_user_local_offline') {
        const updated = customers.filter(c => c.id !== customerId);
        setCustomers(updated);
        saveLocalBackup(updated);
        return;
      }
      const docRef = doc(db, 'customers', customerId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error(err);
    }
  };

  // Automated seed loader helper
  const handleSeedDummyData = async () => {
    if (!currentUser) return;
    setSeedingLoading(true);

    try {
      if (currentUser.uid === 'demo_user_local_offline') {
        const seededList: Customer[] = DUMMY_SEED_DATA.map((item, index) => ({
          ...item,
          id: 'local_seed_' + index + '_' + Math.random().toString(36).substr(2, 9),
          userId: currentUser.uid
        }));
        const combined = [...seededList, ...customers];
        setCustomers(combined);
        saveLocalBackup(combined);
        return;
      }
      
      // Bulk write standard seed values to Firestore
      for (const item of DUMMY_SEED_DATA) {
        await addDoc(collection(db, 'customers'), {
          ...item,
          userId: currentUser.uid
        });
      }
    } catch (err) {
      console.error('Error seeding data: ', err);
    } finally {
      setSeedingLoading(false);
    }
  };

  // Automatic Backup Utility: exports JSON dump of current customers
  const handleBackupData = () => {
    if (customers.length === 0) {
      alert("Tidak ada data nasabah untuk dibackup.");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Backup_Tracker_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
  };

  // Filter customers to get monthly performance
  const monthlyStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const customersCountThisMonth = customers.filter(c => c.registrationDate.startsWith(monthlyStr) && c.status === 'Berhasil').length;

  if (isAppLoading || authChecking) {
    // Dynamic status text based on progress percentage
    const getLoadingMessage = (progress: number) => {
      if (progress < 25) return "Menginisialisasi modul sistem...";
      if (progress < 50) return "Menghubungkan ke server aman BTN...";
      if (progress < 75) return "Memproses otentikasi data awan...";
      if (progress < 95) return "Sinkronisasi performa nasabah...";
      return "Menyiapkan antarmuka portal...";
    };

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#040815]' : 'bg-slate-50'}`}>
        {/* Soft elegant glowing ambient background blobs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-red-500/5 blur-3xl animate-pulse delay-1000" />
        
        <div className="z-10 flex flex-col items-center justify-center max-w-sm px-6 text-center">
          {/* Brand Lettermark Container */}
          <div className="relative mb-6 flex flex-col items-center select-none" id="animated-loading-logo">
            <div className="flex items-baseline justify-center tracking-tighter">
              <motion.span 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1, type: "spring" }}
                className={`text-8xl font-black font-sans leading-none ${isDarkMode ? 'text-white' : 'text-[#00529C]'}`}
              >
                b
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                className={`text-8xl font-black font-sans leading-none ${isDarkMode ? 'text-white' : 'text-[#00529C]'}`}
              >
                t
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
                className={`text-8xl font-black font-sans leading-none ${isDarkMode ? 'text-white' : 'text-[#00529C]'}`}
              >
                n
              </motion.span>
            </div>

            {/* BTN Logo Underline Bar expanding matching loading percentage */}
            <div className="w-44 h-2 mt-4 bg-zinc-200 dark:bg-zinc-800/80 rounded-full overflow-hidden relative border border-zinc-300/10">
              <div 
                className="h-full bg-[#ED1C24] rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(237,28,36,0.8)]"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>

          {/* Digital Percentage Counter */}
          <div className="font-mono text-2xl font-bold tracking-wider text-[#00529C] dark:text-blue-400 mb-2">
            <span className="tabular-nums">{loadingProgress}</span>%
          </div>

          {/* Changing status description text */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-[11px] font-bold tracking-widest uppercase text-zinc-400 dark:text-zinc-500 transition-all duration-300">
              {getLoadingMessage(loadingProgress)}
            </p>
          </div>

          {/* Bottom brand stamping signature */}
          <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none">
            <div className="text-[10px] font-bold tracking-[0.25em] uppercase text-zinc-400 dark:text-zinc-600">
              BANK TABUNGAN NEGARA
            </div>
            <div className="text-[8px] font-mono tracking-widest text-zinc-500 dark:text-zinc-700 mt-1.5">
              PORTAL PELACAK NASABAH v1.2.0
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login isDarkMode={isDarkMode} />;
  }

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50/60 text-zinc-900'}`}>
      
      {/* 1. Header Toolbar Component */}
      <header className={`sticky top-0 z-40 transition-all border-b no-print ${
        isDarkMode ? 'bg-zinc-900/90 border-zinc-805 backdrop-blur-md' : 'bg-white/95 border-blue-100 backdrop-blur-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="header-logo-btn"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`p-1.5 px-3 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all border outline-none ${
                isDarkMode 
                  ? 'bg-zinc-800/80 border-zinc-700 text-white hover:bg-zinc-700/80' 
                  : 'bg-white border-slate-200 text-[#002D62] hover:bg-slate-50 hover:shadow-sm'
              }`}
              title="Bank BTN - Kembali ke atas"
            >
              <svg viewBox="0 0 58 32" className="w-14 h-7" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* b */}
                <path 
                  d="M10 6V24M10 15C10.8 13.3 12.8 12.5 15 12.5C18.5 12.5 21 15 21 18.5C21 22 18.5 24.5 15 24.5C12.8 24.5 10.8 23.7 10 22" 
                  stroke="currentColor" 
                  strokeWidth="3.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* t */}
                <path 
                  d="M30 12V23C30 24.2 30.8 24.5 32 24.5H33.5M27 15.5H33.5" 
                  stroke="currentColor" 
                  strokeWidth="3.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                {/* Red bar above t */}
                <rect x="27" y="6.5" width="7" height="3" rx="1" fill="#E1251B" />
                {/* n */}
                <path 
                  d="M42 12.5V24M42 16C42.8 14 44.8 12.5 47 12.5C50 12.5 52 14.5 52 18V24" 
                  stroke="currentColor" 
                  strokeWidth="3.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-base md:text-lg leading-tight flex items-center gap-2">
                <span>Pencatatan Rekening Nasabah</span>
                <span className="text-[10px] font-bold border px-2 py-0.5 rounded-full bg-blue-50 dark:bg-zinc-800 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-zinc-700">
                  v1.2.0
                </span>
              </h1>
              <p className={`text-[10px] md:text-xs leading-none mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Sistem Administrasi Rekening Nasabah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark & Light Theme selection toggler */}
            <button
              id="theme-toggler"
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl border cursor-pointer hover:scale-105 transition-all ${
                isDarkMode 
                  ? 'border-zinc-800 bg-zinc-950 text-amber-400' 
                  : 'border-zinc-200 bg-zinc-50 text-indigo-600'
              }`}
              title={isDarkMode ? "Aktifkan Light Mode" : "Aktifkan Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Print Data button */}
            <button
              id="print-btn"
              type="button"
              onClick={printLaporan}
              className={`p-2 rounded-xl border hidden sm:flex items-center justify-center cursor-pointer hover:scale-105 transition-all ${
                isDarkMode 
                  ? 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' 
                  : 'border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Print Laporan"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>

            {/* Download/Install PWA button */}
            {isInstallable && (
              <button
                id="install-pwa-btn"
                type="button"
                onClick={handleInstallApp}
                className="p-2 md:px-3.5 rounded-xl cursor-pointer hover:scale-105 transition-all flex items-center justify-center gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/10"
                title="Unduh / Pasang Aplikasi BTN Tracker"
              >
                <Download className="w-4 h-4 text-white" />
                <span className="hidden md:inline">Unduh Aplikasi</span>
              </button>
            )}

            {/* Settings button */}
            <button
              id="settings-btn"
              type="button"
              onClick={() => {
                setTempSalesName(customSalesName);
                setShowSettingsModal(true);
              }}
              className={`p-2 rounded-xl border cursor-pointer hover:scale-105 transition-all flex items-center justify-center ${
                isDarkMode 
                  ? 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' 
                  : 'border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Pengaturan"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            {/* Logout trigger button */}
            <button
              id="logout-btn"
              type="button"
              onClick={handleLogout}
              className={`p-2 rounded-xl border border-red-200 text-red-500 dark:border-red-900/30 dark:text-red-400 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 hover:scale-105 transition-all flex items-center justify-center gap-1.5`}
              title="Keluar"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span className="text-xs font-semibold hidden md:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Profile info section */}
      <section className={`py-3 px-4 border-b no-print text-xs ${
        isDarkMode ? 'bg-zinc-950/60 border-zinc-900 text-zinc-300' : 'bg-slate-50 border-slate-200 text-zinc-600'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Round avatar display */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full overflow-hidden border border-blue-500/30 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-xs">
                {salesPhoto ? (
                  <img 
                    src={salesPhoto} 
                    alt="Foto Profil" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {(customSalesName || currentUser?.email || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse ${currentUser?.uid === 'demo_user_local_offline' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </div>

            {/* Profile info details */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span 
                  className="font-bold text-sm"
                  style={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                >
                  {customSalesName || 'Pegawai Tamu'}
                </span>
                {salesNip && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-blue-50 dark:bg-zinc-800 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-zinc-700">
                    NIP: {salesNip}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                {salesDivision && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-zinc-400" />
                    {salesDivision}
                  </span>
                )}
                {salesPhone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    {salesPhone}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                  {currentUser?.email || 'pegawai.tamu@workspace.local'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] self-end md:self-center">
            {currentUser?.uid !== 'demo_user_local_offline' && (
              <span className="flex items-center gap-1">
                <span className="text-zinc-400">Status Akun:</span>
                {currentUser?.email === 'admin@btn.co.id' || currentUser?.uid === 'admin_btn_shared_public' ? (
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/30">
                    Admin Mode
                  </strong>
                ) : (
                  <strong className="text-blue-500 font-semibold">{currentUser?.isAnonymous ? 'Demo Mode' : 'Aktif'}</strong>
                )}
              </span>
            )}
            <button
              onClick={() => {
                setTempSalesName(customSalesName);
                setTempSalesPhoto(salesPhoto);
                setTempSalesNip(salesNip);
                setTempSalesDivision(salesDivision);
                setTempSalesPhone(salesPhone);
                setShowSettingsModal(true);
              }}
              className="px-2.5 py-1 text-[11px] font-bold border border-blue-200 dark:border-zinc-800 bg-blue-50 dark:bg-zinc-900 text-blue-800 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Ubah Profil
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Content Canvas */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* KPI stats section */}
        <section id="stats-section" className="no-print">
          <StatsGrid customers={customers} isDarkMode={isDarkMode} />
        </section>

        {/* Target block */}
        <section className="no-print">
          <TargetTracker 
            userId={currentUser.uid} 
            customersCountThisMonth={customersCountThisMonth} 
            isDarkMode={isDarkMode} 
          />
        </section>

        {/* Primary Data Grid: Form input (Left) & Database (Right) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form input pendaftaran (occupies 1 col on lg screen) */}
          <div className="lg:col-span-1 no-print">
            <CustomerForm 
              onSave={handleSaveCustomer} 
              isDarkMode={isDarkMode} 
            />
          </div>

          {/* Table database of registrations (occupies 2 cols) */}
          <div className="lg:col-span-2">
            <CustomerTable 
              customers={customers} 
              onEdit={(cust) => {
                setEditingCustomer(cust);
                setShowEditForm(true);
              }}
              onDelete={handleDeleteCustomer}
              isDarkMode={isDarkMode} 
            />
          </div>
        </section>

        {/* Charts & Dynamic Visualizer */}
        <section id="charts-and-distributions" className="no-print">
          <Charts customers={customers} isDarkMode={isDarkMode} />
        </section>

      </main>

      {/* Dialog for Edit form (Mobile Drawer overlay/modal) */}
      <AnimatePresence>
        {showEditForm && editingCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <CustomerForm
                initialData={editingCustomer}
                onSave={handleSaveCustomer}
                onCancel={() => {
                  setEditingCustomer(null);
                  setShowEditForm(false);
                }}
                isDarkMode={isDarkMode}
              />
            </motion.div>
          </div>
        )}

        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900 mb-4">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Settings className="w-4.5 h-4.5 text-blue-500 animate-spin-slow" />
                  <span>Pengaturan Profil & Akun</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {/* Profile Photo Upload */}
                <div className="flex flex-col items-center justify-center gap-3 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/30 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-md">
                      {tempSalesPhoto ? (
                        <img 
                          src={tempSalesPhoto} 
                          alt="Foto Profil" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {(tempSalesName || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Hover label for upload */}
                    <label 
                      htmlFor="sales-photo-input"
                      className="absolute inset-0 bg-black/60 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Ganti Foto</span>
                    </label>
                    <input 
                      type="file" 
                      id="sales-photo-input" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Allow up to 5MB since we resize anyway
                          if (file.size > 5 * 1024 * 1024) {
                            alert("Ukuran foto terlalu besar. Silakan pilih foto di bawah 5MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              const img = new Image();
                              img.onload = () => {
                                // Profile avatar is small, 200px is perfect
                                const MAX_DIM = 200;
                                let width = img.width;
                                let height = img.height;
                                if (width > height) {
                                  if (width > MAX_DIM) {
                                    height = Math.round((height * MAX_DIM) / width);
                                    width = MAX_DIM;
                                  }
                                } else {
                                  if (height > MAX_DIM) {
                                    width = Math.round((width * MAX_DIM) / height);
                                    height = MAX_DIM;
                                  }
                                }
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                                  setTempSalesPhoto(compressedDataUrl);
                                } else {
                                  setTempSalesPhoto(reader.result as string);
                                }
                              };
                              img.src = reader.result;
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  <div className="flex gap-2 text-[10px]">
                    <button 
                      type="button" 
                      onClick={() => document.getElementById('sales-photo-input')?.click()}
                      className={`px-2.5 py-1.5 border rounded-lg font-semibold transition-all cursor-pointer ${
                        isDarkMode 
                          ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' 
                          : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600'
                      }`}
                    >
                      Unggah Foto
                    </button>
                    {tempSalesPhoto && (
                      <button 
                        type="button" 
                        onClick={() => setTempSalesPhoto('')}
                        className="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 border border-red-100 dark:border-red-950/40 rounded-lg font-semibold transition-all cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Name ID Sales */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <UserIcon className={`absolute left-3 top-2.5 w-4 h-4 ${
                      isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`} />
                    <input
                      type="text"
                      value={tempSalesName}
                      onChange={(e) => setTempSalesName(e.target.value)}
                      placeholder="Masukkan nama lengkap..."
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Employee ID (NIP) */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Nomor Induk Pegawai (NIP / Kode Pegawai)
                  </label>
                  <div className="relative">
                    <Award className={`absolute left-3 top-2.5 w-4 h-4 ${
                      isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`} />
                    <input
                      type="text"
                      value={tempSalesNip}
                      onChange={(e) => setTempSalesNip(e.target.value)}
                      placeholder="Contoh: BTN-94285"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Division / Branch */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Unit Kerja / Kantor Cabang (Cabang BTN)
                  </label>
                  <div className="relative">
                    <Building className={`absolute left-3 top-2.5 w-4 h-4 ${
                      isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`} />
                    <input
                      type="text"
                      value={tempSalesDivision}
                      onChange={(e) => setTempSalesDivision(e.target.value)}
                      placeholder="Contoh: KCU Harmoni / Divisi KPR"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${
                    isDarkMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}>
                    Nomor HP / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-2.5 w-4 h-4 ${
                      isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
                    }`} />
                    <input
                      type="text"
                      value={tempSalesPhone}
                      onChange={(e) => setTempSalesPhone(e.target.value)}
                      placeholder="Contoh: 0812XXXXXXXX"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100 focus:border-blue-500' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:bg-white focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isDarkMode 
                      ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-900' 
                      : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  Batal
                </button>
                 <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem('custom_sales_name', tempSalesName);
                      localStorage.setItem('sales_photo', tempSalesPhoto);
                      localStorage.setItem('sales_nip', tempSalesNip);
                      localStorage.setItem('sales_division', tempSalesDivision);
                      localStorage.setItem('sales_phone', tempSalesPhone);
                    } catch (storageErr) {
                      console.error('Failed to save profile settings to localStorage:', storageErr);
                      alert('Gagal menyimpan foto profil ke penyimpanan lokal karena ukurannya melebihi batas browser. Coba hapus foto profil atau gunakan foto dengan resolusi lebih kecil.');
                    }
                    
                    setCustomSalesName(tempSalesName);
                    setSalesPhoto(tempSalesPhoto);
                    setSalesNip(tempSalesNip);
                    setSalesDivision(tempSalesDivision);
                    setSalesPhone(tempSalesPhone);
                    
                    setShowSettingsModal(false);
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                >
                  Simpan Perubahan
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPwaInstallModal && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 ${
                isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900 mb-4">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Download className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
                  <span>Pasang Aplikasi BTN Tracker</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPwaInstallModal(false)}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center mb-5 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-900">
                <img 
                  src="/btn-logo.png" 
                  alt="BTN Logo" 
                  className="w-16 h-16 rounded-xl shadow-md mb-2.5 border border-blue-500/15"
                  referrerPolicy="no-referrer"
                />
                <h3 className="font-bold text-sm">BTN Tracker Nasabah</h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[280px]">
                  Pasang aplikasi di layar utama perangkat Anda untuk akses instan dan performa super responsif!
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Platform Guides */}
                <div className="grid grid-cols-1 gap-3">
                  {/* Android / Desktop */}
                  <div className={`p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-2 text-blue-600 dark:text-blue-400">
                      <Laptop className="w-4 h-4" />
                      <span>Android & Chrome / Edge (Desktop)</span>
                    </div>
                    <ul className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-1">
                      <li>Tekan tombol <strong className="text-emerald-500">Unduh Aplikasi</strong> di baris navigasi atas.</li>
                      <li>Atau klik tombol <strong className="font-bold">Install</strong> yang muncul otomatis di bilah alamat url browser Anda.</li>
                      <li>Konfirmasi pemasangan, aplikasi akan muncul di desktop / menu aplikasi Anda.</li>
                    </ul>
                  </div>

                  {/* iOS Safari */}
                  <div className={`p-3.5 rounded-xl border ${
                    isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold mb-2 text-indigo-600 dark:text-indigo-400">
                      <Smartphone className="w-4 h-4" />
                      <span>Apple iOS (iPhone / iPad)</span>
                    </div>
                    <ul className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-1">
                      <li>Buka aplikasi ini menggunakan browser bawaan <strong className="font-bold text-zinc-700 dark:text-zinc-300">Safari</strong>.</li>
                      <li>Ketuk tombol <strong className="font-bold text-blue-500">Share / Bagikan</strong> di bagian bawah layar.</li>
                      <li>Pilih menu <strong className="font-bold text-zinc-700 dark:text-zinc-300">"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).</li>
                      <li>Klik <strong className="font-bold text-blue-500">Tambah</strong> di pojok kanan atas.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPwaInstallModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isDarkMode 
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800' 
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  Tutup
                </button>
                {deferredPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPwaInstallModal(false);
                      handleInstallApp();
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] cursor-pointer transition-all shadow-md shadow-blue-500/15"
                  >
                    Instal Sekarang
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print-only layout */}
      <div className="hidden print:block p-8" id="print-layout-container">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-700">Laporan Tracker Nasabah</h1>
          <p className="text-sm text-gray-500 mt-1">Dihasilkan pada: {new Date().toLocaleString('id-ID')}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 border rounded">
            <span className="text-xs uppercase text-gray-400 font-bold">Total Rekening Nasabah</span>
            <div className="text-2xl font-bold">{customers.length}</div>
          </div>
          <div className="p-4 border rounded">
            <span className="text-xs uppercase text-gray-400 font-bold">Pencapaian Sukses (Berhasil)</span>
            <div className="text-2xl font-bold text-emerald-600">{customers.filter(c => c.status === 'Berhasil').length}</div>
          </div>
        </div>

        <table className="w-full text-left border-collapse border mt-4 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 font-bold">Nama Nasabah</th>
              <th className="border p-2 font-bold">Nomor HP</th>
              <th className="border p-2 font-bold">Bank</th>
              <th className="border p-2 font-bold">Tanggal</th>
              <th className="border p-2 font-bold">Status</th>
              <th className="border p-2 font-bold">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="border p-2 font-semibold">{c.name}</td>
                <td className="border p-2 font-mono">{c.phone}</td>
                <td className="border p-2">{c.bank}</td>
                <td className="border p-2">{c.registrationDate}</td>
                <td className={`border p-2 font-bold ${c.status === 'Berhasil' ? 'text-emerald-600' : c.status === 'Pending' ? 'text-amber-600' : 'text-red-650'}`}>{c.status}</td>
                <td className="border p-2">{c.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mini Footer no-print */}
      <footer className={`py-8 text-center text-xs mt-12 border-t no-print ${
        isDarkMode ? 'border-zinc-900 bg-zinc-950 text-zinc-600' : 'border-zinc-200 bg-zinc-100 text-zinc-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Tracker Nasabah. Hak Cipta Dilindungi.</p>
          <p className="mt-1">Didesain khusus untuk meningkatkan efisiensi operasional perbankan di Indonesia.</p>
        </div>
      </footer>

    </div>
  );
}
