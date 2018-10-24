let observeMutations, disconnectObserver;

// fall back to polling if MutationObserver is not available
if (window.MutationObserver) {
  observeMutations = (callback, _timeout, node, config) => {
    const observer = new MutationObserver(callback);
    observer.observe(node, config);
    return observer;
  }
  disconnectObserver = (observer) => {
    observer.disconnect();
  }
} else {
  observeMutations = (callback, timeout) => {
    return setInterval(callback, Math.min(timeout, 500));
  }
  disconnectObserver = (observer) => {
    clearInterval(observer);
  }
}

const defaultObserverConfig = {
  attributes: true,
  childList: true,
  subtree: true
};

export default function timedMutationObserver(callback, timeout, node = document, observerConfig = defaultObserverConfig) {
  let cancel;
  const result = new Promise((resolve, reject) => {
    let observer;
    let timeoutId;
    let success;

    cancel = () => {
      disconnectObserver(observer);
      clearTimeout(timeoutId);
      if (!success) {
        const reason = new Error('MutationObserver cancelled');
        reason.cancelled = true;
        reason.timedOut = false;
        reject(reason);
      }
    };

    observer = observeMutations(() => {
      if (!success && (success = callback())) {
        cancel();
        resolve(success);
      }
    }, timeout, node, observerConfig);

    timeoutId = setTimeout(() => {
      disconnectObserver(observer);
      clearTimeout(timeoutId);
      if (!success) {
        const reason = new Error('MutationObserver timed out');
        reason.cancelled = false;
        reason.timedOut = true;
        reject(reason);
      }
    }, timeout);
  });
  result.cancel = cancel;
  return result;
}
