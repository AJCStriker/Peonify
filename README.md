# Peonify

Peonify is a background service handler designed to help make the design of distributed systems easier.

## Core Concepts

### The Queue

A queue is the core concept of Peonify. A queue is a list of tasks to be handled by THIS PROCESSOR.

As Peonify is designed to be inherently scalable in its runtime, it is important to understand that the queue represents the set of tasks that this processor will attempt to complete.

### The Tasks

A queue is made up of tasks. Each task represents a discreet unit of activity which should be executed by the processor.

A task will not necessarily be executed as soon as it is added to a queue, so tasks must be redundant towards multiple execution.

## The TaskLists

A task list is an execution for a type of task. It provides a specialized implementation for the generic information provided by the Task format.

### The Streams

Each peonify instance has a list of attached streams. Streams are essentially plugins that submit Tasks to the Queue.

They can provide a custom interface for any inbound method required, such as database polling, webhooks, websockets, or message queues.

## Getting Started

1. Create an instance of Peonify as follows. This serves as the queue.

index.js
```
var Peonify = require('peonify')

var taskQueue = new Peonify()
```

2. Next you will need to add a task list to your peonify instance. This takes the form of a dictionary (javascript object) mapping the type as a string,
to an implementation.

index.js
```
var taskList = {
    "email-task": require('./emailTask')
}

taskQueue.addTaskList(taskList)
```

emailTask.js
```
var Task = require('peonify').TaskImplementation

class EmailTask extends TaskImplementation {

    constructor(metaData) {
        super(metaData)
        // MetaData is store in this.metaData for access. It contains all the data that the specialized implementation
        //  requires to complete its duties
    }

    *execute() {
        // Send an email here. This function is run using the co library, so asynchronous actions can be yielded for flow control.
    }

}

module.exports = EmailTask
```

3. Add a stream so that tasks can flow into the queue

index.js
```
var simpleTaskGenerator = require('./task-generator.js')

taskQueue.addStream(simpleTaskGenerator)
```

task-generator.js
```
var Stream = require('peonify').Stream,
    Task = require('poenify').Task

class TaskGenerator extends Stream {

    *poll() {
        // When this method is called, some actions should be taken and either a task, in the generic JSON format
        //  or false, in the event no task is available, should be returned.

        // The method will be called periodically by the processor when the queue is becoming depleted.

        return new Task(...,...,...)
    }

    *notifyComplete() {
        // This task allows notification that a particular task has been succesfully completed.
        // This function is particularly useful when working with a message queue that has integrated retries.
        // No return is expected
    }

}
```

4. Run the task queue

To begin handling tasks, run the beginProcessing function.

index.js
```
taskQueue.beginProcessing()
```

The task queue will then run until the program receives a SIGTERM event. At that stage, the queue will cease to poll its streams and gracefully end all tasks within its queue.