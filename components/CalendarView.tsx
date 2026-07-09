'use client';

import { useMemo, useState } from 'react';
import type { Transaction } from '@/lib/types';
import { groupByDay } from '@/lib/parser';
import { CATEGORY_COLORS } from '@/lib/categories';

interface CalendarViewProps {
  monthlyGrouped: Record<string, Transaction[]>;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.misc;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });
}

function getSign(type: 'debit' | 'credit'): string {
  return type === 'credit' ? '+' : '-';
}

export default function CalendarView({ monthlyGrouped }: CalendarViewProps) {
  const monthKeys = useMemo(() => Object.keys(monthlyGrouped).sort(), [monthlyGrouped]);
  const [monthIndex, setMonthIndex] = useState(0);

  if (monthKeys.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">No transactions to show on a calendar.</p>
      </div>
    );
  }

  const activeIndex = Math.min(monthIndex, monthKeys.length - 1);
  const activeMonthKey = monthKeys[activeIndex];
  const [year, month] = activeMonthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const dayGroups = groupByDay(monthlyGrouped[activeMonthKey]);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
          disabled={activeIndex === 0}
          className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ← Prev
        </button>
        <h3 className="font-semibold text-lg">{formatMonthLabel(activeMonthKey)}</h3>
        <button
          onClick={() => setMonthIndex((i) => Math.min(monthKeys.length - 1, i + 1))}
          disabled={activeIndex === monthKeys.length - 1}
          className="px-3 py-1 rounded border text-sm hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          Next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs font-semibold text-gray-500 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-[100px] border rounded p-1 text-xs ${
              day ? 'bg-white' : 'bg-gray-50 border-transparent'
            }`}
          >
            {day && (
              <>
                <div className="font-semibold text-gray-700 mb-1">{day}</div>
                <div className="space-y-0.5">
                  {(dayGroups[day] || []).map((t, i) => (
                    <div
                      key={i}
                      className={`rounded px-1 py-0.5 whitespace-normal break-words ${getCategoryColor(t.category || 'misc')}`}
                    >
                      {t.merchant} - {t.category} - {getSign(t.type)}${t.amount.toFixed(2)}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
