var m_worker = new Worker('js/TaskCancelWorker.js');
    //new Worker('TaskCancelWorker.js')

m_worker.postMessage("Running Loop...")

m_worker.onmessage = function (event) {
    console.log('worker returned data: ',event.data);
};

document.getElementById("cancelTaskBtn").addEventListener("click", function () {
    m_worker.terminate()
    console.log('terminated worker :)');
});

m_worker.onerror = function (event) {
    console.log('Error in main', event.message);
};


/*
function asyncThread(fn, ...args) {
    if (!window.Worker) {
        throw Promise.reject(new ReferenceError(`WebWorkers aren't available.`));
    }
    
    const fnWorker = `
  self.onmessage = function(message) {
    (${fn.toString()})
      .apply(null, message.data)
      .then(result => self.postMessage(result));
  }`;

    return new Promise((resolve, reject) => {
        try {
            const blob = new Blob([fnWorker], { type: 'text/javascript' });
            const blobUrl = window.URL.createObjectURL(blob);
            const worker = new Worker(blobUrl);
            window.URL.revokeObjectURL(blobUrl);

            worker.onmessage = result => {
                resolve(result.data);
                worker.terminate();
            };

            worker.onerror = error => {
                reject(error);
                worker.terminate();
            };

            worker.postMessage(args);
        } catch (error) {
            reject(error);
        }
    });
}
*/