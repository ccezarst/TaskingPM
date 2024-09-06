let tasks = 50
const globalLogger = {
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

function delay(t, val) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(val);
        }, t);
    });
}

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

