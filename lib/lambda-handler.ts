import { ECR } from 'aws-sdk'

const ecr = new ECR()

export const handler = async () => {
  const params = {
    scanType: 'ENHANCED',
    rules: [
      {
        repositoryFilters: [
          {
            filter: '*', // Apply to all repositories
            filterType: 'WILDCARD',
          },
        ],
        scanFrequency: 'CONTINUOUS_SCAN',
      },
    ],
  }

  try {
    await ecr.putRegistryScanningConfiguration(params).promise()
    console.log('Enhanced scanning enabled successfully.')
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Enhanced scanning enabled successfully!',
      }),
    }
  } catch (error) {
    console.error('Error enabling enhanced scanning:', error)
    throw new Error('Failed to enable enhanced scanning')
  }
}
