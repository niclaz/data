import { run } from "https://deno.land/x/run_simple@2.3.0/mod.ts";
import { join } from "jsr:@std/path@0.224.0";
import { emptyDir } from "jsr:@std/fs@0.224.0";

async function optimizeDir (dir, sizes) {
    await emptyDir(join(dir, 'thumbs'))
    
    for await (const f of Deno.readDir(dir)) {
        const [ name, ext ] = f.name.split('.')
        if (!['jpg', 'jpeg', 'png'].includes(ext)) {
            continue;
        }
        
        // New - check if the image file exists before processing
        const imagePath = join(dir, f.name)
        if (!(await exists(imagePath))) {
        console.log(`${imagePath} does not exist, skipping ..`)
            continue;
        }

        console.log(`processing: ${name}`)

        const explain = await run(`identify ${join(dir, f.name)}`);
        const [ _, format, resolution ] = explain.split(' ')
        const [ width, height ] = resolution.split('x').map(c => Number(c))

        for (const size of Object.keys(sizes)) {
            const sizeConf = sizes[size];
            const outputFn = join(dir, 'thumbs', `${name}-${size}.webp`)

            let resize = `-resize ${sizeConf.width} ${Math.round(height/(width/sizeConf.width))}`;
            if (width <= sizeConf.width) {
                resize = '';
            }
            //console.log(outputFn, resolution, resize)
            await run(`cwebp ${join(dir, f.name)} -o ${outputFn}${resize ? ' '+resize : ''}`)
            console.log(`File writted: ${outputFn}`)
        }
    }
}

await optimizeDir('./src/people/_images', { '64px': { width: 64 }, '128px': { width: 128 }, '400px': { width: 400 } })

const eventSizes = { '128px': { width: 128 }, '360px': { width: 360 }, '640px': { width: 640 } }
await optimizeDir('./src/events/_images/2023', eventSizes)
await optimizeDir('./src/events/_images/2024', eventSizes)

//console.log(await run('ls'))
