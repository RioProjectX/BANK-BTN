import React from 'react';
import { motion } from 'motion/react';
import { Users, Calendar, BarChart2, Award, Zap, TrendingUp, Sliders, Check } from 'lucide-react';
import { Customer } from '../types';

interface StatsGridProps {
  customers: Customer[];
  isDarkMode: boolean;
}

export default function StatsGrid({ customers, isDarkMode }: StatsGridProps) {
  // Get current date strings in local timezone
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Calculate Start of Week (Monday as start)
  const getStartOfWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  };
  const startOfWeekStr = getStartOfWeek();

  // Current Month & Year
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const currentYearStr = todayStr.substring(0, 4); // YYYY

  // Filters
  const totalToday = customers.filter(c => c.registrationDate === todayStr).length;
  const totalThisWeek = customers.filter(c => c.registrationDate >= startOfWeekStr && c.registrationDate <= todayStr).length;
  const totalThisMonth = customers.filter(c => c.registrationDate.startsWith(currentMonthStr)).length;
  const totalThisYear = customers.filter(c => c.registrationDate.startsWith(currentYearStr)).length;
  const totalAll = customers.length;

  // State for rates
  const [btnRate, setBtnRate] = React.useState<number>(() => {
    const saved = localStorage.getItem('omset_rate_btn');
    return saved !== null ? parseInt(saved, 10) : 46000;
  });

  const [seabankRate, setSeabankRate] = React.useState<number>(() => {
    const saved = localStorage.getItem('omset_rate_seabank');
    return saved !== null ? parseInt(saved, 10) : 20000;
  });

  const [isEditingRates, setIsEditingRates] = React.useState(false);

  // Calculate Daily Omset: BTN = btnRate, SeaBank = seabankRate
  const todaySuccessCustomers = customers.filter(c => c.registrationDate === todayStr && c.status === 'Berhasil');
  const btnTodayCount = todaySuccessCustomers.filter(c => c.bank === 'BTN').length;
  const seabankTodayCount = todaySuccessCustomers.filter(c => c.bank === 'SeaBank').length;
  const dailyOmset = (btnTodayCount * btnRate) + (seabankTodayCount * seabankRate);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const cardItems = [
    {
      id: 'today',
      title: 'Hari Ini',
      value: totalToday,
      icon: Zap,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      lightBg: 'bg-amber-50 dark:bg-amber-950/20',
      desc: 'Pendaftaran sukses hari ini'
    },
    {
      id: 'week3',
      title: 'Minggu Ini',
      value: totalThisWeek,
      icon: Calendar,
      color: 'bg-blue-600',
      textColor: 'text-blue-600',
      lightBg: 'bg-blue-50 dark:bg-blue-950/20',
      desc: 'Pencapaian minggu berjalan'
    },
    {
      id: 'month',
      title: 'Bulan Ini',
      value: totalThisMonth,
      icon: BarChart2,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      lightBg: 'bg-indigo-50 dark:bg-indigo-950/20',
      desc: 'Akumulasi bulan berjalan'
    },
    {
      id: 'omset-harian',
      title: 'Omset Harian',
      value: dailyOmset,
      isCurrency: true,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/20',
      desc: `Selesai Hari Ini — BTN: ${btnTodayCount}, SeaBank: ${seabankTodayCount}`
    },
    {
      id: 'all',
      title: 'Semua Portofolio',
      value: totalAll,
      icon: Users,
      color: 'bg-violet-600',
      textColor: 'text-violet-600',
      lightBg: 'bg-violet-50 dark:bg-violet-950/20',
      desc: 'Total keseluruhan nasabah'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6"
    >
      {cardItems.map((item, index) => {
        const isOmsetCard = item.id === 'omset-harian';

        return (
          <motion.div
            key={item.id}
            variants={itemAnim}
            whileHover={isOmsetCard && isEditingRates ? {} : { y: -3 }}
            className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between min-h-[125px] ${
              isDarkMode 
                ? 'bg-zinc-900 border-zinc-800 shadow-zinc-950/50 shadow-md' 
                : 'bg-white border-blue-50 shadow-sm'
            } ${index === 4 ? 'col-span-2 md:col-span-1' : ''}`}
          >
            {isOmsetCard && isEditingRates ? (
              <div className="space-y-2 h-full flex flex-col justify-between w-full">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Ubah Rate Rekening
                  </span>
                  <button 
                    onClick={() => setIsEditingRates(false)}
                    className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer transition-colors shadow-sm"
                    title="Simpan"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <label className={`block text-[9px] font-bold mb-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      BTN (Rp)
                    </label>
                    <input
                      type="number"
                      value={btnRate}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setBtnRate(val);
                        localStorage.setItem('omset_rate_btn', val.toString());
                      }}
                      className={`w-full px-1.5 py-1 text-xs rounded border outline-none font-sans font-semibold ${
                        isDarkMode 
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-emerald-500' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[9px] font-bold mb-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      SeaBank (Rp)
                    </label>
                    <input
                      type="number"
                      value={seabankRate}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setSeabankRate(val);
                        localStorage.setItem('omset_rate_seabank', val.toString());
                      }}
                      className={`w-full px-1.5 py-1 text-xs rounded border outline-none font-sans font-semibold ${
                        isDarkMode 
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-emerald-500' 
                          : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-emerald-600'
                      }`}
                    />
                  </div>
                </div>
                <div className="text-[9px] text-zinc-400 dark:text-zinc-500 italic mt-0.5">
                  Berhasil hari ini: BTN={btnTodayCount}, SeaBank={seabankTodayCount}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isOmsetCard && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingRates(true);
                          }}
                          className={`p-1 rounded text-zinc-400 hover:text-emerald-500 transition-colors cursor-pointer ${
                            isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                          }`}
                          title="Ubah Rate"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className={`p-2 rounded-lg ${item.lightBg} ${item.textColor}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 overflow-hidden">
                    <span className={`font-extrabold tracking-tight font-sans truncate ${item.isCurrency ? 'text-sm sm:text-base md:text-lg lg:text-xl' : 'text-2xl md:text-3xl'}`}>
                      {item.isCurrency ? formatRupiah(item.value) : item.value}
                    </span>
                    {!item.isCurrency && (
                      <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        pax
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-[10px] sm:text-xs mt-2 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {item.desc}
                </p>
              </>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
