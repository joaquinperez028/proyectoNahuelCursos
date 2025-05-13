import { useState } from 'react';

type Purchase = {
  id: string;
  courseTitle: string;
  date: string;
  paymentMethod: string;
  amount: number;
  invoiceUrl?: string;
};

type PurchaseHistoryProps = {
  purchases: Purchase[];
};

export default function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Purchase;
    direction: 'ascending' | 'descending';
  }>({ key: 'date', direction: 'descending' });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const requestSort = (key: keyof Purchase) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedPurchases = [...purchases].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const getSortIndicator = (key: keyof Purchase) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#3A3A4C]">
        <thead className="bg-[#2A2A3C]">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-[#B4B4C0] uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('courseTitle')}
            >
              <div className="flex items-center">
                Curso {getSortIndicator('courseTitle')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-[#B4B4C0] uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('date')}
            >
              <div className="flex items-center">
                Fecha {getSortIndicator('date')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-[#B4B4C0] uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('paymentMethod')}
            >
              <div className="flex items-center">
                Método de Pago {getSortIndicator('paymentMethod')}
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-[#B4B4C0] uppercase tracking-wider cursor-pointer"
              onClick={() => requestSort('amount')}
            >
              <div className="flex items-center">
                Monto {getSortIndicator('amount')}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#B4B4C0] uppercase tracking-wider">
              Factura
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#1E1E2F] divide-y divide-[#3A3A4C]">
          {sortedPurchases.map((purchase) => (
            <tr key={purchase.id} className="hover:bg-[#2A2A3C] transition-colors duration-150">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                {purchase.courseTitle}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#B4B4C0]">
                {formatDate(purchase.date)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#B4B4C0]">
                {purchase.paymentMethod}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#B4B4C0]">
                {formatCurrency(purchase.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {purchase.invoiceUrl ? (
                  <a
                    href={purchase.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-[#007bff] hover:text-[#0069d9]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Descargar
                  </a>
                ) : (
                  <span className="text-[#8A8A9A]">No disponible</span>
                )}
              </td>
            </tr>
          ))}
          {sortedPurchases.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-[#B4B4C0]">
                No hay compras registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 