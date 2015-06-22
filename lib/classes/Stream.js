class Stream {
    constructor() {

    }

    /**
     * The poll function polls the Stream for a Task. It expects the returned value to be either a Task object or false.
     *
     * @returns {Task} or {false}
     */
    *poll() {

    }

    /**
     * Notifies the Stream that a Task that was submitted by this Stream was succesfully completed.
     *
     * Does not expect a return.
     *
     */
    *notifyCompletion(Task) {

    }

}

module.exports = Stream