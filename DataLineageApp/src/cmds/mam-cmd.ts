import Simulate from "./simulate";

const argv2 = process.argv.length >= 3 ? process.argv[2].toLowerCase() : "";
console.log(`argvs 2 is: ${argv2}`);
switch (argv2) {
case "-simulate":
    (new Simulate()).run();
    break;
default:
}