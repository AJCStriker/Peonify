var _ = require('underscore'),
    async = require('async'),
    co = require('co')

// Define the constructor for Peonify
function Peonify(threshold, interval) {

    var taskQueue = []
    var streams = []
    var taskList = {}

    this.threshold = threshold || 3
    this.pollInterval = interval || 5000

    this.stopRequested = false

    // Bind the close process events to the stop requested event
    process.on('SIGTERM', function () {
        this.stopRequested = true
    })
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

    // Setup a loop that runs until the process is terminated
    if(!this.stopRequested) {

        // Continually poll the streams until a task is recovered. Once a task is recovered, wait until all streams
        //  have been polled that iteration until a maximum of 'threshold' events have been recovered or all streams have been exhausted.

        var peonifyInstance = this

        async.each(this.streams, function(stream, callback) {

            // Check that the task queue has less or equal to the threshold number of events
            if ( peonifyInstance.taskQueue.length <= peonifyInstance.threshold ) {

                // Poll the stream for a task with co
                var pollExecution = co(stream.poll)

                pollExecution.then(function(result) {
                    // If the result is not false, then add it to the queue for execution
                    if ( result !== false ) {
                        peonifyInstance.taskQueue.push(result)
                    }

                    callback(null)
                })

            }

        }, function(err, result) {

            // Simultaneously execute the events that have been queued
            var tasksToExecute = _.map(peonifyInstance.taskQueue, function(task) {

                // Lookup the implementation for the task
                var implementation = peonifyInstance.taskList[task.type]

                // Return the generator that when executed completes the Task
                return implementation.process.bind(Task)

            })

            // Execute the array of tasks using Co
            co(function*() {

                yield tasksToExecute
                
            }).then(function(){

                // Sleep for the pollInterval to prevent CPU clusterfuck
                setTimeout(peonifyInstance.pollInterval, peonifyInstance.beginProcessing())

            })

        })
    }

}

// Attach classes exposed by the library as static functions

Peonify.Stream = require('./classes/Stream')

Poenify.TaskImplementation = require('./classes/Task')

Poenify.Task = require('./classes/TaskImplementation')

module.exports = Peonify