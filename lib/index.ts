import { Construct } from 'constructs'
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda'
import { IRepository } from 'aws-cdk-lib/aws-ecr'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { Aws, CustomResource, Duration } from 'aws-cdk-lib'
import * as path from 'path'
import * as fs from 'fs'
import * as esbuild from 'esbuild'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

export interface EnhancedScanningProps {
  repository: IRepository
  rules: Array<{
    scanFrequency: 'SCAN_ON_PUSH' | 'CONTINUOUS_SCAN' | 'MANUAL'
    repositoryFilters: Array<{
      filter: string
      filterType: 'WILDCARD'
    }>
  }>
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

    const defaultRules = [
      {
        scanFrequency: 'CONTINUOUS_SCAN',
        repositoryFilters: [
          {
            filter: props.repository.repositoryName,
            filterType: 'WILDCARD',
          },
        ],
      },
    ]

    const rules = JSON.stringify(props.rules || defaultRules)

    const enableScanLambda = new Function(this, 'EnableScanLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(tmpDir),
      timeout: Duration.seconds(300),
      memorySize: 512,
      environment: {
        RULES: rules,
        AWS_ACCOUNT_ID: Aws.ACCOUNT_ID,
      },
    })

    // Add IAM permissions to the Lambda function
    enableScanLambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'ecr:PutRegistryScanningConfiguration',
          'inspector2:Enable',
          'inspector2:Disable',
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
  }
}
