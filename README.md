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
    new EnhancedScanning(this, "EnhancedScanning", {
      repository: repository,
    })
  }
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
