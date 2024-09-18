// import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface CdkEcrEnhancedScanningProps {
  // Define construct properties here
}

export class CdkEcrEnhancedScanning extends Construct {

  constructor(scope: Construct, id: string, props: CdkEcrEnhancedScanningProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkEcrEnhancedScanningQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
