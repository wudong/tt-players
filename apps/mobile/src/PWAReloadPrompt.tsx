import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const PWAReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <>
      {(offlineReady || needRefresh) && (
        <div 
          className="snackbar-toast color-white bg-blue-dark mb-4 show" 
          style={{ 
            position: 'fixed', 
            bottom: '70px', 
            left: '15px', 
            right: '15px', 
            zIndex: 1000,
            display: 'block',
            opacity: 1,
            pointerEvents: 'auto'
          }}
        >
          {offlineReady ? (
            <div className="d-flex">
              <div className="align-self-center">
                <i className="fa fa-info-circle me-3 font-20"></i>
              </div>
              <div className="align-self-center">
                <h1 className="color-white font-16 mb-0">App Ready</h1>
                <p className="color-white mb-0 opacity-70">App is ready to work offline.</p>
              </div>
              <div className="ms-auto align-self-center">
                <button onClick={close} className="btn btn-xxs bg-white color-black rounded-s">Close</button>
              </div>
            </div>
          ) : (
            <div className="d-flex">
              <div className="align-self-center">
                <i className="fa fa-sync fa-spin me-3 font-20"></i>
              </div>
              <div className="align-self-center">
                <h1 className="color-white font-16 mb-0">Update Available</h1>
                <p className="color-white mb-0 opacity-70">New content is available, click to update.</p>
              </div>
              <div className="ms-auto align-self-center">
                <button 
                  onClick={() => updateServiceWorker(true)} 
                  className="btn btn-xxs bg-white color-black rounded-s me-2"
                >
                  Update
                </button>
                <button onClick={close} className="btn btn-xxs border-white color-white rounded-s">Close</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PWAReloadPrompt;
