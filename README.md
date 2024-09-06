# TaskingPM
A NodeJS process manager module that uses a queue of  tasks to execute functions in paralel

https://github.com/ccezarst/TaskingPM
# How to use
To use you need to import the package by using
```
const taskingPM = require("taskingPM")
```

After, you can create a new task using
```
taskingPM.newTask(currentWorkingDirectory, taskFunction, taskArguments, callback)
```
  - currentWorkingDirectory: specified in which directory the processes will be started in, so you can import local files inside the task
  - taskFunction: the function that is going to be ran in paralel
  - taskArguments: parameters that you can pass to the taskFunction to make your life easier
  - callback: after the taskFunction is done and it returns it's result, this callback function is called with the parameter being the result

# Working example
```
const customLogger = {
    warn: function (text) {
        console.log(text)
    },
    info: function (text) {
        console.log(text)
    },
    error: function (text) {
        console.log(text)
    }
}
const taskingPM = new require("./index")
let tasks = 50
taskingPM.setLogger(customLogger)
let i = 1
let interval = setInterval(function () { 
    taskingPM.newTask(process.cwd(), (extra) => {
        return "Hello world! " + extra["count"]
    }, { count: i }, (result) => { console.log(result) })
    i += 1;
    if (i >= tasks) {
        clearInterval(interval)
    }
}, 100)


```
After waiting one second, the code creates 50 tasks.
You will see when a task is finished in the console as it prints "Hello world! {taskNumber}" 

# Extra functions
## setLogger
```
setLogger(logger)
```
By default the package doesn't output any logs.
Set a custom logger. The logger must include info, error and warn functions that take a single text parameter.
## setConfigs
```
setConfigs(maxIdleTime, maxProcesses) {},
```
Set configs.
maxIdleTime = the maximum amount of time(in ms) a process can be idle before it is killed. Longer times mean that sporatic(chaotic) creation of tasks are handler better but the processes remain open draining a bit of resources.
maxProcesses = the maximum amount of processes the package can generate

## deleteTask
```
deleteTask(task)
```
Deletes a task from the queue so it doesn't execute.
task = the tasks object(is returned from newTask)

## flushTasks
```
flushTasks()
```
Delete all tasks from the queue

## closeAllProcceses
```
closeAllProcesses()
```
Close all active processes

## getTasks
```
getTasks()
```
Returns all of the tasks in the queue in the order they are going to be executed.

## getActiveProcesses
```
getActiveProcesses()
```
Returns all open/active processes. The processes come in a CustomChildProcess object from where you can access information such as if the process is idle.

## exit
```
exit()
```
For exiting gracefully. Deletes all tasks and closes all processes

```
class CustomChildProcess {
  proc: handle to the nodejs child process
  id: internal process ID
  spawned: if the nodejs child process has spawned yet
  working: true when it's working on a task, false when idle
  finishedWorkingAtEpoch: when a process finishes working, it marks the date in this variable using Date.now()
  execTask(task): executes a task. It is recommended that you don't execute tasks manually :/
  kill: kills the nodejs child process
}
```
