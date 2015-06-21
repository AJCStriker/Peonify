class Task {

    constructor(type, metaData, originStream) {
        this.type = type
        this.metaData = metaData
        this.originStream = originStream
    }

    setOriginStream(originStream) {
        this.originStream = originStream
    }

}