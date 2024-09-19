import { Construct } from 'constructs'
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda'
import { IRepository } from 'aws-cdk-lib/aws-ecr'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { CustomResource, Duration } from 'aws-cdk-lib'
import * as path from 'path'
import * as fs from 'fs'
import * as esbuild from 'esbuild'

export interface EnhancedScanningProps {
  repository: IRepository
}

export class EnhancedScanning extends Construct {
  constructor(scope: Construct, id: string, props: EnhancedScanningProps) {
    super(scope, id)

    // Create a temporary directory for the bundled Lambda code
    const tmpDir = fs.mkdtempSync('/tmp/lambda-')
    const outfile = path.join(tmpDir, 'index.js')

    // Bundle the Lambda function code
    esbuild.buildSync({
      entryPoints: [path.join(__dirname, 'lambda-handler.ts')],
      bundle: true,
      outfile,
      platform: 'node',
      target: 'node20',
      minify: true,
    })

    const enableScanLambda = new Function(this, 'EnableScanLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(tmpDir),
      timeout: Duration.seconds(300),
      memorySize: 512,
    })

    // Create a custom resource that invokes the Lambda function
    const enableScanCustomResource = new Provider(
      this,
      'EnableScanCustomResource',
      {
        onEventHandler: enableScanLambda,
      }
    )

    new CustomResource(this, 'EnableEnhancedScan', {
      serviceToken: enableScanCustomResource.serviceToken,
    })

    // Grant the Lambda permission to modify the ECR scanning configuration
    props.repository.grant(
      enableScanLambda,
      'ecr:PutRegistryScanningConfiguration'
    )
  }
}
