const cp = require('child_process');
const p = require("process")



p.on("message", async function (data) {
    if (data == undefined || data == {} || data == "") {
    } else {
        let cwd = data.cwd
        let taskFunc = data.taskFunc
        let taskArgs = data.taskArgs
        var asyncFn = new Function('return ' + taskFunc)();
        let result = await asyncFn(taskArgs);
        p.send({
            type: "response",
            info: result
        })
        

    }

}) 
// if we loose the connection with the main process, exit immediatly
p.on("disconnect", function () {
    // 2 is for disconnected
    p.exit(2)
})