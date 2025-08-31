import React from 'react';

const ConfigurationError: React.FC = () => {
  return (
    <div className="bg-brand-dark min-h-screen text-brand-text font-sans flex flex-col items-center justify-center p-4 selection:bg-brand-green selection:text-black">
      <div className="w-full max-w-2xl bg-brand-gray p-8 rounded-xl border border-brand-red text-center">
        <h1 className="text-3xl font-black text-brand-red mb-4">Configuration Error</h1>
        <p className="text-lg text-white mb-6">
          Your WalletConnect Project ID is missing. The application cannot start without it.
        </p>
        <div className="bg-brand-dark p-4 rounded-lg text-left">
          <p className="font-mono text-sm">
            Please follow these steps:
          </p>
          <ol className="list-decimal list-inside mt-2 space-y-2 font-mono text-sm">
            <li>Visit <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener noreferrer" className="text-brand-green underline hover:text-opacity-80">cloud.walletconnect.com</a> and sign in.</li>
            <li>Create a new project to get your Project ID.</li>
            <li>Open the <code className="bg-brand-light-gray px-1 py-0.5 rounded">constants.ts</code> file in the project.</li>
            <li>Replace the placeholder string with your actual Project ID.</li>
          </ol>
        </div>
        <p className="text-sm text-brand-text mt-6">
          After updating the file, please refresh the page.
        </p>
      </div>
    </div>
  );
};

export default ConfigurationError;
