const cp = require('child_process');
const { sign } = require('crypto');
let tasks = []
let availableProcesses = []
let maxProcesses = 20
let globalLogger = {
    warn: function (text) { },
    info: function (text) { },
    error: function(text) {}
}
// let globalLogger = {
//     warn: function (text) { 
//         console.log(text)
//     },
//     info: function (text) { 
//         console.log(text)
//     },
//     error: function (text) {
//         console.log(text)
//     }
// }
function initNewProcess(onSpawnCallback, cwd) {
    if (availableProcesses.length != maxProcesses) {
        let proc = new CustomChildProcess(onSpawnCallback, cwd)
        availableProcesses.push(proc)
        return proc
    }
    return false
}

function getIdleProcess() {
    for (let proc of availableProcesses) {
        if (proc.working == false) {
            return proc
        }
    }
    return false
}

function remProcess(proc) {
    const index = availableProcesses.indexOf(proc);
    if (index > -1) { // only splice array when item is found
        proc.kill()
        availableProcesses.splice(index, 1); // 2nd parameter means remove one item only
        globalLogger.info("Removed process " + proc.id)
        return true
    } else {
        return false
    }
}

function getUnallocatedProcessNumber() {
    return maxProcesses - availableProcesses.length;
}

function getFirstTask() {
    if (tasks.length > 0) {
        return tasks.shift()
    } else {
        return undefined
    }
}

function removeTaskFromlist(Task) {
    const index = tasks.indexOf(Task);
    if (index > -1) { // only splice array when item is found
        tasks.splice(index, 1); // 2nd parameter means remove one item only
        return true
    } else {
        return false
    }
}
let maxIdleTime = 300 * 100 // 300 ms * 100 for 30 seconds total default maxProcessIdleTime
function mainLoop() {
    // first loop through processes, check if any were idle for too long and if any can take new tasks
    for (let proc of availableProcesses) {
        if (!proc.working) {
            let task = getFirstTask()
            if (task) {
                proc.execTask(task)
                removeTaskFromlist(task)
            } else {// nothing to do
                if (Date.now() - proc.finishedWorkingAtEpoch > maxIdleTime) {
                    remProcess(proc)
                }
            }
        }
    } // if after allocting the existing processes a task there are still tasks left, check if we can initalize more processes to execute those tasks
    let unallocProc = getUnallocatedProcessNumber()
    if (unallocProc > 0) { // if we can create processes check if we have any tasks to asign
        for (let i = 0; i < unallocProc; i++){
            let task = getFirstTask()
            if (task) {
                let newProc = ""
                // when the process spawns it calls the callback with the custom context that executes the task
                let cacanaca = {
                    task: task,
                    removeTaskFromlist: removeTaskFromlist
                } // newProc is pased as a arg
                let callback = (function (newProc) {newProc.execTask(this.task); this.removeTaskFromlist(this.task)})
                newProc = initNewProcess(callback.bind(cacanaca), task.cwd)
            }
        }
    }
}

setInterval(() => {
    mainLoop()
    },
    20 // every 10 ms check the tasks and see if any processes can be made to complete the next task
)

