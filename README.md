# TaskingPM
A NodeJS process manager module that uses a queue of  tasks to execute functions in paralel

# How to use
To use you need to import the package by using
```
const taskingPM = require("./index")
```

After, you can create a new task using
```
taskingPM.newTask(currentWorkingDirectory, taskFunction, taskArguments, callback, customLogger
```
  - currentWorkingDirectory: specified in which directory the processes will be started in, so you can import local files inside the task
  - taskFunction: the function that is going to be ran in paralel
  - taskArguments: parameters that you can pass to the taskFunction to make your life easier
  - callback: after the taskFunction is done and it returns it's result, this callback function is called with the parameter being the result
  - customLogger: customLogger that exposes the activity of the package, it has to have info error and warn functions that take a single text parameter.
