import { Construct } from 'constructs'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { IRepository } from 'aws-cdk-lib/aws-ecr'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { CustomResource } from 'aws-cdk-lib'
import * as path from 'path'

export interface EnhancedScanningProps {
  repository: IRepository
}

export class EnhancedScanning extends Construct {
  constructor(scope: Construct, id: string, props: EnhancedScanningProps) {
    super(scope, id)

    const enableScanLambda = new NodejsFunction(this, 'EnableScanLambda', {
      entry: path.join(__dirname, 'enable-scan-lambda.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      bundling: {
        minify: true,
        target: 'es2023',
        forceDockerBundling: false, // Explicitly disable Docker bundling
      },
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
