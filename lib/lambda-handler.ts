import { ECR, Inspector2 } from 'aws-sdk'

const ecr = new ECR()
const inspector = new Inspector2()

export const handler = async () => {
  const accountId = process.env.AWS_ACCOUNT_ID

  if (!accountId) {
    throw new Error('Unable to determine AWS account ID')
  }

  // Parse the filters from the environment variable or use the default passed by CDK
  const filters = process.env.FILTERS ? JSON.parse(process.env.FILTERS) : false

  if (!filters) {
    throw new Error('No filters provided')
  }

  try {
    console.log('Attempting to enable Amazon Inspector...')
    await inspector
      .enable({
        resourceTypes: ['ECR'],
        accountIds: [accountId],
      })
      .promise()
    console.log('Amazon Inspector enabled successfully.')

    console.log('Attempting to enable enhanced scanning...')
    const params = {
      scanType: 'ENHANCED',
      rules: [
        {
          repositoryFilters: filters,
          scanFrequency: 'CONTINUOUS_SCAN',
        },
      ],
    }

    const result = await ecr.putRegistryScanningConfiguration(params).promise()
    console.log(
      'Enhanced scanning enabled successfully.',
      JSON.stringify(result)
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Enhanced scanning enabled successfully!',
        result,
      }),
    }
  } catch (error) {
    console.error('Error:', JSON.stringify(error, null, 2))
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to enable enhanced scanning',
        errorDetails: error instanceof Error ? error.stack : String(error),
      }),
    }
  }
}
