var ten_worker = new Worker('js/TaskCancelWorker.js');
var five_worker = new Worker('js/TaskCancelWorker.js');

ten_worker.postMessage(["start working", 10])
five_worker.postMessage(["start working", 5])

ten_worker.onmessage = function (event) {
    console.log('worker returned data: ',event.data);
};

five_worker.onmessage = function (event) {
    console.log('worker returned data: ',event.data);
};

document.getElementById("cancelTaskBtn").addEventListener("click", function () {
    ten_worker.postMessage(["Stop Working"]) 
    five_worker.postMessage(["Stop Working"])
});

ten_worker.onerror = function (event) {
    console.log('Error in main', event.message);
};

five_worker.onerror = function (event) {
    console.log('Error in main', event.message);
};