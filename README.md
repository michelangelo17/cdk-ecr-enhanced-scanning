# CDK ECR Enhanced Scanning

This project provides a CDK (Cloud Development Kit) construct library for enabling Enhanced Scanning on Amazon ECR (Elastic Container Registry) repositories.

## Overview

The `EnhancedScanning` construct allows you to easily enable and configure Enhanced Scanning for your ECR repositories using AWS CDK. This feature leverages Amazon Inspector to provide vulnerability scanning for container images.

## Installation

To install this construct library, run the following command in your project directory:

```bash
npm install @michelangelo17/cdk-ecr-enhanced-scanning
```

## Usage

Here's an example of how to use the `EnhancedScanning` construct in your CDK stack:

```typescript
import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs"
import { Repository } from "aws-cdk-lib/aws-ecr"
import { EnhancedScanning } from "@michelangelo17/cdk-ecr-enhanced-scanning"
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)
    // Create an ECR repository
    const repository = new Repository(this, "MyRepository")
    // Enable Enhanced Scanning for the repository
    const enhancedScanning = new EnhancedScanning(this, "EnhancedScanning", {
      repository: repository,
    })
    // Optionally, add CDK Nag suppressions
    enhancedScanning.addNagSuppressions(this)
  }
}
```

## Configuration Options

The `EnhancedScanning` construct accepts the following property:

- `repository`: The ECR repository to enable enhanced scanning for (required).

## CDK Nag Suppressions

The construct includes a method to add CDK Nag suppressions for known issues. To use it, call the `addNagSuppressions` method on your EnhancedScanning instance, passing the current stack as an argument:

```typescript
new EnhancedScanning(this, "EnhancedScanning", {
  repository: repository,
  rules: [
    {
      scanFrequency: "SCAN_ON_PUSH",
      repositoryFilters: [
        {
          filter: "prod-*",
          filterType: "WILDCARD",
        },
      ],
    },
  ],
})
```

## CDK Nag Suppressions

The construct includes a method to add CDK Nag suppressions for the warnings that are raised. To use it, call the addNagSuppressions method on your EnhancedScanning instance, passing the current stack as an argument:

```typescript
enhancedScanning.addNagSuppressions(this)
```

This will suppress the following warnings related to IAM permissions required for the Lambda function and custom resource provider:

1. AwsSolutions-IAM4: This warning is raised because the Lambda function uses the AWS managed policy AWSLambdaBasicExecutionRole. While it's generally recommended to create custom IAM policies, this managed policy is required for basic Lambda execution and logging.
2. AwsSolutions-IAM5: This warning occurs due to the use of wildcard permissions in the IAM policy. The Lambda function requires these permissions to interact with ECR and Inspector services. While more restrictive policies are generally preferred, the nature of this construct requires these permissions to function correctly.

These warnings are suppressed for both the main Lambda function (EnableScanLambda) and the custom resource provider's Lambda function (EnableScanCustomResource/framework-onEvent).

The specific permissions added to the Lambda function are:

```typescript
// Add IAM permissions to the Lambda function
this.enableScanLambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "inspector2:Enable",
      "inspector2:ListAccountPermissions",
      "iam:CreateServiceLinkedRole",
    ],
    resources: ["*"],
    effect: Effect.ALLOW,
    conditions: {
      StringEqualsIfExists: {
        "iam:AWSServiceName": "inspector2.amazonaws.com",
      },
    },
  })
)

// Add a scoped-down policy for PutRegistryScanningConfiguration
this.enableScanLambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ecr:PutRegistryScanningConfiguration"],
    resources: [props.repository.repositoryArn],
    effect: Effect.ALLOW,
  })
)
```

These permissions are necessary for the Lambda function to:

- Configure ECR scanning settings
- Enable Amazon Inspector
- Create the necessary service-linked role for Inspector

Users should be aware of these permissions and ensure they align with their security requirements. If more restrictive permissions are needed, users may need to modify the construct or implement additional security controls in their environment.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
