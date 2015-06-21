var _ = require('underscore')

// Define the constructor for Peonify
function Peonify(threshold, interval) {

    var taskQueue = []
    var streams = []
    var taskList = {}

    this.threshold = threshold || 3
    this.pollInterval = interval || 5000

    this.stopRequested = false

    // Bind the close process events to the stop requested event

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

Peonify.prototype.beginProcessing = function() {

    // Setup a loop that runs until the process is terminated
    while(!this.stopRequested) {

        // Continually poll the streams until a task is recovered. Once a task is recovered, wait until all streams
        //  have been polled that iteration until a maximum of 'threshold' events have been recovered.
        _.each(this.streams, function(stream) {

            // Check that the task queue has less or equal to the threshold number of events
            if ( this.taskQueue.length <= this.threshold ) {

                // Poll the stream for a task with co
                var result = stream.poll()

                // If the result is not false, then add it to the queue for execution
                if ( result !== false ) {
                    this.taskQueue.push(result)
                }

            }

        }, this)

        // Simultaneously execute the events that have been queued
        var tasksToExecute = _.map(this.taskQueue, function(task) {

            // Lookup the implementation for the task
            var implementation = this.taskList[task.type]

            // Return the generator that when executed completes the Task
            return implementation.process.bind(Task)

        }, this)

        // Execute the array of tasks using Co
        co(tasksToExecute)

        // Sleep for the pollInterval to prevent CPU clusterfuck

    }

}

// Attach classes exposed by the library as static functions

Peonify.Stream = require('./classes/Stream')

Poenify.TaskImplementation = require('./classes/Task')

Poenify.Task = require('./classes/TaskImplementation')

module.exports = Peonify