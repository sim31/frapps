import jsonfile from "jsonfile";
import shelljs from "shelljs";

const cfg = jsonfile.readFileSync("mongodump-cfg.json");

const uri = cfg.uri;

console.log(uri);

const outFile = `backup/${Date.now()}.bson`

const cmd = `mongodump --archive=${outFile} ${uri}`

shelljs.exec(cmd);

// mongodump --uri mongodb+srv://ornode-of2:<PASSWORD>@ordao-db.jjaxq.mongodb.net/<DATABASE> 