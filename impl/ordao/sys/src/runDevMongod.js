import shelljs from "shelljs";

const dbpath = './tmp/mongodb/dev'
shelljs.exec(`mkdir -p ${dbpath}`);
shelljs.exec(`mongod --dbpath=${dbpath}`);
