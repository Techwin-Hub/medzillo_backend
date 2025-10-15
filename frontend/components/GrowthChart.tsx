import React from 'react';
import { Consultation } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GrowthChartProps {
    consultations: Consultation[];
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ consultations }) => {
    const chartData = consultations
        .filter(c => (c.vitals && (c.vitals.weight || c.vitals.height)))
        .map(c => ({
            date: new Date(c.date).toLocaleDateString('en-CA'), // YYYY-MM-DD for sorting
            Weight: c.vitals.weight,
            Height: c.vitals.height,
        }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(d => ({ ...d, date: new Date(d.date).toLocaleDateString('en-GB')})); // DD/MM/YYYY for display

    if (chartData.length < 2) {
        return (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Growth Chart</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 py-10">Not enough data to display a growth chart. At least two consultations with weight or height are needed.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Growth Chart</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                        <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 14, dx: -10 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} label={{ value: 'Height (cm)', angle: -90, position: 'insideRight', fill: '#64748b', fontSize: 14, dx: 10 }}/>
                        <Tooltip wrapperClassName="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm" />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="Weight" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Height" stroke="#82ca9d" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};