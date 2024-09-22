import { Construct } from 'constructs'
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda'
import { IRepository } from 'aws-cdk-lib/aws-ecr'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { Aws, CustomResource, Duration, Stack } from 'aws-cdk-lib'
import * as path from 'path'
import * as fs from 'fs'
import * as esbuild from 'esbuild'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { NagSuppressions } from 'cdk-nag'

export interface EnhancedScanningProps {
  repository: IRepository
}

export class EnhancedScanning extends Construct {
  public readonly enableScanLambda: Function
  public readonly enableScanCustomResource: Provider
  public readonly customResource: CustomResource

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

    this.enableScanLambda = new Function(this, 'EnableScanLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(tmpDir),
      timeout: Duration.seconds(300),
      memorySize: 512,
      environment: {
        AWS_ACCOUNT_ID: Aws.ACCOUNT_ID,
        REPOSITORY_NAME: props.repository.repositoryName,
      },
    })

    // Add IAM permissions to the Lambda function
    this.enableScanLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'inspector2:Enable',
          'inspector2:ListAccountPermissions',
          'iam:CreateServiceLinkedRole',
        ],
        resources: ['*'],
        effect: Effect.ALLOW,
        conditions: {
          StringEqualsIfExists: {
            'iam:AWSServiceName': 'inspector2.amazonaws.com',
          },
        },
      })
    )

    // Add a scoped-down policy for PutRegistryScanningConfiguration
    this.enableScanLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['ecr:PutRegistryScanningConfiguration'],
        resources: [props.repository.repositoryArn],
        effect: Effect.ALLOW,
      })
    )

    // Create a custom resource that invokes the Lambda function
    this.enableScanCustomResource = new Provider(
      this,
      'EnableScanCustomResource',
      {
        onEventHandler: this.enableScanLambda,
      }
    )

    this.customResource = new CustomResource(this, 'EnableEnhancedScan', {
      serviceToken: this.enableScanCustomResource.serviceToken,
    })
  }

  public addNagSuppressions(stack: Stack) {
    const suppressions = [
      {
        id: 'AwsSolutions-IAM4',
        reason:
          'AWS Lambda basic execution role is required for the Lambda function',
      },
      {
        id: 'AwsSolutions-IAM5',
        reason:
          'Lambda function needs these permissions to enable ECR enhanced scanning',
      },
    ]

    // Add suppressions to the Lambda function and its role
    NagSuppressions.addResourceSuppressions(
      this.enableScanLambda,
      suppressions,
      true
    )

    // Add suppressions to the Custom Resource Provider
    NagSuppressions.addResourceSuppressions(
      this.enableScanCustomResource,
      suppressions,
      true
    )
  }
}
