onmessage = function (e) {
    console.log('Worker: Message received from main script');
    const message = e.data;

    console.log('Worker received data: ', message);
    if (message == "Start Working") {
        postMessage("Started Working!");
        Task();
    } else if (message == "Stop Working") {
        //Clean up any work and stop the worker
        postMessage("Stopping Working");
        this.clearInterval();
        this.close();
    }
}

function Task() {
    setInterval(function () {
        postMessage("Working...")
    }, 1000);
}
