import * as stepper from "./stepper";
import commander from "commander";

const monolog = new commander.Command();

monolog.option("-d, --debug", "output extra debugging");
monolog.option("-p, --printvisit <idVisit>", "idVisit from Matomo", parseInt);

monolog.parse(process.argv);

if (monolog.debug) console.log("Debug mode.");
else if (monolog.printvisit) stepper.printVisit(monolog.printvisit);
else stepper.writeSearches();
