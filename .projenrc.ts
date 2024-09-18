import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Michelangelo Markus',
  authorAddress: 'michelangelo.markus@superluminar.io',
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.5.0',
  name: 'cdk-ecr-enhanced-scanning',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/michelangelo.markus/cdk-ecr-enhanced-scanning.git',

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();