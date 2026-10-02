// import { getConfigValue } from "@repo/common-lib/config/utils"
// import { exec } from "node:child_process";


// const backup = async () => {

//     const { database, host, port, username, password } = getConfigValue('database');

//     const date = new Date()
//     const today = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
//     const backupFile = `pg-backup-${today}.dump`;
//     const command = `pg_dump -U ${username} -h ${host} -p ${port} -d ${database} -F c -f ${backupFile}`;

//     exec(command, () => {



//     })

// }