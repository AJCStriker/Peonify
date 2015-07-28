var _ = require('underscore'),
    async = require('async'),
    co = require('co')

// Define the constructor for Peonify
function Peonify(threshold, interval) {

    this.taskQueue = []
    this.streams = []
    this.taskList = {}

    this.threshold = threshold || 3
    this.pollInterval = interval || 5000

    this.stopRequested = false

    // Bind the close process events to the stop requested event
    process.on('SIGTERM', function () {
        console.log('Shutdown notification received. Stopping gracefully...')
        this.stopRequested = true
    })

    // Bind the functions

    this.process = this.process.bind(this)
    this.beginProcessing = this.beginProcessing.bind(this)
}

// Define instance functions

/**
 * Merge the provided task list into the Queues task list
 * @param taskList
 */
Peonify.prototype.addTaskList = function(taskList) {
    this.taskList = _.extend(this.taskList, taskList)
}

/**
 * Add the provided stream to the list of polled streams
 * @param stream
 */
Peonify.prototype.addStream = function(stream) {
    this.streams.push(stream)
}

/**
 * Begin Processing.
 *
 * WARNING: THE BEHAVIOUR OF THIS FUNCTION IS UNDEFINED IF RUN MULTIPLE TIMES
 */
Peonify.prototype.beginProcessing = function() {
    // Check that noone has requested a shutdown
    if(!this.stopRequested) {

        // Call the process function
        co(this.process)

    }
}

/**
 * Represents one cycle of processing
 */
Peonify.prototype.process = function* () {

    // Poll each stream for its response until the threshold number of responses is reached or each stream has been polled once
    for ( let stream of this.streams ) {

        if ( this.taskQueue.length >= this.threshold ) {
            break;
        }

        var task = yield stream.poll()

        if ( task ) {
            task.setOriginStream(stream)
        }

        // If an actual task was returned, poll the stream until the threshold is reached or there are no tasks left
        while ( task !== false ) {
            // Add the task to the taskQueue
            this.taskQueue.push(task)

            // If we have space for more events then we keep polling.
            if( this.threshold >= this.taskQueue.length) {
                task = yield stream.poll()
                task.setOriginStream(stream)
            } else {
                task = false
            }
        }

    }

    // Lookup the execution function of the taskQueue
    var tasks = _.map(this.taskQueue, function(task) {

        var implementation = this.taskList[task.type]

        return implementation.process(task)

    }, this)

    // Run the tasks
    var results = []
    try {
        results = yield tasks
    } catch (e) {
        console.log('Unexpected Error')
        console.log(e)
    }

    // Provide notification of completion to streams
    for (let i = 0; i < results.length; ++i) {

        var currentTask = this.taskQueue[i],
            currentResult = results[i]

        // Provide notification if the result was true
        if ( currentResult ) {
            yield currentTask.originStream.notifyCompletion(currentTask)
        }

    }

    // Flush the queue
    this.taskQueue = []

    // Reschedule another execution
    setTimeout(this.beginProcessing, this.pollInterval)

}

// Attach classes exposed by the library as static functions

Peonify.Stream = require('./classes/Stream')

Peonify.TaskImplementation = require('./classes/TaskImplementation')

Peonify.Task = require('./classes/Task')

module.exports = Peonify