

function ArraySumWorker() {
    onmessage = (e) => {
    	var arr = new Int8Array(e.data);
    	console.group('[worker]');
    	console.log('Data received from main thread: %i', arr[0]);
    	console.groupEnd();
    	/* changing the data */
    	arr[0] = 7;
    	/* posting to the main thread */
    	postMessage('');
    }
}

var w = new Worker(MakeWorkerPath(ArraySumWorker))
buff = new SharedArrayBuffer(1);
var arr = new Int8Array(buff);
/* setting data */
arr[0] = 9;
/* sending the buffer (copy) to worker */
w.postMessage(buff);
/* changing the data */
arr[0] = 1;
/* printing the data after the worker has changed it */
w.onmessage = (event) => {
	console.group('[main]');
	console.log('Updated data received from worker thread: %i', arr[0]);
	console.groupEnd();
}

w.onerror = (e) => {
	console.log('error in main', e.message);
}
w.onmessageerror = (m_event) => {
	console.log(m_event);
};
