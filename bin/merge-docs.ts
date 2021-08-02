import { readFileSync, writeFileSync } from 'fs';

function run() {
    const readme: string[] = [];
    for (const file of process.argv.slice(2)) {
        const md = readFileSync(`./docs/${file}`).toString().split('\n');
        readme.push(
            md.slice(2).join('\n')
                .replace(/\(..\/wiki\/(\w+)\)/g, '(#$1)')
                .replace(/\(..\/wiki\/\w+#(\w+)\)/g, '(#$1)')
        );
    }
    writeFileSync('README.md', readme.join('\n\n'));
}

run();
