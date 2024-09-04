const taskingPM = require("./index")
let tasks = 50
setTimeout(function () {
    for (let i = 0; i < tasks; i++){
        taskingPM.newTask(process.cwd(), (count) => {
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
