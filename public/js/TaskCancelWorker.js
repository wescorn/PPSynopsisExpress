onmessage = function (e) {
    console.log('Worker: Message received from main script');
    const message = e.data;

    console.log('received', message);
    postMessage("started working!");
    Task();
    
    
}

function Task() {
    setInterval(function () {
        postMessage("Working...")
    }, 1000);
}