class CustomChildProcess {
    #task
    #spawnedCallback
    constructor(spawnedCallback, cwd) {
        this.proc = cp.fork(path.dirname(require.resolve('tasking-pm')) + "/child", {cwd: cwd})
        this.id = this.proc.pid
        if (this.id == undefined) {
            throw("Cannot create anymore processes")
        }
        this.spawned = false
        this.working = false
        this.finishedWorkingAtEpoch = 0
        this.#spawnedCallback = spawnedCallback
        this.proc.on("spawn", this.#procSpawn.bind(this)) // forcefully bind context as it defaults to ChildProcess class
        this.proc.on("exit", this.#procExit.bind(this))
        this.proc.on("disconnect", this.#procDisconnect.bind(this))
        this.proc.on("message", this.#procMessage.bind(this))
        this.proc.on("error", this.#procError.bind(this))
    }
    execTask(task) {
        if (!this.working) {
            let tFunc = task.taskFunc
            let tArgs = task.taskArgs
            this.#task = task
            let toSend = {
                taskFunc: tFunc.toString(),
                taskArgs: tArgs,
            }
            let resSent = this.proc.send(toSend)
            if(!resSent) {
                globalLogger.error("Failed to send task to process!")
            }
            this.working = true
            return true
        } else {
            return false
        }
    }

    kill() {
        this.proc.kill()
    }

    #markIdle() {
        let epochTime = Date.now()
        this.working = false
        this.finishedWorkingAtEpoch = epochTime
    }

    #procSpawn() {
        if (!this.spawned) {
            this.spawned = true
            let Tid = this.id
            globalLogger.info("Process spawned with id: " + Tid)
            this.#spawnedCallback(this)
        }
    }
    #procExit(code, signal) { 
        globalLogger.error("Process " + this.id + " exited")
        globalLogger.error("Exit code: " + code)
        globalLogger.error("Exit signal: " + signal)
    }
    #procDisconnect() { 
        globalLogger.error("Process " + this.id + " disconnected from parent process, removing it from available processes")
        if (this.working) {
            tasks.push(this.#task) // if process disconnected then it probably crashed so the task needs to be rerun
            remProcess(this)
            delete this
        }
    }
    #procMessage(message, sendHandle) {
        // message: {
        // type: general/response
        // info: info/ response
        // }
        if (message != undefined) {
            switch (message["type"]){
                case "response":
                    this.#task.callback(message.info)
                    this.#markIdle()
                    break;
            }
        } else {
            // something is REALLY wrong
            globalLogger.error("Process " + this.id + "sent an empty message, closing process")
            this.proc.kill()
        }
        // globalLogger.info(message)
    }
    #procError(err) {
        if (!this.spawned) {
            globalLogger.error("Process" + this.id + "failed to spawn!")
            globalLogger.error("Error: " + err)
        } else {
            globalLogger.error("Process" + this.id + "threw error")
            globalLogger.error("Error: " + err)
        }
    }
}

function checkLogger(logger) {
    if (logger == undefined) {
        return false
    }
    if (logger.warn == undefined) {
            return false
    }
    if (logger.error == undefined) {
            return false
    }
    if (logger.info == undefined) {
            return false
    }
    return true
}
function getTaskFromID(taskID){
    for (let task of tasks) {
        if (task.id == taskID) {
            return task
        }
    }
}

function getRandomInt(nr) {
    return Math.round(Math.random() * nr)
}

class Task{
    constructor(cwd, taskFunc, taskArgs, callback, logger = globalLogger) {
        if (!checkLogger(logger)) {
            throw "Invalid logger passed to Task constructor"
        }
        this.cwd = cwd
        this.taskFunc = taskFunc
        this.taskArgs = taskArgs
        this.creationDate = Date.now()
        this.id = this.creationDate + "-" + getRandomInt(10000000000)
        this.callbackFunc = callback
        let count = 0
        let supremeCount = 0
        while (getTaskFromID(this.id) != undefined) {
            this.id = this.creationDate + "-" + getRandomInt(10000000000)
            count += 1
            if (count > 10000) {
                supremeCount += 1
                logger.warn("10,000 id's created but they already existed, maybe too many tasks generated")
            }
            if (supremeCount > 10000) {
                throw("Too many tasks generated, unable to generate more")
            }
        }
    }
    callback(result) {
        if (this.callbackFunc != undefined) {
            this.callbackFunc(result)
        }
    }
}

exports.setLogger = function(logger) {
    if (checkLogger(logger)) {
        globalLogger = logger
    } else {
        throw "Invalid logger passed to setLogger, logger must contain info warn and error functions"
    }
}
exports.setConfigs = function (maxIdleTime = 300 * 100, maxProcesses = 20) {
    maxIdleTime = maxIdleTime
    maxProcesses = maxProcesses
}
exports.newTask = async function (cwd, taskFunc, taskArgs, callback) {
    let nTask = new Task(cwd, taskFunc, taskArgs, callback)
    tasks.push(nTask)
    return nTask
}
exports.deleteTask = function (task) {
    removeTaskFromlist(task)
}
exports.flushTasks = function () {
    tasks = []
}
exports.closeAllProcesses = function () {
    for (let process of availableProcesses) {
        process.kill()
    }
}
exports.getTasks = function () {
    return tasks
}
exports.getActiveProcesses = function () {
    return availableProcesses
}
exports.exit = function () {
    exports.flushTasks()
    exports.closeAllProcesses()
}
