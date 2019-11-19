import * as stepper from "./stepper";
import commander from "commander";

const monolog = new commander.Command();

monolog.option("-d, --debug", "output extra debugging");

monolog.parse(process.argv);

if (monolog.debug) console.log("Debug mode.");
else stepper.writeSearches();
