
import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { LogEntry, ActivityDef, Language } from '../types';
import { useTranslation } from '../translations';

interface ActivityChartProps {
  logs: LogEntry[];
  activityDefs: ActivityDef[];
  language: Language;
  mode?: 'count' | 'cost';
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ logs, activityDefs, language, mode = 'count' }) => {
  const t = useTranslation(language);

  const data = useMemo(() => {
    const values: Record<string, number> = {};
    
    logs.forEach(log => {
      if (mode === 'count') {
        values[log.type] = (values[log.type] || 0) + 1;
      } else {
        values[log.type] = (values[log.type] || 0) + (log.cost || 0);
      }
    });

    return Object.keys(values)
      .map(key => {
        const def = activityDefs.find(d => d.id === key);
        return {
          name: def ? def.label[language] : key,
          originalKey: key,
          value: values[key],
          color: def ? def.color : '#9ca3af'
        };
      })
      .filter(item => item.value > 0); // Filter out zero cost items
  }, [logs, activityDefs, language, mode]);

  if (logs.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-gray-400">
        <p className="text-xs font-medium">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full p-4 flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={({ x, y, payload }) => (
                <text x={x} y={y} dy={10} textAnchor="middle" fill="#94a3b8" fontSize={10} fontWeight={500}>
                    {payload.value.substring(0, 3).toUpperCase()}
                </text>
            )}
            interval={0}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
            allowDecimals={false}
            tickFormatter={(value) => mode === 'cost' ? `${value}` : value}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px', fontWeight: 500 }}
            formatter={(value: number) => [
              mode === 'cost' 
                ? new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) 
                : value, 
              mode === 'cost' ? t.costTotal : t.activityCount
            ]}
          />
          <Bar dataKey="value" radius={[6, 6, 6, 6]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
