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

setTimeout(function () {
    for (let i = 0; i < tasks; i++){
        taskingPM.newTask(process.cwd(), (count) => {
            delay(Math.random() * 500) // waits a random amount between 0 and 500 ms
            return "Hello world! " + count
        }, i, (result)=> { console.log(result)})
    }
}, 1000)
setTimeout(function () {
    for (let i = 0; i < tasks; i++){
        taskingPM.newTask(process.cwd(), async (count) => {
            let caca = Date.now()
            await new Promise(resolve => setTimeout(resolve, 5000))
            return Date.now() - caca + " " + count
        }, i + tasks, (result)=> { console.log(result)})
    }
}, 3000)
