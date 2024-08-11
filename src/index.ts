import {ReceiveMessageCommand, SQSClient} from "@aws-sdk/client-sqs"
import type {S3Event} from "aws-lambda"
import dotenv from "dotenv"

dotenv.config()
const accessKey: string = process.env.ACCESS_KEY_ID as string
const secretAccess: string = process.env.SECRET_ACCESS_KEY as string

const client = new SQSClient({
    region: process.env.REGION,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccess,
    },
})

async function init() {
    const cmd = new ReceiveMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10, // seconds
    })

    while(true) {
        const {Messages} = await client.send(cmd)
        if(!Messages) {
            console.log("no messages in queue")
            continue
        }

        for(const message of Messages) {
            const {MessageId, Body} = message
            console.log(`Message Recieved`, {MessageId, Body})
            
            // validate the message
            if (!Body) {
                continue
            }
            
            // storing in the the data parsed from the message into the S3Event structure
            const event = JSON.parse(Body) as S3Event
            // S3EventRecord holds the entire message
            
            // ignoring test events
            if ("Service" in event && "Event" in event) {
                if (event.Event === "s3:TestEvent") continue
            }

            // spin up the docker container
            // Records: S3EventRecord[]
            for (const record of event.Records) {
                const {s3} = record
                const {
                    bucket,
                    object: {key}
                } = s3
                
            }
            // delete message
        }
    }
}

init()