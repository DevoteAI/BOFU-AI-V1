import React from 'react';
import { ProductAnalysis } from '../../types/product';
import { EditableText } from '../ui/EditableText';

interface ProductHeaderProps {
  product: ProductAnalysis;
  index: number;
  updateProduct: (product: ProductAnalysis) => void;
}

export function ProductHeader({ product, index, updateProduct }: ProductHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary-500/20 via-secondary-900 to-primary-500/20 p-6 border-b border-primary-500/20 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-primary-500/20 text-primary-400 text-xs font-medium rounded">
              Product {index + 1}
            </span>
            {product.businessOverview?.industry && (
              <span className="px-2 py-1 bg-secondary-800 text-primary-400 text-xs font-medium rounded">
                {product.businessOverview.industry}
              </span>
            )}
          </div>
          <EditableText
            value={product.companyName || 'Company Name'}
            onUpdate={(value) => {
              updateProduct({
                ...product,
                companyName: value
              });
            }}
            label="Company Name"
          />
          <EditableText
            value={product.productDetails?.name || 'Unnamed Product'}
            onUpdate={(value) => {
              updateProduct({
                ...product,
                productDetails: {
                  ...product.productDetails,
                  name: value
                }
              });
            }}
            label="Product Name" 
          />
        </div>
      </div>
    </div>
  );
} 