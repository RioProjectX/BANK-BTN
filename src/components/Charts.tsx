import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import { Customer } from '../types';
import { Landmark, CheckCircle, AlertTriangle, XOctagon, Calendar } from 'lucide-react';

interface ChartsProps {
  customers: Customer[];
  isDarkMode: boolean;
}

export default function Charts({ customers, isDarkMode }: ChartsProps) {
  const [activeInterval, setActiveInterval] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  // Distribution calculations
  const totalBTN = customers.filter(c => c.bank === 'BTN').length;
  const totalSeaBank = customers.filter(c => c.bank === 'SeaBank').length;

  const totalBerhasil = customers.filter(c => c.status === 'Berhasil').length;
  const totalPending = customers.filter(c => c.status === 'Pending').length;
  const totalDitolak = customers.filter(c => c.status === 'Ditolak').length;

  // 1. Daily registration (Last 7 days registration count)
  const getDailyData = () => {
    const data: { name: string; Berhasil: number; Pending: number; Ditolak: number }[] = [];
    const today = new Date();
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const filtered = customers.filter(c => c.registrationDate === dateStr);
      
      // format day name in Indonesian
      const optionsStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
      const label = `${optionsStr} (${d.getDate()}/${d.getMonth() + 1})`;
      
      data.push({
        name: label,
        Berhasil: filtered.filter(c => c.status === 'Berhasil').length,
        Pending: filtered.filter(c => c.status === 'Pending').length,
        Ditolak: filtered.filter(c => c.status === 'Ditolak').length,
      });
    }
    return data;
  };

  // 2. Weekly registration (Current week days pendaftaran count)
  const getWeeklyData = () => {
    const data: { name: string; Berhasil: number; Pending: number; Ditolak: number }[] = [];
    const today = new Date();
    const day = today.getDay();
    const mondayDiff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today.setDate(mondayDiff));

    const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const dateStr = currentDay.toISOString().split('T')[0];

      const filtered = customers.filter(c => c.registrationDate === dateStr);
      
      data.push({
        name: weekdays[i],
        Berhasil: filtered.filter(c => c.status === 'Berhasil').length,
        Pending: filtered.filter(c => c.status === 'Pending').length,
        Ditolak: filtered.filter(c => c.status === 'Ditolak').length,
      });
    }
    return data;
  };

  // 3. Monthly registration (Months of the current year)
  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date().getFullYear();
    
    return months.map((monthName, index) => {
      const monthIndexStr = String(index + 1).padStart(2, '0');
      const prefix = `${currentYear}-${monthIndexStr}`;
      
      const filtered = customers.filter(c => c.registrationDate.startsWith(prefix));
      
      return {
        name: monthName,
        Berhasil: filtered.filter(c => c.status === 'Berhasil').length,
        Pending: filtered.filter(c => c.status === 'Pending').length,
        Ditolak: filtered.filter(c => c.status === 'Ditolak').length,
      };
    });
  };

  // Select chart input data based on tab state
  const chartData = activeInterval === 'harian' 
    ? getDailyData() 
    : activeInterval === 'mingguan' 
      ? getWeeklyData() 
      : getMonthlyData();

  // Static bank pie data
  const bankPieData = [
    { name: 'BTN', value: totalBTN, color: '#1D4ED8' },
    { name: 'SeaBank', value: totalSeaBank, color: '#F97316' }
  ].filter(b => b.value > 0);

  // If both empty, use zero indicators
  const displayBankPie = bankPieData.length > 0 ? bankPieData : [
    { name: 'BTN', value: 0, color: '#3B82F6' },
    { name: 'SeaBank', value: 0, color: '#F97316' }
  ];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkMode ? '#18181B' : '#FFFFFF',
      borderColor: isDarkMode ? '#27272A' : '#E2E8F0',
      borderRadius: '8px',
      color: isDarkMode ? '#F4F4F5' : '#0F172A'
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* 1. Main growth chart occupying 2 columns */}
      <div className={`col-span-1 lg:col-span-2 p-5 rounded-2xl border transition-all ${
        isDarkMode 
          ? 'bg-zinc-900 border-zinc-800 shadow-lg' 
          : 'bg-white border-blue-50 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Grafik Pertumbuhan Nasabah</span>
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Data pembukaan rekening dalam kurun waktu terpilih
            </p>
          </div>

          {/* Tab selector */}
          <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
            {(['harian', 'mingguan', 'bulanan'] as const).map(tab => (
              <button
                id={`chart-tab-${tab}`}
                key={tab}
                type="button"
                onClick={() => setActiveInterval(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-all ${
                  activeInterval === tab
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white text-blue-700 shadow-sm font-bold'
                    : isDarkMode 
                      ? 'text-zinc-400 hover:text-zinc-100' 
                      : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBerhasil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDitolak" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#27272A' : '#F1F5F9'} />
              <XAxis 
                dataKey="name" 
                stroke={isDarkMode ? '#A1A1AA' : '#64748B'} 
                fontSize={10} 
                tickLine={false} 
              />
              <YAxis 
                stroke={isDarkMode ? '#A1A1AA' : '#64748B'} 
                fontSize={10} 
                tickLine={false} 
                allowDecimals={false}
              />
              <Tooltip {...tooltipStyle} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: '500' }} />
              <Area 
                type="monotone" 
                dataKey="Berhasil" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorBerhasil)" 
                strokeWidth={2.5}
                activeDot={{ r: 6 }}
              />
              <Area 
                type="monotone" 
                dataKey="Pending" 
                stroke="#F59E0B" 
                fillOpacity={1} 
                fill="url(#colorPending)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="Ditolak" 
                stroke="#EF4444" 
                fillOpacity={1} 
                fill="url(#colorDitolak)" 
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Side Panel - Bank & Status Distributions */}
      <div className="flex flex-col gap-6">
        {/* Bank & Status distribution widgets */}
        <div className={`p-5 rounded-2xl border flex-1 transition-all ${
          isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 shadow-lg' 
            : 'bg-white border-blue-50 shadow-sm'
        }`}>
          <h3 className="font-bold text-sm tracking-tight mb-4 flex items-center justify-between">
            <span>Proporsi Bank Penerbit</span>
            <span className={`text-[10px] uppercase font-semibold border px-2 py-0.5 rounded-full ${isDarkMode ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'}`}>
              BTN vs SeaBank
            </span>
          </h3>

          <div className="flex items-center justify-around h-24 my-1">
            {/* Visual Mini bar stats */}
            <div className="w-full space-y-4">
              {/* BTN bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                    Bank BTN
                  </span>
                  <span>{totalBTN} Pasien / {customers.length > 0 ? Math.round((totalBTN / customers.length) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div 
                    className="h-full rounded-full bg-blue-600" 
                    style={{ width: `${customers.length > 0 ? (totalBTN / customers.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* SeaBank bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                    SeaBank
                  </span>
                  <span>{totalSeaBank} Pasien / {customers.length > 0 ? Math.round((totalSeaBank / customers.length) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div 
                    className="h-full rounded-full bg-orange-500" 
                    style={{ width: `${customers.length > 0 ? (totalSeaBank / customers.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-4 pt-3 border-t text-xs flex justify-between items-center ${isDarkMode ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-400'}`}>
            <span>Total BTN: <strong>{totalBTN}</strong></span>
            <span>Total SeaBank: <strong>{totalSeaBank}</strong></span>
          </div>
        </div>

        {/* Status Distribution */}
        <div className={`p-5 rounded-2xl border flex-1 transition-all ${
          isDarkMode 
            ? 'bg-zinc-900 border-zinc-800 shadow-lg' 
            : 'bg-white border-blue-50 shadow-sm'
        }`}>
          <h3 className="font-bold text-sm tracking-tight mb-4">
            Status Kelulusan Berkas
          </h3>

          <div className="space-y-2.5">
            {/* Berhasil */}
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="flex items-center gap-2">
                <div className="p-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">Berhasil Disetujui</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-500">{totalBerhasil}</span>
                <span className={`text-[10px] ml-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  ({customers.length > 0 ? Math.round((totalBerhasil / customers.length) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* Pending */}
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="flex items-center gap-2">
                <div className="p-1 text-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">Dalam Proses (Pending)</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-amber-500">{totalPending}</span>
                <span className={`text-[10px] ml-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  ({customers.length > 0 ? Math.round((totalPending / customers.length) * 100) : 0}%)
                </span>
              </div>
            </div>

            {/* Ditolak */}
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800' : 'bg-zinc-50 border-zinc-100'}`}>
              <div className="flex items-center gap-2">
                <div className="p-1 text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <XOctagon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold">Ditolak</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-red-500">{totalDitolak}</span>
                <span className={`text-[10px] ml-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  ({customers.length > 0 ? Math.round((totalDitolak / customers.length) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
