import { Construct } from 'constructs'
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda'
import { IRepository } from 'aws-cdk-lib/aws-ecr'
import { Provider } from 'aws-cdk-lib/custom-resources'
import { Aws, CustomResource, Duration } from 'aws-cdk-lib'
import * as path from 'path'
import * as fs from 'fs'
import * as esbuild from 'esbuild'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'

export interface EcrScanFilter {
  filter: string
  filterType: 'WILDCARD' | 'PREFIX_MATCH'
}

export interface EnhancedScanningProps {
  repository: IRepository
  filters?: EcrScanFilter[]
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

    const defaultFilter: EcrScanFilter = {
      filter: props.repository.repositoryName,
      filterType: 'PREFIX_MATCH',
    }

    const filters = props.filters || [defaultFilter]

    const enableScanLambda = new Function(this, 'EnableScanLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(tmpDir),
      timeout: Duration.seconds(300),
      memorySize: 512,
      environment: {
        FILTERS: JSON.stringify(filters),
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
        ],
        resources: ['*'],
        effect: Effect.ALLOW,
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
