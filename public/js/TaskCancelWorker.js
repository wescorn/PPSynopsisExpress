var startTime;
var intervalID;
onmessage = function (e) {
    console.log('Worker: Message received from main script');
    const message = e.data;

    console.log('Worker received data: ', message);
    console.log('SHOULD ENTER IF STATEMENT', message[0] == "Start Working");
    if (message[0] == "start working") {
        startTime = performance.now();
        console.log('initial starttime', startTime+"");
        postMessage("Started Working!");
        Loop(message[1]);
    } else if (message[0] == "Stop Working") {
        StopWorker();
    }
}

function StopWorker() {
    //Clean up any work and stop the worker
    console.log("run time: ", GetElapsedTime(startTime))
    postMessage(["Stopped Working", GetElapsedTime(startTime)]);
    this.clearInterval(intervalID);
    this.close();
}

function Loop(runTime) {
    const intervalID = setInterval(() => {
        if (GetElapsedTime(startTime) >= runTime) {
            StopWorker();
        } else {
            postMessage("Working...")
        }
    }, 1000);
}

function GetElapsedTime(startTime, decimals = 5) {
	const elapsedTime = (performance.now() - startTime) / 1000;
	return elapsedTime.toFixed(decimals);
}
