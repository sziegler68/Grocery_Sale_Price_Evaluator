import React from 'react';
import { Trash2 } from 'lucide-react';
import type { PriceTagData } from '../../../shared/lib/ai/geminiVision';

interface MultiScanTableProps {
    scans: PriceTagData[];
    onRemove: (index: number) => void;
}

export const MultiScanTable: React.FC<MultiScanTableProps> = ({
    scans,
    onRemove,
}) => {
    if (scans.length === 0) {
        return (
            <div className="text-center p-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No items scanned yet. Scan your first item to start.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            #
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {scans.map((scan, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {index + 1}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {scan.itemName || 'Unknown Item'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">
                                ${(scan.memberPrice || scan.regularPrice || 0).toFixed(2)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">
                                {scan.memberUnitPrice ? `$${scan.memberUnitPrice.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                    onClick={() => onRemove(index)}
                                    className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Remove scan"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50">
                    <tr>
                        <td colSpan={2} className="px-3 py-2 text-sm font-bold text-gray-900 text-right">
                            Total:
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                            ${scans.reduce((sum, s) => sum + (s.memberPrice || s.regularPrice || 0), 0).toFixed(2)}
                        </td>
                        <td colSpan={2}></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};
