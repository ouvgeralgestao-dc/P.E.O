import { Client } from 'ssh2';

const config = {
    host: '138.97.15.214',
    port: 2250,
    username: 'administrator',
    password: 'comunicacao123!@#',
};

const conn = new Client();

conn.on('ready', () => {
    console.log('Client :: ready');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        // Try to list the directory to find the DB
        const remotePath = './P.E.O'; // Assuming relative to home
        console.log(`Listing directory: ${remotePath}`);

        sftp.readdir(remotePath, (err, list) => {
            if (err) {
                console.error('Error reading directory:', err);
                // Try alternate path if first one fails
                const altPath = '/administrator/P.E.O';
                console.log(`Trying alternate path: ${altPath}`);
                sftp.readdir(altPath, (err2, list2) => {
                    if (err2) {
                        console.error('Error reading alternate directory:', err2);
                        conn.end();
                        return;
                    }
                    console.log('Remote Files Found:', list2.map(f => f.filename).join(', '));
                    findAndDownload(sftp, altPath, list2);
                });
                return;
            }
            console.log('Remote Files Found:', list.map(f => f.filename).join(', '));
            findAndDownload(sftp, remotePath, list);
        });
    });
}).connect(config);

function findAndDownload(sftp, basePath, list) {
    const dbFile = list.find(f => f.filename.endsWith('.sqlite') || f.filename === 'organograma.sqlite');

    if (!dbFile) {
        console.log('No .sqlite file found in the directory.');
        // Maybe it's in a subdirectory or has a different name?
        // Let's look for any large file or folder that might contain it.
        console.log('Checking subdirectories...');
        const folders = list.filter(f => f.attrs.isDirectory());
        console.log('Subdirectories:', folders.map(f => f.filename).join(', '));

        // If "backend" exists, look inside
        const backendFolder = folders.find(f => f.filename === 'backend');
        if (backendFolder) {
            const nextPath = `${basePath}/backend/data`;
            console.log(`Checking ${nextPath}...`);
            sftp.readdir(nextPath, (err, subList) => {
                if (err) {
                    console.error('Error reading backend/data:', err);
                    conn.end();
                    return;
                }
                findAndDownload(sftp, nextPath, subList);
            });
            return;
        }

        conn.end();
        return;
    }

    const remoteFile = `${basePath}/${dbFile.filename}`;
    const localFile = './data/organograma_remote.sqlite';

    console.log(`Downloading ${remoteFile} to ${localFile}...`);

    sftp.fastGet(remoteFile, localFile, (err) => {
        if (err) {
            console.error('Download Error:', err);
        } else {
            console.log('✅ Download Successful!');
        }
        conn.end();
    });
}
