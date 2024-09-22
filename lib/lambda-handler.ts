import { ECR, Inspector2 } from 'aws-sdk'

const ecr = new ECR()
const inspector = new Inspector2()

const accountId = process.env.AWS_ACCOUNT_ID
const repositoryName = process.env.REPOSITORY_NAME

export const handler = async () => {
  if (!accountId) {
    throw new Error('Unable to determine AWS account ID')
  }

  if (!repositoryName) {
    throw new Error('No repository name provided')
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
          scanFrequency: 'CONTINUOUS_SCAN',
          repositoryFilters: [
            {
              filter: repositoryName,
              filterType: 'WILDCARD',
            },
          ],
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
