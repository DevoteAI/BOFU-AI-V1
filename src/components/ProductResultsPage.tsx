// ... existing code ...
      {/* Header Section */}
      <PageHeader 
        companyName={editedProducts[0]?.companyName} 
        productCount={editedProducts.length}
        onStartNew={onStartNew}
      />

      {/* Instructions Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-secondary-50/50 to-white rounded-xl border border-secondary-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="min-w-[24px] mt-1">
              <div className="w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-secondary-700">i</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-2">How to Complete Your Analysis</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">1</span>
                  </div>
                  <p>Click <span className="font-medium text-primary-600">Identify Competitors</span> to let AI automatically discover and analyze your competitors</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">2</span>
                  </div>
                  <p>Optionally, use <span className="font-medium text-primary-600">Add Competitor Manually</span> to include additional competitors you know</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">3</span>
                  </div>
                  <p>Click <span className="font-medium text-primary-600">Analyze Competitors</span> to generate a detailed competitive analysis report</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-secondary-700">4</span>
                  </div>
                  <p>Finally, click <span className="font-medium text-success-600">Save Analysis</span> to preserve your results</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}