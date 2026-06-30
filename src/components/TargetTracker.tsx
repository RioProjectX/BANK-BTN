import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, TrendingUp, Award, Settings, Check, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface TargetTrackerProps {
  userId: string;
  customersCountThisMonth: number;
  isDarkMode: boolean;
}

export default function TargetTracker({ userId, customersCountThisMonth, isDarkMode }: TargetTrackerProps) {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const [target, setTarget] = useState<number>(100);
  const [isEditing, setIsEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState<string>('100');
  const [saving, setSaving] = useState(false);

  // Load target from Firestore or LocalStorage
  useEffect(() => {
    if (!userId) return;

    const loadTarget = async () => {
      if (userId === 'demo_user_local_offline') {
        const stored = localStorage.getItem(`local_target_demo_${currentMonthStr}`);
        const val = stored ? parseInt(stored, 10) : 100;
        setTarget(isNaN(val) ? 100 : val);
        setTempTarget(String(isNaN(val) ? 100 : val));
        return;
      }

      try {
        const docRef = doc(db, 'targets', `${userId}_${currentMonthStr}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const val = docSnap.data().target;
          setTarget(val);
          setTempTarget(String(val));
        } else {
          // Set default target as 100
          setTarget(100);
          setTempTarget('100');
        }
      } catch (err) {
        console.error('Error loading target:', err);
        handleFirestoreError(err, OperationType.GET, `targets/${userId}_${currentMonthStr}`);
      }
    };

    loadTarget();
  }, [userId, currentMonthStr]);

  const handleSave = async () => {
    const num = parseInt(tempTarget, 10);
    if (isNaN(num) || num <= 0) return;

    setSaving(true);
    try {
      if (userId === 'demo_user_local_offline') {
        localStorage.setItem(`local_target_demo_${currentMonthStr}`, String(num));
        setTarget(num);
        setIsEditing(false);
        return;
      }

      const docRef = doc(db, 'targets', `${userId}_${currentMonthStr}`);
      await setDoc(docRef, {
        id: `${userId}_${currentMonthStr}`,
        userId,
        month: currentMonthStr,
        target: num
      }, { merge: true });
      
      setTarget(num);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving target:', err);
      handleFirestoreError(err, OperationType.WRITE, `targets/${userId}_${currentMonthStr}`);
    } finally {
      setSaving(false);
    }
  };

  const percentage = Math.min(100, Math.round((customersCountThisMonth / target) * 100)) || 0;

  // Indonesian name of month
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonthIndonesia = monthNames[new Date().getMonth()] + ' ' + new Date().getFullYear();

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isDarkMode 
        ? 'bg-zinc-900 border-zinc-800 shadow-lg' 
        : 'bg-white border-blue-50 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-blue-950 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Pencapaian Target Bulanan</h3>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>{currentMonthIndonesia}</p>
          </div>
        </div>

        <div>
          {isEditing ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                value={tempTarget}
                onChange={(e) => setTempTarget(e.target.value)}
                className={`w-16 px-1.5 py-1 text-center font-bold text-xs rounded border outline-none ${
                  isDarkMode 
                    ? 'bg-zinc-950 border-zinc-700 text-zinc-100' 
                    : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="p-1 rounded bg-blue-600 text-white cursor-pointer hover:bg-blue-500 transition-colors"
                title="Simpan Target"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          ) : (
            <button
              id="edit-target-btn"
              type="button"
              onClick={() => setIsEditing(true)}
              className={`p-1.5 rounded-lg border flex items-center justify-center cursor-pointer hover:scale-105 transition-all ${
                isDarkMode 
                  ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' 
                  : 'border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-700'
              }`}
              title="Sesuaikan Target"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="space-y-0.5">
            <span className={`text-[10px] uppercase font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Progress Bulanan</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">{customersCountThisMonth}</span>
              <span className={`text-sm ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>/ {target} Rekening</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-[10px] uppercase font-semibold ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>Pencapaian</span>
            <div className={`font-bold text-lg flex items-center gap-1 leading-none ${percentage >= 100 ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
              <TrendingUp className="w-4 h-4" />
              <span>{percentage}%</span>
            </div>
          </div>
        </div>

        {/* Progress Bar with smooth entrance and glow effect */}
        <div className={`w-full h-3 rounded-full overflow-hidden p-[2px] ${isDarkMode ? 'bg-zinc-950/80 border border-zinc-800' : 'bg-zinc-100 border border-zinc-200'}`}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full relative ${
              percentage >= 100 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/20' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-sm shadow-blue-500/20'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          {percentage >= 100 ? (
            <div className="flex items-center gap-1.5 p-2 bg-emerald-50 dark:bg-emerald-990/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs w-full">
              <Award className="w-4 h-4 text-emerald-500" />
              <span>Sempurna! Target bulan ini telah tercapai {customersCountThisMonth} rekening.</span>
            </div>
          ) : (
            <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Butuh <span className="font-semibold text-blue-600 dark:text-blue-400">{Math.max(0, target - customersCountThisMonth)}</span> pembukaan rekening lagi untuk memenuhi target bulanan Anda. Tetap semangat!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
