import React from 'react';

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  used: number;
  limit: number;
  toolType: string;
  message: string;
}

export const UpgradePopup: React.FC<UpgradePopupProps> = ({
  isOpen,
  onClose,
  plan,
  used,
  limit,
  toolType,
  message
}) => {
  if (!isOpen) return null;

  const plans = [
    {
      name: 'PLUS',
      price: '$4.99',
      features: ['10 Performance calculations', '10 Build plans', '25 Image generations']
    },
    {
      name: 'PRO', 
      price: '$9.99',
      features: ['15 Performance calculations', '15 Build plans', '60 Image generations']
    },
    {
      name: 'ULTRA',
      price: '$14.99', 
      features: ['25 Performance calculations', '25 Build plans', '100 Image generations']
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          <div className="mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-orange-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-orange-800">Quota Exceeded</span>
              </div>
              <p className="text-orange-700">
                You've used {used}/{limit} {toolType} calculations this month on your {plan} plan.
              </p>
              <p className="text-orange-700 mt-1">{message}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Choose Your Plan</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((planOption) => (
                <div 
                  key={planOption.name}
                  className={`border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow ${
                    planOption.name === 'PRO' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {planOption.name === 'PRO' && (
                    <div className="bg-blue-600 text-white text-sm font-semibold px-2 py-1 rounded mb-2 inline-block">
                      MOST POPULAR
                    </div>
                  )}
                  <h4 className="font-bold text-lg text-gray-900">{planOption.name}</h4>
                  <div className="text-2xl font-bold text-gray-900 mb-2">{planOption.price}<span className="text-sm font-normal text-gray-600">/month</span></div>
                  <ul className="space-y-1">
                    {planOption.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full mt-4 py-2 px-4 rounded font-semibold transition-colors ${
                    planOption.name === 'PRO' 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}>
                    Upgrade to {planOption.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              All plans include unlimited access to all tools. Cancel anytime.
            </p>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              Continue with current plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};