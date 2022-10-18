/**
 * The worker function. It contains the onmessage function, and will be turned in to a worker.js file via the "MakeWorkerPath" function (see Index.cshtml). 
 */
 function PrimesWorker() {
	function onmessage(event) {
		const first = event.data[0];
		const last = event.data[1];
		var primesChunk = GetPrimes(first, last);
		postMessage(primesChunk);
	}
	function GetPrimes(first, last) {
		var primes = [];
		var n = first <= 1 ? 2 : first;
		while (n < last) {
			var k = Math.sqrt(n);
			var found = false;

			for (var i = 2; !found && i <= k; ++i) {
				found = n % i === 0;
			}

			if (!found) {
				primes.push(n);
			}
			n++;
		}
		return primes;
	}
	if (typeof PrimesWorker !== "undefined") PrimesWorker.GetPrimes = GetPrimes; // This line lets us use the GetPrimes function outside the worker c:
};



function GetPrimesParallel(first, last) {
	var chunkedIntervals = ChunkIntervals(first, last);
	var cores_available = navigator.hardwareConcurrency;
	var PrimesWorkerPath = MakeWorkerPath(PrimesWorker);
	console.log('chunked into ' + cores_available + ' chunks: ', chunkedIntervals);

	return Promise.all(chunkedIntervals.map(intervals => {
		return new Promise(function (resolve, reject) {
			var worker = new Worker(PrimesWorkerPath)
			worker.onmessage = (event) => {
				resolve(event.data.flat(1).sort(function (a, b) { return a - b }));
			}
			worker.postMessage(intervals);
		});
	}));
}

function GetPrimesSequential(first, last) {
	PrimesWorker(); //Needs to be called to make GetPrimes available (:
	var data = PrimesWorker.GetPrimes(first, last).sort(function (a, b) { return a - b })
	return data;
}


/**
 * In JS There doesn't seem to be an equivalent of .NET's "Partitioner.Create(first, last), range" method
 * so this function "chunks the user specified range", based on available CPU cores. (using navigator.hardwareConcurrency)
 * @param {int} min
 * @param {int} max
 * @returns Array - array of chunked intervals
 */
function ChunkIntervals(min, max) {
	const c = Math.floor(max / navigator.hardwareConcurrency);
	const r = [];
	for (var i = min; i <= max; i += c) {
		const a = i == 0 ? i : i += 1;
		const b = i + c > max ? max : i + c;
		if (a < max) r.push([a, b])
	}
	return r;
}




/**
 * Gets the difference in seconds between the given startTime and now.
 * @param {DOMHighResTimeStamp} startTime - basically performance.now()
 * @param {int} decimals (optional, cuz default is 5)
 * @returns {String} - the seconds between the given startTime and Now.
 */
function GetElapsedTime(startTime, decimals = 5) {
	const elapsedTime = (performance.now() - startTime) / 1000;
	return elapsedTime.toFixed(decimals);
}

/**************************************************************************************************/



/**************************************************************************************************/
let pp_interval = [0, 100_000_00];
console.log(`Running parallel prime number thing: ${pp_interval[0]} - ${pp_interval[1]}`);
var parallel_startTime = performance.now();
GetPrimesParallel(pp_interval[0], pp_interval[1]).then((results) => {
	console.log("Parallel Results", results);
	console.log('Elapsed Time (Parallel)', GetElapsedTime(parallel_startTime));
});



/*var sequential_startTime = performance.now();
var SeqPrimes = GetPrimesSequential(0, 100_000_00);
console.log('Elapsed Time (Sequential)', GetElapsedTime(sequential_startTime));*/
