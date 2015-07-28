class Task {

    constructor(type, metaData, originID, originStream) {
        this.type = type
        this.metaData = metaData
        this.originStream = originStream
        this.originID = originID
    }

    setOriginStream(originStream) {
        this.originStream = originStream
    }

}

module.exports = Task