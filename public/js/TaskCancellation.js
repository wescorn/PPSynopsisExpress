var m_worker = new Worker('js/TaskCancelWorker.js');

m_worker.postMessage("Start Working")

m_worker.onmessage = function (event) {
    console.log('worker returned data: ',event.data);
};

document.getElementById("cancelTaskBtn").addEventListener("click", function () {
    m_worker.postMessage("Stop Working")
    console.log('Worker stopped');
});

m_worker.onerror = function (event) {
    console.log('Error in main', event.message);
};