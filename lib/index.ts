import { Construct } from 'constructs'
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda'
import { IRepository } from 'aws-cdk-lib/aws-ecr'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { CustomResource } from 'aws-cdk-lib'
import * as path from 'path'
import * as esbuild from 'esbuild'

export interface EnhancedScanningProps {
  repository: IRepository
}

export class EnhancedScanning extends Construct {
  constructor(scope: Construct, id: string, props: EnhancedScanningProps) {
    super(scope, id)

    // Bundle the Lambda function code
    const outfile = '/tmp/bundle.js'
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
      code: Code.fromAsset(outfile),
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
