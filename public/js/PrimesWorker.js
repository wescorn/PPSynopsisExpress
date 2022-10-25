/**
 * The worker function. It contains the onmessage function, and will be turned in to a worker.js file via the "MakeWorkerPath" function (see Index.cshtml). 
 */
 function PrimesWorker() {
	function onmessage(event) {
		const first = event.data[0];
		const last = event.data[1];
		var primesChunk = GetPrimes(first, last);
		postMessage(primesChunk);
		this.close();
	}

	function GetPrimes(first, last) {
		
		var primes = [];
		var num;
		var workDone = 0;
		var lastWorkDoneUpdate = 0;

        for (num = first; num <= last; num++)
        {
			workDone = (num/last)*100;
			if(workDone-5 > lastWorkDoneUpdate) {
				lastWorkDoneUpdate = workDone;
				postMessage(workDone.toFixed(2));
			}
            if(IsPrime(num)) primes.push(num);
        }
		postMessage(workDone);
        return primes;
	}

	function IsPrime(number) {
		if (number < 2) return false;
            if (number == 2 || number == 3) return true;
            if (number % 2 == 0 || number % 3 == 0) return false;
            for (var i = 5; i * i <= number; i += 6)
            {
                if (number % i == 0 || number % (i + 2) == 0)
                    return false;
            }
            return true;
	}
	if (typeof PrimesWorker !== "undefined") PrimesWorker.GetPrimes = GetPrimes; // This line lets us use the GetPrimes function outside the worker c:
};
/***************************************************************************************************************************************************** */






function SortingWorker() {
	function onmessage(event) {
		const sorted_data = event.data.flat(1).sort(function (a, b) { return a - b });
		postMessage(sorted_data);
	}
}

/**
 * 
 * @param {int} first 
 * @param {int} last 
 * @param {int} maxWorkers - (default 0) if 0, maxWorkers will be the equivalent of navigator.hardwareConcurrency.
 * @returns 
 */
function GetPrimesParallel(first, last) {
	const maxWorkers = parseInt(document.getElementById("PrimeMaxWorkers").value);
	var chunkedIntervals = ChunkIntervals(first, last, maxWorkers);
	var cores_available = navigator.hardwareConcurrency;
	var PrimesWorkerPath = MakeWorkerPath(PrimesWorker);
	var SortingWorkerPath = MakeWorkerPath(SortingWorker);
	console.log('chunked into ' + cores_available + ' chunks: ', chunkedIntervals);

	return Promise.all(chunkedIntervals.map((intervals, i) => {
		return new Promise(function (resolve, reject) {
			var worker = new Worker(PrimesWorkerPath)
			$("#workerList").append(`<li><label>Worker doing (${intervals[0]} - ${intervals[1]}) WORK DONE : </label><label id="worker_prog_${i}">0</label></li>`);
			worker.onmessage = (event) => {
				if(Array.isArray(event.data)) {
					resolve(event.data.flat(1));
				} else {
					$(`#worker_prog_${i}`).text(event.data + '%');
				}
			}
			worker.onerror = (err) => {
				console.log('got error!', err);
				reject(err)
			}
			worker.postMessage(intervals);
		});
	})).then((results) => {
		return new Promise(function (resolve, reject) {
			var worker = new Worker(SortingWorkerPath)
			var sorting_startTime = performance.now();
			worker.onmessage = (event) => {
				console.log('sorting time: ', GetElapsedTime(sorting_startTime), 'seconds');
				$("#ParallelPrimesDone").removeAttr("hidden"); /* Had to do a quick 10ms setTimeout after this, to give the UI time to update, before it inevitibly freezes when it starts populating the PrimesList */
				setTimeout(() => { 
					resolve(event.data);
				}, 10)
			}
			worker.postMessage(results);
		});
		
		
	});
}

function GetPrimesSequential(first, last) {
	PrimesWorker(); //Needs to be called to make GetPrimes available (:
	return new Promise((resolve, reject) => {
		var primes = PrimesWorker.GetPrimes(first, last);
		var sorting_startTime = performance.now();
		primes = primes.sort(function (a, b) { return a - b });
		$("#SequentialPrimesDone").removeAttr("hidden");
		console.log('sorting time: ', GetElapsedTime(sorting_startTime), 'seconds');
		resolve(primes);
	});
}


/**
 * In JS There doesn't seem to be an equivalent of .NET's "Partitioner.Create(first, last), range" method
 * so this function "chunks the user specified range", based on available CPU cores. (using navigator.hardwareConcurrency)
 * @param {int} min
 * @param {int} max
 * @returns Array - array of chunked intervals
 */
function ChunkIntervals(min, max, workers = 0) {
	const c = Math.floor(max / (workers == 0 ? navigator.hardwareConcurrency : workers));
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


function PopulatePrimeList(primes_arr) {
	if(primes_arr.length < 100000) {
		var options = [];
		for (var i =0; i < primes_arr.length; i++) {
			var o = document.createElement('OPTION');
			o.text = primes_arr[i];
			options.push(o);
		  }
		  $("#primes_list").empty().append(options);
	}
}

/**************************************************************************************************/
/***************************************Sequential*************************************************/

document.getElementById("btnPrimeSequential")?.addEventListener("click", () => {
	$("#SequentialPrimesDone").attr("hidden", true)
	const input_from = parseInt(document.getElementById("iPrimeSequentialFrom").value);
	const input_to = parseInt(document.getElementById("iPrimeSequentialTo").value);

	var Sequential_startTime = performance.now();
	GetPrimesSequential(input_from, input_to).then((results) => {
		console.log("Sequential Primes Results", results);
		$("#SeqElapsedTime").text(GetElapsedTime(Sequential_startTime));
		PopulatePrimeList(results);
	});
});

/**************************************************************************************************/
/******************************************Parallel************************************************/

document.getElementById("btnPrimeParallel").addEventListener("click", () => {
	$("#ParallelPrimesDone").attr("hidden", true)
	$("#workerList").empty();
	const input_from = parseInt(document.getElementById("iPrimeParallelFrom").value);
	const input_to = parseInt(document.getElementById("iPrimeParallelTo").value);

	var parallel_startTime = performance.now();
	GetPrimesParallel(input_from, input_to).then((results) => {
		console.log("Parallel Primes Results", results);
		$("#ParaElapsedTime").text(GetElapsedTime(parallel_startTime));
		PopulatePrimeList(results);
	});
});

/**************************************************************************************************/
