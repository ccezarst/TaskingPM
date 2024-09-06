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

