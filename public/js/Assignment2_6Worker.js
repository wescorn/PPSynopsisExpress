function Assignment2_6Worker() {

	var index;
    function onmessage(e) {
		const instruction = e.data?.instruction;
		const array = e.data?.array;
		const number = e.data?.number;
		const interval = e.data?.interval;
		const updated_index = e.data?.index;
    	
		switch (instruction) {
			case 'work':
				FindIndexOfFirstOccurence(array, number, interval[0], interval[1]).then(() => {
					postMessage(null);
					console.log(`worker of interval (${interval[0]} - ${interval[1]}) finished!`);
					this.close();
				});
				break;
			case 'update': // This doesn't work, cuz thread too busy 
				if(updated_index) index = updated_index;
				console.log('updated index in worker to', updated_index);
				break;
			default:
				console.log('instruction not defined: ', instruction);
				break;
		}
    }

	function FindIndexOfFirstOccurence(arr, number, from_i, to_i) {
		return new Promise((resolve, reject) => {
			for (let i = from_i; i < to_i; i++) {
				if(index !== undefined && index < from_i)
				{
					console.log('quit, cuz lower index was found in another worker');
					resolve();
					break;
				}
				if (number == arr[i] && (index === undefined || (i < index)))
				{
						postMessage(i);
						resolve();
						break;
				}
			}
			resolve();
		});
	}
}








	


function FindindexOfFirstOccurence_Parallel(rnd_array, number) {
	var Index;
	var FirstOccurenceWorkerPool = [];
	var FirstOccurenceWorkerPath = MakeWorkerPath(Assignment2_6Worker);

	const chunked_work = ChunkIntervals(0, rnd_array.length); // Chunk our work into index ranges, so we can divide the work between workers.

	//Make our workers and put them in an array, so we easily notify all workers whenever the index is updated.
	for (let index = 0; index < chunked_work.length; index++) {
		FirstOccurenceWorkerPool.push(new Worker(FirstOccurenceWorkerPath));
	}
	
	return Promise.all(chunked_work.map((interval, i) => {
		return new Promise(function (resolve, reject) {
			const worker = FirstOccurenceWorkerPool[i];
			worker.onmessage = (event) => {
				if(event.data === null) resolve();
				else if(event.data < Index || Index === undefined) {
					Index = event.data;
					FirstOccurenceWorkerPool.forEach((worker_entry, w_i) => {
						if(w_i != i) worker_entry.postMessage({
							instruction: 'update',
							index: Index
						});
					});
					resolve();
				}
			}
			worker.onerror = (err) => {
				console.log('got error!', err);
				reject(err)
			}
			worker.postMessage({
				instruction: 'work',
				array: rnd_array,
				number: number,
				interval: interval
			});
		})
	})).then(() => {
		return Index;
	})
}


/**
 * Uses workers to generate an array of random integers.
 * @param {int} size - amount of ints in the array you want. 
 * @param {int} workers_amount - amount of workers to spread the work out onto. (if 0, it will be equal to navigator.hardwareConcurrency)
 * @returns array - the array of random ints
 */
function InitializeArray(size, workers_amount = 0) {
	function RandomArrayGeneratorWorker() {
		function onmessage(e) {
			const length = e.data;
			const random_array = Array.from(Array(length)).map(x=>randomIntFromInterval(1, 100));
			postMessage(random_array);
			this.close();
		}
		function randomIntFromInterval(min, max) { // min and max included 
			return Math.floor(Math.random() * (max - min + 1) + min)
		}
	}

	var RndArrayWorkerPath = MakeWorkerPath(RandomArrayGeneratorWorker);
	var RndArrayWorkerPool = [];

	const cores = workers_amount == 0 ? navigator.hardwareConcurrency : workers_amount;
	for (let i = 0; i < cores; i++) {
		RndArrayWorkerPool.push(new Worker(RndArrayWorkerPath));
	}
	
	const WorkPromises = ChunkNumber(size, RndArrayWorkerPool.length).map((arr_size, entry_i) => {
		return new Promise((resolve, reject) => {
			const worker = RndArrayWorkerPool[entry_i];
			worker.postMessage(arr_size);
			worker.onmessage = (event) => {
				resolve(event.data);
			}
		})
	});
	return Promise.all(WorkPromises).then((res) => {
		return res.flat(1);
	});
}

/**
 * 
 * @param {int} number - the number to chunk
 * @param {int} chunks - the amount of chunks to chunk the number into (if 0, it will be equal to navigator.hardwareConcurrency)
 * @returns array of int
 */
function ChunkNumber(number, chunks = 0) {
	const m_chunks = (chunks == 0 ? navigator.hardwareConcurrency : chunks);
	const c = Math.floor(number / m_chunks);
	var chunk_arr = [];
	for (let index = 0; index < chunks; index++) {
		if(index+1 == m_chunks) {
			const current_sum = chunk_arr.reduce((partialSum, a) => partialSum + a, 0);
			chunk_arr.push(number-current_sum);
		} else {
			chunk_arr.push(c)
		}
	}
	return chunk_arr;
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

const arr_size = 1_000;
console.log("Initializing array of size", arr_size);
const Array_initialize_startTime = performance.now();
InitializeArray(arr_size).then((my_random_array) => {
	console.log("Time = "+ GetElapsedTime(Array_initialize_startTime) + " seconds");
	console.log('my array: ', my_random_array);
	FindindexOfFirstOccurence_Parallel(my_random_array, 10).then((Index) => {
		console.log('First occurence at index: ', Index);
	});
})