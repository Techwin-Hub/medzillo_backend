import React from 'react';
import { View } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { QuickActions } from './QuickActions';
import { BillingIcon, MedicineIcon, SupplierIcon } from './icons';
import { useClinicData } from '../contexts/ClinicDataContext';

interface DashboardProps {
    theme: 'light' | 'dark';
}

const MetricCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ theme }) => {
  const { setActiveView, inventory, billing } = useClinicData();
  const { medicines } = inventory;
  const { dailySalesData } = billing;

  const lowStockCount = medicines.filter(m => m.totalStockInUnits > 0 && m.totalStockInUnits < m.minStockLevel).length;
  const outOfStockCount = medicines.filter(m => m.totalStockInUnits === 0).length;

  const getNearExpiryCount = () => {
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);
    
    const nearExpiryBatches = new Set<string>();
    medicines.forEach(med => {
        med.batches.forEach(batch => {
            const expiryDate = new Date(batch.expiryDate);
            if (expiryDate > today && expiryDate <= ninetyDaysFromNow) {
                nearExpiryBatches.add(`${med.id}-${batch.batchNumber}`);
            }
        });
    });
    return nearExpiryBatches.size;
  };
  
  const nearExpiryCount = getNearExpiryCount();
  const totalMedicines = medicines.length;
  
  const isDarkMode = theme === 'dark';
  const textColor = isDarkMode ? '#e2e8f0' : '#334155'; // slate-200 vs slate-700
  const labelColor = isDarkMode ? '#f1f5f9' : '#0f172a'; // slate-100 vs slate-900

  const pharmacistActions = [
    { label: 'New Bill', view: 'billing' as View, icon: BillingIcon, color: 'bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800' },
    { label: 'Add Medicine', view: 'medicines' as View, icon: MedicineIcon, color: 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800' },
    { label: 'Suppliers', view: 'suppliers' as View, icon: SupplierIcon, color: 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800' },
  ];

  return (
    <div>
      <h2 className="text-3xl font.bold text-brand-secondary dark:text-slate-100 mb-6">Pharmacy Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Medicines" value={totalMedicines.toString()} color="text-brand-primary" />
        <MetricCard title="Low Stock Items" value={lowStockCount.toString()} color="text-warning" />
        <MetricCard title="Out of Stock" value={outOfStockCount.toString()} color="text-danger" />
        <MetricCard title="Near Expiry (90 days)" value={nearExpiryCount.toString()} color="text-orange-500" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-brand-secondary dark:text-slate-100 mb-4">Weekly Sales</h3>
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={dailySalesData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" stroke={textColor} fontSize={12} />
                <YAxis stroke={textColor} fontSize={12} />
                <Tooltip 
                  wrapperClassName="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm dark:bg-slate-900 dark:border-slate-700"
                  labelStyle={{ color: labelColor, fontWeight: 'bold' }}
                  itemStyle={{ color: textColor }}
                  cursor={{ fill: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : 'rgba(203, 213, 225, 0.5)' }}
                />
                <Legend wrapperStyle={{ color: textColor, paddingTop: '16px' }} />
                <Bar dataKey="sales" fill="#2563eb" name="Sales (₹)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-1">
          <QuickActions title="Quick Actions" actions={pharmacistActions} setActiveView={setActiveView} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
