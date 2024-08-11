// actual transcoding takes place in the docker container spun up by the consumer nodes (consuming messages from SQS)
import dotenv from "dotenv"
import {S3Client, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3"
import ffmpeg from "fluent-ffmpeg"

const fs = require("node:fs/promises")

const RESOLUTIONS = [
    {name:"360p", width:480, height:360},
    {name:"480p", width:858, height:480},
]

dotenv.config()
const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
})

// transcoder

async function init() {
    // download the input file from S3 bucket
    const cmd = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: KEY,
    })

    const result = await s3Client.send(cmd)
    const originalPath = 'original-video.mp4'
    const originalVideoPath = path.resolve(originalPath)

    await fs.writeFile(originalPath, result.Body)

    // transcoding
    const promises = RESOLUTIONS.map(resolution => {
        const output = `video-${resolution.name}.mp4`

        return new Promise((resolve, reject) => {
            ffmpeg(originalVideoPath)
            .output(output)
            .withVideoCodec("libx264")
            .withAudioCodec("aac")
            .withSize(`${resolution.width}x${resolution.height}`)
            .on("end", async () => {
                // upload to a new bucket
                const putCmd = new PutObjectCommand({
                    Bucket: PRODUCTION_BUCKET_NAME,
                    Key: output,
                    Body: ,
                });
                await s3Client.send(putCmd);
                console.log(`uploaded ${output}`)
                resolve();
            })
            .format("mp4")
            .run();
        });
    });

    await Promise.all(promises)
}

init().finally(() => process.exit(0))