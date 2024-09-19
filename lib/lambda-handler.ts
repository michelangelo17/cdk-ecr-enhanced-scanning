import { ECR, Inspector2 } from 'aws-sdk'

const ecr = new ECR()
const inspector = new Inspector2()

export const handler = async () => {
  console.log('Attempting to enable Amazon Inspector...')
  await inspector.enable().promise()
  console.log('Amazon Inspector enabled successfully.')

  console.log('Attempting to enable enhanced scanning...')
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
    throw new Error(`Failed to enable enhanced scanning: ${error}`)
  }
}
