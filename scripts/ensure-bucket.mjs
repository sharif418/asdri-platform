#!/usr/bin/env node
// Creates the media bucket (if missing) and sets a public-read policy for GET objects.
// Works against any S3-compatible server (RustFS, Garage, MinIO, R2, AWS) using the env vars
// from .env.example. Run: `bun run s3:init`.
// dotenv is a dev convenience; in the production image the env comes from the orchestrator.
// env comes from the container
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const bucket = process.env.S3_BUCKET
if (!bucket) {
  console.log('S3_BUCKET is empty — uploads use local disk; nothing to do.')
  process.exit(0)
}

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
})

try {
  await client.send(new HeadBucketCommand({ Bucket: bucket }))
  console.log(`bucket "${bucket}" exists`)
} catch {
  await client.send(new CreateBucketCommand({ Bucket: bucket }))
  console.log(`bucket "${bucket}" created`)
}

const policy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'PublicRead',
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${bucket}/*`],
    },
  ],
}

try {
  await client.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: JSON.stringify(policy) }))
  console.log('public-read policy applied')
} catch (err) {
  console.warn(
    `could not set bucket policy (${err?.name ?? err}); set public read in the console if needed`,
  )
}
